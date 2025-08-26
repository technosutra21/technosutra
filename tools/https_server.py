import http.server
import ssl
import os

# Define the server address and port
HOST = 'localhost'
PORT = 4443

# Change directory to the project folder
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Create the HTTP server
httpd = http.server.HTTPServer((HOST, PORT), http.server.SimpleHTTPRequestHandler)

# Create an SSL context
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile="cert.pem", keyfile="key.pem")

# Wrap the server socket with SSL
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f"Serving on https://{HOST}:{PORT}")
print("Press Ctrl+C to stop the server.")

# Start the server
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nShutting down the server...")
    httpd.server_close()
