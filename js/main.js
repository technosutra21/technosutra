// Constants
const MAX_MODEL_NUMBER = 56;
const MIN_MODEL_NUMBER = 1;
const ANIMATION_FRAME_RATE = 30; // fps for canvas animations
const QR_SCAN_INTERVAL = 500; // ms

// Global variables
let qrStream = null;
let deferredPrompt = null;
let isAppInstalled = false;
let currentNotification = null;
let animationFrameId = null;
let lastFrameTime = 0;

// DOM elements (will be initialized after DOM load)
let installButton, qrReaderBtn, closeQrModal, qrModal, qrVideo, manualModelBtn, manualModelInput;

// Utility functions
function validateModelNumber(input) {
    const num = parseInt(input, 10);
    return Number.isInteger(num) && num >= MIN_MODEL_NUMBER && num <= MAX_MODEL_NUMBER;
}

function sanitizeInput(input) {
    return input.toString().replace(/[^0-9]/g, '');
}

function checkReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Security helpers
function sanitizeModelParam(param) {
    const sanitized = sanitizeInput(param);
    const num = parseInt(sanitized, 10);
    return validateModelNumber(num) ? num : null;
}

function createSecureUrl(modelNum) {
    const validatedNum = sanitizeModelParam(modelNum);
    if (!validatedNum) {
        throw new Error('Invalid model number');
    }
    return `AR.html?model=${encodeURIComponent(validatedNum)}`;
}

// PWA Installation Logic
function checkIfAppInstalled() {
    // Check for standalone mode (iOS)
    if (window.navigator.standalone === true) {
        return true;
    }
    
    // Check for display-mode standalone (Android/Chrome)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    
    // Check for related applications (newer PWA API)
    if ('getInstalledRelatedApps' in navigator) {
        navigator.getInstalledRelatedApps().then(apps => {
            return apps.length > 0;
        }).catch(() => false);
    }
    
    return false;
}

function updateInstallButton() {
    if (!installButton) return;
    
    if (isAppInstalled) {
        installButton.classList.add('installed');
        installButton.innerHTML = `
            <span class="icon">✅</span>
            <span class="text">App Instalado</span>
        `;
        installButton.title = 'App já está instalado e disponível offline';
        installButton.setAttribute('aria-label', 'Aplicativo já instalado');
    } else {
        installButton.classList.remove('installed');
        installButton.innerHTML = `
            <span class="icon">💾</span>
            <span class="text">Install Offline App</span>
        `;
        installButton.title = 'Instalar app para uso offline completo';
        installButton.setAttribute('aria-label', 'Instalar aplicativo para uso offline');
    }
}

async function handleInstallClick() {
    try {
        if (isAppInstalled) {
            showNotification(
                '✅ App Já Instalado',
                'O Techno Sutra AR já está instalado e funcionando offline!',
                'info',
                4000
            );
            return;
        }

        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
                isAppInstalled = true;
                updateInstallButton();

                setTimeout(() => {
                    triggerCompleteOfflineCaching();
                }, 2000);

                showNotification(
                    '🎉 App Instalado!',
                    'Preparando conteúdo para uso offline...',
                    'success',
                    5000
                );
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        } else {
            showNotification(
                '📦 Preparando Offline',
                'Baixando conteúdo para uso offline...',
                'info',
                3000
            );
            triggerCompleteOfflineCaching();
        }
    } catch (error) {
        console.error('PWA installation error:', error);
        showNotification(
            '⚠️ Erro na Instalação',
            'Não foi possível instalar o app. Tente novamente.',
            'error',
            4000
        );
    }
}

