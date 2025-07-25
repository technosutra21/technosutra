/**
 * Techno Sutra AR - Security Implementation Tests
 * Automated security testing suite
 */

class SecurityTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    /**
     * Run all security tests
     */
    async runAllTests() {
        console.log('🔒 Starting Techno Sutra AR Security Tests...\n');

        await this.testInputValidation();
        await this.testFileAccessSecurity();
        await this.testCSPImplementation();
        await this.testIframeSecurity();
        await this.testRateLimiting();
        await this.testXSSPrevention();
        await this.testSecurityHeaders();

        this.displayResults();
        return this.results;
    }

    /**
     * Test input validation
     */
    async testInputValidation() {
        console.log('📝 Testing Input Validation...');

        // Test model ID validation
        this.test('Model ID validation - valid range', () => {
            const result = InputValidator.validateModelParam('25');
            return result.valid && result.sanitized === 25;
        });

        this.test('Model ID validation - out of range high', () => {
            const result = InputValidator.validateModelParam('100');
            return result.valid && result.sanitized === 56;
        });

        this.test('Model ID validation - out of range low', () => {
            const result = InputValidator.validateModelParam('-5');
            return result.valid && result.sanitized === 1;
        });

        this.test('Model ID validation - non-numeric', () => {
            const result = InputValidator.validateModelParam('abc');
            return result.valid && result.sanitized === 1;
        });

        // Test HTML sanitization
        this.test('HTML sanitization - script tags', () => {
            const dirty = '<script>alert("xss")</script>';
            const clean = InputValidator.sanitizeHTML(dirty);
            return !clean.includes('<script>') && clean.includes('&lt;script&gt;');
        });

        this.test('HTML sanitization - quotes and slashes', () => {
            const dirty = '"; DROP TABLE users; --';
            const clean = InputValidator.sanitizeHTML(dirty);
            return clean.includes('&quot;') && clean.includes('&#x2F;');
        });

        // Test URL parameter validation
        this.test('URL parameter validation', () => {
            // Mock URL parameters
            const originalLocation = window.location;
            window.location = { search: '?model=42&malicious=<script>' };
            
            const result = InputValidator.validateURLParameters();
            
            window.location = originalLocation;
            return result.sanitized.model === 42 && result.warnings.length > 0;
        });
    }

    /**
     * Test file access security
     */
    async testFileAccessSecurity() {
        console.log('📁 Testing File Access Security...');

        // Test valid file paths
        this.test('File path validation - valid model file', () => {
            const result = fileAccessSecurity.validateFilePath('modelo1.glb');
            return result.valid;
        });

        this.test('File path validation - valid USDZ file', () => {
            const result = fileAccessSecurity.validateFilePath('modelo25.usdz');
            return result.valid;
        });

        // Test directory traversal attacks
        this.test('File path validation - directory traversal', () => {
            const result = fileAccessSecurity.validateFilePath('../../../etc/passwd');
            return !result.valid;
        });

        this.test('File path validation - URL encoded traversal', () => {
            const result = fileAccessSecurity.validateFilePath('modelo1%2e%2e%2fpasswd.glb');
            return !result.valid;
        });

        // Test invalid extensions
        this.test('File path validation - executable extension', () => {
            const result = fileAccessSecurity.validateFilePath('malicious.exe');
            return !result.valid;
        });

        // Test model pattern validation
        this.test('Model file pattern - invalid number', () => {
            const result = fileAccessSecurity.validateModelFilePath('modelo99.glb');
            return !result.valid;
        });

        this.test('Model file pattern - invalid format', () => {
            const result = fileAccessSecurity.validateModelFilePath('model1.glb');
            return !result.valid;
        });
    }

    /**
     * Test CSP implementation
     */
    async testCSPImplementation() {
        console.log('🛡️ Testing CSP Implementation...');

        // Test CSP header presence
        this.test('CSP meta tag present', () => {
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            return cspMeta !== null;
        });

        this.test('CSP contains default-src self', () => {
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            const content = cspMeta ? cspMeta.getAttribute('content') : '';
            return content.includes("default-src 'self'");
        });

        this.test('CSP blocks object-src', () => {
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            const content = cspMeta ? cspMeta.getAttribute('content') : '';
            return content.includes("object-src 'none'");
        });

        // Test nonce generation
        this.test('CSP nonce generation', () => {
            const nonce = cspNonceManager.generateNonce();
            return typeof nonce === 'string' && nonce.length > 10;
        });

        this.test('CSP nonce validation', () => {
            const testScript = 'console.log("test");';
            const nonce = cspNonceManager.registerInlineScript(testScript);
            return cspNonceManager.validateNonce(nonce);
        });
    }

    /**
     * Test iframe security
     */
    async testIframeSecurity() {
        console.log('🔲 Testing iframe Security...');

        // Test origin validation
        this.test('iframe origin validation - allowed origin', () => {
            return iframeSecurity.isOriginAllowed(window.location.origin);
        });

        this.test('iframe origin validation - blocked origin', () => {
            return !iframeSecurity.isOriginAllowed('https://malicious-site.com');
        });

        // Test iframe src validation
        this.test('iframe src validation - HTTPS URL', () => {
            const result = iframeSecurity.validateIframeSrc('https://trusted-site.com/content');
            return result.valid;
        });

        this.test('iframe src validation - javascript URL blocked', () => {
            const result = iframeSecurity.validateIframeSrc('javascript:alert("xss")');
            return !result.valid;
        });

        this.test('iframe src validation - data URL blocked', () => {
            const result = iframeSecurity.validateIframeSrc('data:text/html,<script>alert("xss")</script>');
            return !result.valid;
        });

        // Test sandbox generation
        this.test('iframe sandbox generation', () => {
            const sandbox = iframeSecurity.generateSandboxValue(['allow-scripts', 'allow-same-origin']);
            return sandbox.includes('allow-scripts') && sandbox.includes('allow-same-origin');
        });
    }

    /**
     * Test rate limiting
     */
    async testRateLimiting() {
        console.log('⏱️ Testing Rate Limiting...');

        const rateLimiter = new RateLimiter();
        const testIdentifier = 'test-user-123';

        // Test normal rate limiting
        this.test('Rate limiting - allows normal requests', () => {
            return rateLimiter.checkLimit(testIdentifier);
        });

        // Test rate limit enforcement
        this.test('Rate limiting - blocks excessive requests', () => {
            // Simulate many requests
            for (let i = 0; i < 101; i++) {
                rateLimiter.checkLimit(testIdentifier + '-spam');
            }
            return !rateLimiter.checkLimit(testIdentifier + '-spam');
        });

        // Test blocked status
        this.test('Rate limiting - tracks blocked status', () => {
            const spamId = testIdentifier + '-spam2';
            // Trigger rate limit
            for (let i = 0; i < 101; i++) {
                rateLimiter.checkLimit(spamId);
            }
            return rateLimiter.isBlocked(spamId);
        });
    }

    /**
     * Test XSS prevention
     */
    async testXSSPrevention() {
        console.log('🚫 Testing XSS Prevention...');

        // Test HTML escaping
        this.test('XSS prevention - HTML escaping', () => {
            const malicious = '<img src="x" onerror="alert(1)">';
            const safe = XSSPrevention.escapeHTML(malicious);
            return !safe.includes('<img') && safe.includes('&lt;img');
        });

        // Test safe element creation
        this.test('XSS prevention - safe element creation', () => {
            const element = XSSPrevention.createSafeElement('div', 'Safe content', {
                'class': 'test-class',
                'data-value': 'safe-value'
            });
            return element.tagName === 'DIV' && 
                   element.textContent === 'Safe content' &&
                   element.className === 'test-class';
        });

        // Test unsafe attribute blocking
        this.test('XSS prevention - blocks unsafe attributes', () => {
            return !XSSPrevention.isSafeAttribute('onclick') && 
                   !XSSPrevention.isSafeAttribute('onerror') &&
                   XSSPrevention.isSafeAttribute('class');
        });

        // Test attribute value sanitization
        this.test('XSS prevention - sanitizes attribute values', () => {
            const dirty = 'javascript:alert("xss")';
            const clean = XSSPrevention.sanitizeAttributeValue(dirty);
            return !clean.includes('javascript:');
        });
    }

    /**
     * Test security headers
     */
    async testSecurityHeaders() {
        console.log('📋 Testing Security Headers...');

        // Test security meta tags
        this.test('X-Content-Type-Options header', () => {
            const meta = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
            return meta && meta.getAttribute('content') === 'nosniff';
        });

        this.test('X-Frame-Options header', () => {
            const meta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
            return meta && meta.getAttribute('content') === 'SAMEORIGIN';
        });

        this.test('X-XSS-Protection header', () => {
            const meta = document.querySelector('meta[http-equiv="X-XSS-Protection"]');
            return meta && meta.getAttribute('content') === '1; mode=block';
        });

        this.test('Referrer-Policy header', () => {
            const meta = document.querySelector('meta[http-equiv="Referrer-Policy"]');
            return meta && meta.getAttribute('content') === 'strict-origin-when-cross-origin';
        });

        // Test HTTPS usage (in production)
        this.test('HTTPS usage (production)', () => {
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                this.warning('HTTPS check skipped for localhost');
                return true;
            }
            return location.protocol === 'https:';
        });
    }

    /**
     * Run a single test
     */
    test(name, testFunction) {
        try {
            const result = testFunction();
            if (result) {
                console.log(`✅ ${name}`);
                this.results.passed++;
                this.results.tests.push({ name, status: 'passed' });
            } else {
                console.log(`❌ ${name}`);
                this.results.failed++;
                this.results.tests.push({ name, status: 'failed' });
            }
        } catch (error) {
            console.log(`❌ ${name} - Error: ${error.message}`);
            this.results.failed++;
            this.results.tests.push({ name, status: 'failed', error: error.message });
        }
    }

    /**
     * Log a warning
     */
    warning(message) {
        console.log(`⚠️ ${message}`);
        this.results.warnings++;
    }

    /**
     * Display final test results
     */
    displayResults() {
        console.log('\n🔒 Security Test Results:');
        console.log('═'.repeat(50));
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⚠️ Warnings: ${this.results.warnings}`);
        console.log(`📊 Total Tests: ${this.results.tests.length}`);
        
        const successRate = Math.round((this.results.passed / this.results.tests.length) * 100);
        console.log(`📈 Success Rate: ${successRate}%`);

        if (this.results.failed === 0) {
            console.log('\n🎉 All security tests passed! Your application is secure.');
        } else {
            console.log('\n⚠️ Some security tests failed. Please review the issues above.');
        }

        if (this.results.warnings > 0) {
            console.log('💡 Please review the warnings for potential improvements.');
        }

        console.log('\n📋 Test Summary:');
        this.results.tests.forEach(test => {
            const icon = test.status === 'passed' ? '✅' : '❌';
            console.log(`${icon} ${test.name}`);
            if (test.error) {
                console.log(`   Error: ${test.error}`);
            }
        });
    }

    /**
     * Generate security report
     */
    generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.tests.length,
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings,
                successRate: Math.round((this.results.passed / this.results.tests.length) * 100)
            },
            tests: this.results.tests,
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    /**
     * Generate security recommendations
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.results.failed > 0) {
            recommendations.push('Fix failing security tests before production deployment');
        }

        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            recommendations.push('Ensure HTTPS is enabled in production');
        }

        recommendations.push('Regularly monitor security logs for violations');
        recommendations.push('Keep security dependencies updated');
        recommendations.push('Perform periodic security audits');

        return recommendations;
    }
}

// Auto-run tests when script loads
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for other scripts to load
    setTimeout(async () => {
        if (window.location.search.includes('security-test=true')) {
            const tester = new SecurityTester();
            const results = await tester.runAllTests();
            
            // Store results in window for external access
            window.securityTestResults = results;
            
            // Generate report
            const report = tester.generateSecurityReport();
            console.log('\n📄 Security Report Generated:', report);
            
            // Export to global scope for debugging
            window.securityReport = report;
        }
    }, 1000);
});

// Export for manual testing
if (typeof window !== 'undefined') {
    window.SecurityTester = SecurityTester;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityTester };
}
