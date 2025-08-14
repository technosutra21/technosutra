// qr-scanner.js - Complete QR Scanner Implementation with jsQR
let qrStream = null;
let qrScanning = false;
let qrAnimationFrame = null;

class QRScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.isScanning = false;
        this.onResult = null;
        this.onError = null;
        
        // Bind methods
        this.tick = this.tick.bind(this);
    }

    async init(videoElement) {
        try {
            this.video = videoElement;
            
            // Create canvas for processing
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
            
            console.log('QR Scanner initialized');
            return true;
        } catch (error) {
            console.error('QR Scanner initialization failed:', error);
            if (this.onError) this.onError(error);
            return false;
        }
    }

    async start() {
        try {
            if (!this.video) {
                throw new Error('Video element not initialized');
            }

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 }
                }
            });

            this.video.srcObject = stream;
            this.video.setAttribute('playsinline', true); // iOS compatibility
            
            await new Promise((resolve, reject) => {
                this.video.onloadedmetadata = () => {
                    this.video.play()
                        .then(resolve)
                        .catch(reject);
                };
                this.video.onerror = reject;
            });

            // Start scanning
            this.isScanning = true;
            this.tick();
            
            console.log('QR Scanner started successfully');
            return true;

        } catch (error) {
            console.error('Failed to start QR scanner:', error);
            if (this.onError) {
                this.onError(new Error('Camera access denied or failed'));
            }
            return false;
        }
    }

    tick() {
        if (!this.isScanning || !this.video || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
            if (this.isScanning) {
                qrAnimationFrame = requestAnimationFrame(this.tick);
            }
            return;
        }

        try {
            // Set canvas dimensions to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            if (this.canvas.width === 0 || this.canvas.height === 0) {
                qrAnimationFrame = requestAnimationFrame(this.tick);
                return;
            }

            // Draw video frame to canvas
            this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Get image data
            const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Scan for QR code using jsQR
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            });

            if (qrCode && qrCode.data) {
                console.log('QR Code detected:', qrCode.data);
                this.handleQRResult(qrCode.data);
                return; // Stop scanning after successful detection
            }

        } catch (error) {
            console.error('QR scanning error:', error);
        }

        // Continue scanning
        qrAnimationFrame = requestAnimationFrame(this.tick);
    }

    handleQRResult(data) {
        console.log('Processing QR result:', data);
        
        // Try to extract model number from QR data
        let modelNumber = null;

        // Method 1: Direct number (1-56)
        const directNumber = parseInt(data);
        if (directNumber >= 1 && directNumber <= 56) {
            modelNumber = directNumber;
        }
        
        // Method 2: URL with model parameter
        if (!modelNumber) {
            try {
                const url = new URL(data);
                const modelParam = url.searchParams.get('model');
                if (modelParam) {
                    const paramNumber = parseInt(modelParam);
                    if (paramNumber >= 1 && paramNumber <= 56) {
                        modelNumber = paramNumber;
                    }
                }
            } catch (e) {
                // Not a valid URL, continue
            }
        }

        // Method 3: Pattern matching for common formats
        if (!modelNumber) {
            const patterns = [
                /model[:\s]*(\d+)/i,
                /chapter[:\s]*(\d+)/i,
                /sutra[:\s]*(\d+)/i,
                /(?:^|\D)(\d{1,2})(?:\D|$)/ // Any 1-2 digit number
            ];

            for (const pattern of patterns) {
                const match = data.match(pattern);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num >= 1 && num <= 56) {
                        modelNumber = num;
                        break;
                    }
                }
            }
        }

        if (modelNumber) {
            console.log(`Valid model number found: ${modelNumber}`);
            if (this.onResult) {
                this.onResult(modelNumber);
            }
        } else {
            console.warn('No valid model number found in QR data:', data);
            if (this.onError) {
                this.onError(new Error(`QR code data "${data}" does not contain a valid model number (1-56)`));
            }
        }
    }

    stop() {
        console.log('Stopping QR scanner');
        
        this.isScanning = false;
        
        if (qrAnimationFrame) {
            cancelAnimationFrame(qrAnimationFrame);
            qrAnimationFrame = null;
        }

        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => {
                track.stop();
                console.log('Camera track stopped');
            });
            this.video.srcObject = null;
        }
    }

    destroy() {
        this.stop();
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.onResult = null;
        this.onError = null;
    }
}