function initializePWA() {
    if (!installButton) return;

    isAppInstalled = checkIfAppInstalled();
    updateInstallButton();

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        try {
            e.preventDefault();
            deferredPrompt = e;
            isAppInstalled = false;
            updateInstallButton();
            console.log('PWA install prompt available');
        } catch (error) {
            console.error('PWA prompt error:', error);
        }
    });

    // Handle install button click
    installButton.addEventListener('click', handleInstallClick);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
        try {
            isAppInstalled = true;
            updateInstallButton();
            console.log('PWA was installed successfully');

            showNotification(
                '🎉 Instalação Completa!',
                'App instalado com sucesso. Preparando para uso offline...',
                'success',
                4000
            );
        } catch (error) {
            console.error('PWA installed event error:', error);
        }
    });

    // Monitor display mode changes
    if ('matchMedia' in window) {
        const displayModeQuery = window.matchMedia('(display-mode: standalone)');
        const handleDisplayModeChange = (e) => {
            isAppInstalled = e.matches;
            updateInstallButton();
            console.log(`Display mode changed: ${e.matches ? 'standalone' : 'browser'}`);
        };
        
        if (displayModeQuery.addEventListener) {
            displayModeQuery.addEventListener('change', handleDisplayModeChange);
        } else {
            // Fallback for older browsers
            displayModeQuery.addListener(handleDisplayModeChange);
        }
    }

    // Periodic check for install status
    setInterval(() => {
        const wasInstalled = isAppInstalled;
        isAppInstalled = checkIfAppInstalled();
        if (wasInstalled !== isAppInstalled) {
            updateInstallButton();
            console.log(`Install status changed: ${isAppInstalled ? 'installed' : 'not installed'}`);
        }
    }, 5000);
}

// QR Scanner Functions
async function openQRScanner() {
    try {
        if (!qrModal || !qrVideo) return;
        
        qrModal.style.display = 'flex';
        qrModal.setAttribute('aria-hidden', 'false');

        // Request camera permission with proper error handling
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 400 },
                height: { ideal: 300 }
            }
        };

        qrStream = await navigator.mediaDevices.getUserMedia(constraints);
        qrVideo.srcObject = qrStream;
        qrVideo.setAttribute('aria-label', 'QR Code scanner camera feed');
        
        await qrVideo.play();
        startQRDetection();

    } catch (error) {
        console.error('Camera access error:', error);
        
        let message = 'Acesso à câmera negado. Você ainda pode inserir o número do modelo manualmente.';
        if (error.name === 'NotFoundError') {
            message = 'Câmera não encontrada. Use a entrada manual abaixo.';
        } else if (error.name === 'NotAllowedError') {
            message = 'Permissão de câmera negada. Permita o acesso ou use a entrada manual.';
        }
        
        showNotification('⚠️ Erro da Câmera', message, 'warning', 6000);
    }
}

function closeQRScanner() {
    if (!qrModal) return;
    
    qrModal.style.display = 'none';
    qrModal.setAttribute('aria-hidden', 'true');

    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
}

function startQRDetection() {
    if (!qrVideo) return;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    function scanFrame() {
        if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA && qrModal.style.display === 'flex') {
            canvas.width = qrVideo.videoWidth;
            canvas.height = qrVideo.videoHeight;
            context.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);

            // Integrate with jsQR library for QR code detection
            try {
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                if (window.jsQR) {
                    const code = window.jsQR(imageData.data, canvas.width, canvas.height, {
                        inversionAttempts: "dontInvert",
                    });
                    
                    if (code) {
                        console.log("QR Code detected:", code.data);
                        // Check if the QR code contains a valid model number
                        const modelMatch = code.data.match(/model=(\d+)/);
                        if (modelMatch && modelMatch[1]) {
                            const modelNum = parseInt(modelMatch[1], 10);
                            if (validateModelNumber(modelNum)) {
                                redirectToModel(modelNum);
                                return; // Stop scanning after successful detection
                            }
                        }
                    }
                }
                setTimeout(scanFrame, QR_SCAN_INTERVAL);
            } catch (error) {
                console.error("QR scanning error:", error);
                setTimeout(scanFrame, QR_SCAN_INTERVAL);
            }
        } else if (qrModal.style.display === 'flex') {
            setTimeout(scanFrame, 100);
        }
    }

    scanFrame();
}

