#!/usr/bin/env python3
"""
Simple HTTP server for volleyball voting system
"""

import http.server
import socketserver
import os
import sys

PORT = 8082

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Add CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            # Serve files from current directory
            if self.path == '/':
                self.path = '/volleyball-voting.html'
            
            filepath = self.path.lstrip('/')
            if os.path.exists(filepath):
                with open(filepath, 'rb') as f:
                    content = f.read()
                    self.wfile.write(content)
            else:
                self.wfile.write(b'File not found')
        except Exception as e:
            self.wfile.write(f'Error: {str(e)}'.encode())

if __name__ == "__main__":
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"Server running at http://localhost:{PORT}")
            print("Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
