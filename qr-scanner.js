
// QR Code Scanner Utility for Techno Sutra
// Handles QR code detection and model redirection

class QRScanner {
    constructor() {
        this.stream = null;
        this.isScanning = false;
        this.video = null;
        this.canvas = null;
        this.context = null;
    }

    async initialize(videoElement) {
        this.video = videoElement;
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            this.video.srcObject = this.stream;
            await this.video.play();
            
            return true;
        } catch (error) {
            console.error('Camera access error:', error);
            throw new Error('Camera access denied');
        }
    }

    startScanning(onQRDetected, onError) {
        if (this.isScanning) return;
        
        this.isScanning = true;
        
        const scanFrame = () => {
            if (!this.isScanning) return;
            
            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                
                const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
                
                try {
                    // Simple pattern matching for Techno Sutra URLs
                    const qrCode = this.detectTechnoSutraQR(imageData);
                    if (qrCode) {
                        const modelMatch = qrCode.match(/model=(\d+)/);
                        if (modelMatch) {
                            const modelNum = parseInt(modelMatch[1]);
                            if (modelNum >= 1 && modelNum <= 56) {
                                onQRDetected(modelNum);
                                return;
                            }
                        }
                    }
                } catch (error) {
                    if (onError) onError(error);
                }
            }
            
            // Continue scanning
            if (this.isScanning) {
                requestAnimationFrame(scanFrame);
            }
        };
        
        scanFrame();
    }

    stopScanning() {
        this.isScanning = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
    }

    // Simplified QR detection for Techno Sutra URLs
    // In production, integrate with jsQR library for better detection
    detectTechnoSutraQR(imageData) {
        // This is a placeholder for actual QR detection
        // For now, we'll simulate detection or use manual input
        // In production, use: const code = jsQR(imageData.data, imageData.width, imageData.height);
        return null;
    }

    // Static method to validate Techno Sutra model URLs
    static parseModelFromURL(url) {
        const patterns = [
            /technosutra21\.github\.io\/technosutra\/\?model=(\d+)/,
            /technosutra\.bhumisparshaschool\.org\/AR\.html\?model=(\d+)/,
            /model=(\d+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                const modelNum = parseInt(match[1]);
                if (modelNum >= 1 && modelNum <= 56) {
                    return modelNum;
                }
            }
        }
        
        return null;
    }

    // Test method to simulate QR detection
    static testQRCodes() {
        const testUrls = [
            'https://technosutra21.github.io/technosutra/?model=1',
            'https://technosutra.bhumisparshaschool.org/AR.html?model=25',
            'https://example.com/?model=56'
        ];

        testUrls.forEach(url => {
            const model = QRScanner.parseModelFromURL(url);
            console.log(`URL: ${url} -> Model: ${model}`);
        });
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRScanner;
} else {
    window.QRScanner = QRScanner;
}