function redirectToModel(modelNum) {
    const validatedNum = sanitizeModelParam(modelNum);
    if (!validatedNum) {
        showNotification(
            '⚠️ Número Inválido',
            `Por favor, insira um número entre ${MIN_MODEL_NUMBER} e ${MAX_MODEL_NUMBER}`,
            'error',
            4000
        );
        return;
    }

    console.log(`Redirecting to model ${validatedNum}`);
    closeQRScanner();

    // Add fade out effect
    document.body.classList.add('fade-out');
    
    setTimeout(() => {
        try {
            const secureUrl = createSecureUrl(validatedNum);
            window.location.href = secureUrl;
        } catch (error) {
            console.error('Redirect error:', error);
            showNotification('⚠️ Erro', 'Falha ao carregar o modelo.', 'error', 4000);
            document.body.classList.remove('fade-out');
        }
    }, 500);
}

// Notification System
function showNotification(title, message, type = 'info', duration = 5000) {
    // Remove existing notification
    hideNotification();

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    notification.innerHTML = `
        <div class="notification-content">
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
    `;

    document.body.appendChild(notification);
    currentNotification = notification;

    if (duration > 0) {
        setTimeout(() => {
            hideNotification();
        }, duration);
    }
}

function hideNotification() {
    if (currentNotification && currentNotification.parentElement) {
        currentNotification.style.animation = 'slideDown 0.3s ease-out reverse';
        setTimeout(() => {
            if (currentNotification && currentNotification.parentElement) {
                currentNotification.remove();
            }
        }, 300);
        currentNotification = null;
    }
}