// Global QR Scanner instance
let globalQRScanner = null;

// Enhanced QR Scanner Functions
async function openQRScanner() {
    try {
        const qrModal = document.getElementById('qrModal');
        const qrVideo = document.getElementById('qrVideo');
        
        if (!qrModal || !qrVideo) {
            console.error('QR modal elements not found');
            return;
        }

        // Show modal
        qrModal.style.display = 'flex';
        
        // Update instruction
        updateQRInstruction('Initializing camera...');

        // Initialize scanner if needed
        if (!globalQRScanner) {
            globalQRScanner = new QRScanner();
            
            globalQRScanner.onResult = (modelNumber) => {
                console.log('QR scan successful:', modelNumber);
                updateQRInstruction(`Model ${modelNumber} detected!`);
                
                // Add visual feedback
                const frame = document.querySelector('.qr-scanner-frame');
                if (frame) {
                    frame.style.borderColor = '#00ff88';
                    frame.style.boxShadow = '0 0 30px #00ff88';
                }
                
                setTimeout(() => {
                    redirectToModel(modelNumber);
                }, 1000);
            };

            globalQRScanner.onError = (error) => {
                console.error('QR scan error:', error);
                updateQRInstruction(`Error: ${error.message}`);
                
                // Reset frame color
                const frame = document.querySelector('.qr-scanner-frame');
                if (frame) {
                    frame.style.borderColor = 'var(--neon-pink)';
                    frame.style.boxShadow = '0 0 20px var(--neon-pink)';
                }
            };
        }

        const initSuccess = await globalQRScanner.init(qrVideo);
        if (!initSuccess) {
            throw new Error('Scanner initialization failed');
        }

        const startSuccess = await globalQRScanner.start();
        if (!startSuccess) {
            throw new Error('Camera start failed');
        }

        updateQRInstruction('Point camera at QR code');
        
    } catch (error) {
        console.error('Failed to open QR scanner:', error);
        updateQRInstruction('Camera access denied. Use manual input below.');
        
        // Show alternative instruction
        setTimeout(() => {
            updateQRInstruction('Enter model number manually below');
        }, 3000);
    }
}

function closeQRScanner() {
    console.log('Closing QR scanner');
    
    const qrModal = document.getElementById('qrModal');
    if (qrModal) {
        qrModal.style.display = 'none';
    }

    if (globalQRScanner) {
        globalQRScanner.stop();
    }

    // Reset visual elements
    const frame = document.querySelector('.qr-scanner-frame');
    if (frame) {
        frame.style.borderColor = 'var(--neon-pink)';
        frame.style.boxShadow = '0 0 20px var(--neon-pink)';
    }
    
    updateQRInstruction('Point camera at QR code');
}

function updateQRInstruction(message) {
    const instruction = document.querySelector('.qr-instruction');
    if (instruction) {
        instruction.textContent = message;
    }
}

function redirectToModel(modelNum) {
    console.log(`Redirecting to model ${modelNum}`);
    closeQRScanner();

    // Add fade out effect
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = `AR.html?model=${modelNum}`;
    }, 500);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (globalQRScanner) {
        globalQRScanner.destroy();
    }
});

// Export for use in other scripts
window.QRScanner = QRScanner;
window.openQRScanner = openQRScanner;
window.closeQRScanner = closeQRScanner;
window.redirectToModel = redirectToModel;

console.log('QR Scanner module loaded successfully');