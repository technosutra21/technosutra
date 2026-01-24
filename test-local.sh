#!/bin/bash

# Techno Sutra AR - Local Testing Helper
# Quick commands for testing the implementation

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get local IP
get_ip() {
    python3 -c "import socket; s = socket.socket(); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()" 2>/dev/null || echo "127.0.0.1"
}

# Print header
print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Techno Sutra AR - Local Testing${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Show usage
show_usage() {
    echo -e "${YELLOW}Usage:${NC} ./test-local.sh [command]"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  network       Start HTTPS network server (test on local network)"
    echo "  local         Start HTTPS localhost server (test on same machine)"
    echo "  http          Start HTTP dev server (no HTTPS needed)"
    echo "  verify        Verify all implementation changes"
    echo "  test          Run test suite"
    echo "  lint          Check code quality"
    echo "  lint:fix      Auto-fix code quality issues"
    echo "  clean         Clear browser cache (DevTools needed)"
    echo "  certs         Show certificate info"
    echo "  ip            Show local network IP"
    echo "  help          Show this help message"
    echo ""
}

# Network server
start_network_server() {
    print_header
    echo -e "${GREEN}✓${NC} Starting HTTPS Network Server"
    echo ""
    python3 https_server_network.py
}

# Local server
start_local_server() {
    print_header
    echo -e "${GREEN}✓${NC} Starting HTTPS Localhost Server (port 4443)"
    echo ""
    python3 https_server.py
}

# HTTP dev server
start_http_server() {
    print_header
    echo -e "${GREEN}✓${NC} Starting HTTP Dev Server (port 8000)"
    echo "   Note: AR features may not work without HTTPS"
    echo ""
    python3 -m http.server 8000
}

# Verify implementation
verify_impl() {
    print_header
    ./verify-implementation.sh
}

# Run tests
run_tests() {
    print_header
    echo -e "${GREEN}✓${NC} Running Test Suite"
    echo ""
    npm test
}

# Lint code
run_lint() {
    print_header
    echo -e "${GREEN}✓${NC} Checking Code Quality"
    echo ""
    npm run lint
}

# Fix lint issues
fix_lint() {
    print_header
    echo -e "${GREEN}✓${NC} Fixing Code Quality Issues"
    echo ""
    npm run lint:fix
    echo ""
    echo -e "${GREEN}✓${NC} Fixed! Re-run 'npm run lint' to verify"
}

# Show certificate info
show_certs() {
    print_header
    if [ ! -f cert.pem ] || [ ! -f key.pem ]; then
        echo -e "${RED}✗${NC} Certificates not found!"
        echo ""
        echo "Generate with:"
        echo "  openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes"
        return 1
    fi
    
    echo -e "${GREEN}✓${NC} Certificates Found"
    echo ""
    echo "Certificate Info:"
    openssl x509 -in cert.pem -text -noout | grep -E "Subject:|Issuer:|Not Before|Not After|CN="
}

# Show local IP
show_ip() {
    print_header
    IP=$(get_ip)
    echo -e "${GREEN}✓${NC} Your Local Network IP:"
    echo ""
    echo "   https://${IP}:4443"
    echo ""
    echo "Test on iPhone/Android:"
    echo "   1. Connect to same Wi-Fi"
    echo "   2. Open Safari/Chrome"
    echo "   3. Visit: https://${IP}:4443"
    echo "   4. Allow certificate warning"
}

# Clean cache (instructions)
clean_cache() {
    print_header
    echo -e "${YELLOW}⚠${NC}  To Clear Browser Cache:"
    echo ""
    echo "Safari:"
    echo "  1. DevTools (Cmd+Option+I)"
    echo "  2. Storage/Application tab"
    echo "  3. Right-click → Delete"
    echo ""
    echo "Chrome:"
    echo "  1. DevTools (F12)"
    echo "  2. Application tab"
    echo "  3. Storage → Clear site data"
    echo ""
    echo "Or:"
    echo "  • Clear browser history"
    echo "  • Delete cookies"
    echo "  • Unregister Service Worker"
    echo ""
}

# Main
main() {
    print_header
    
    case "${1:-}" in
        network)
            start_network_server
            ;;
        local)
            start_local_server
            ;;
        http)
            start_http_server
            ;;
        verify)
            verify_impl
            ;;
        test)
            run_tests
            ;;
        lint)
            run_lint
            ;;
        lint:fix)
            fix_lint
            ;;
        certs)
            show_certs
            ;;
        ip)
            show_ip
            ;;
        clean)
            clean_cache
            ;;
        help|--help|-h|'')
            show_usage
            ;;
        *)
            echo -e "${RED}✗${NC} Unknown command: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