// Enhanced Background Animation with Performance Optimization
function initializeBackgroundAnimation() {
    const canvas = document.getElementById('dynamicBackgroundCanvas');
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) {
        console.warn('Canvas not available, showing fallback');
        showErrorFallback('Canvas not supported');
        return;
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Check for reduced motion preference
    if (checkReducedMotion()) {
        console.log('Reduced motion preferred, using static background');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Optimized animation with frame rate control
    let time = 0;
    const targetFrameRate = ANIMATION_FRAME_RATE;
    const frameInterval = 1000 / targetFrameRate;

    function render(currentTime) {
        if (currentTime - lastFrameTime >= frameInterval) {
            time += 0.016;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw optimized particles
            const particleCount = Math.min(50, Math.floor(canvas.width * canvas.height / 20000));
            for (let i = 0; i < particleCount; i++) {
                const x = (Math.sin(time * 0.5 + i) * 200 + canvas.width / 2);
                const y = (Math.cos(time * 0.3 + i) * 150 + canvas.height / 2);
                const alpha = 0.5 + 0.5 * Math.sin(time + i);

                ctx.fillStyle = `rgba(0, 255, 149, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            lastFrameTime = currentTime;
        }

        animationFrameId = requestAnimationFrame(render);
    }

    render(0);
    hideErrorFallback();
}

// Enhanced PWA with Complete Offline Caching
function triggerCompleteOfflineCaching() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        console.log('🚀 Triggering complete offline caching for PWA...');

        showNotification(
            '📦 Preparing Offline Content',
            'Downloading all models and pages for offline use...',
            'info',
            0
        );

        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
            const { type, success, message } = event.data;
            if (type === 'COMPLETE_CACHE_FINISHED') {
                hideNotification();
                showNotification(
                    success ? '✅ App Ready Offline!' : '⚠️ Partial Offline Setup',
                    message || (success ? 'All content cached successfully!' : 'Some content failed to cache'),
                    success ? 'success' : 'warning',
                    6000
                );
            }
        };

        navigator.serviceWorker.controller.postMessage({
            type: 'FORCE_COMPLETE_CACHE'
        }, [messageChannel.port2]);
    }
}

// Error Handling
function hideErrorFallback() {
    const errorFallback = document.getElementById('errorFallback');
    const canvasFallback = document.getElementById('canvasFallback');
    if (errorFallback) errorFallback.style.display = 'none';
    if (canvasFallback) canvasFallback.style.display = 'none';
}

function showErrorFallback(message) {
    console.warn('Fallback activated:', message);
    const errorFallback = document.getElementById('errorFallback');
    const canvasFallback = document.getElementById('canvasFallback');

    if (errorFallback) {
        errorFallback.style.display = 'block';
        errorFallback.textContent = message;
    }
    if (canvasFallback) canvasFallback.style.display = 'block';

    const canvas = document.getElementById('dynamicBackgroundCanvas');
    if (canvas) canvas.style.display = 'none';
}

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { type: 'module' }).then(registration => {
            console.log('SW registered successfully');

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showNotification(
                                '🔄 Update Available',
                                'A new version is ready. Refresh to update.',
                                'info',
                                0
                            );
                        }
                    });
                }
            });

            // Force complete cache on first visit
            if (registration.active) {
                registration.active.postMessage({
                    type: 'CACHE_ALL_ASSETS'
                });
            }

            // Listen for update messages
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data.type === 'UPDATE_AVAILABLE') {
                    showNotification(
                        '🔄 App Updated',
                        'New features available! Refresh to update.',
                        'success',
                        8000
                    );
                }
            });
        }).catch(error => {
            console.warn('SW registration failed:', error);
        });
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // QR Scanner
    qrReaderBtn?.addEventListener('click', openQRScanner);
    closeQrModal?.addEventListener('click', closeQRScanner);
    
    // Modal click outside to close
    qrModal?.addEventListener('click', (e) => {
        if (e.target === qrModal) {
            closeQRScanner();
        }
    });

    // Manual model input
    manualModelBtn?.addEventListener('click', () => {
        const input = manualModelInput?.value;
        if (input && validateModelNumber(input)) {
            redirectToModel(input);
        } else {
            showNotification(
                '⚠️ Número Inválido',
                `Por favor, insira um número entre ${MIN_MODEL_NUMBER} e ${MAX_MODEL_NUMBER}`,
                'error',
                4000
            );
        }
    });

    // Enter key on manual input
    manualModelInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            manualModelBtn?.click();
        }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && qrModal?.style.display === 'flex') {
            closeQRScanner();
        }
    });

    // Offline button
    document.getElementById('offline-button')?.addEventListener('click', () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.active?.postMessage({
                    type: 'FORCE_CACHE_ALL'
                });
            });
        }
    });
}

// Accessibility helpers
function setupAccessibility() {
    // Add skip link functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector('.mandala-container');
            if (target) {
                target.focus();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Enhance focus management for mandala items
    const mandalaItems = document.querySelectorAll('.mandala-item');
    mandalaItems.forEach((item, index) => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `Capítulo ${index + 1} do Avatamsaka Sutra`);
        
        // Add keyboard support
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });
}

// Main initialization
function initializeApp() {
    try {
        // Initialize DOM element references
        installButton = document.getElementById('installButton');
        qrReaderBtn = document.getElementById('qrReaderBtn');
        closeQrModal = document.getElementById('closeQrModal');
        qrModal = document.getElementById('qrModal');
        qrVideo = document.getElementById('qrVideo');
        manualModelBtn = document.getElementById('manualModelBtn');
        manualModelInput = document.getElementById('manualModelInput');

        // Setup all functionality
        setupEventListeners();
        setupAccessibility();
        initializePWA();
        initializeBackgroundAnimation();
        registerServiceWorker();

        console.log('🚀 Techno Sutra AR initialized successfully');

    } catch (error) {
        console.error('Main initialization error:', error);
        showNotification(
            '⚠️ Initialization Error',
            'Some features may not work properly. Please refresh the page.',
            'error',
            6000
        );
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
    }
});
