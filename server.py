#!/usr/bin/env python3
"""
Simple HTTP server for volleyball voting system
Serves all files locally to avoid browser tracking prevention issues
"""

import http.server
import socketserver
import os
from urllib.parse import urlparse

class VolleyballServer:
    def __init__(self, host='localhost', port=8081):
        self.host = host
        self.port = port
        self.server = http.server.HTTPServer
        self.handler = self.VolleyballHandler
        
    def start(self):
        print(f"Starting volleyball server on http://{self.host}:{self.port}")
        print("Available files:")
        print("  - volleyball-voting.html")
        print("  - volleyball-voting.js")
        print("  - volleyball-mobile.html")
        print("  - volleyball-mobile.js")
        print("  - volleyball-login.html")
        print("  - volleyball-login.js")
        print("  - volleyball-voting-admin.html")
        print("  - volleyball-voting-admin.js")
        print("  - tailwind.min.css")
        print("  - font-awesome.min.css")
        print("  - emailjs.min.js")
        
        try:
            self.server.socketserver = socketserver.ThreadingTCPServer((self.host, self.port), self.handler)
            self.server.socketserver.serve_forever()
        except KeyboardInterrupt:
            print("\n Server stopped by user")
        except Exception as e:
            print(f"Server error: {e}")
    
    class VolleyballHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self):
            pass
        
        def do_GET(self):
            # Parse the URL path
            parsed_path = urlparse(self.path).path
            
            # Determine content type based on file extension
            if parsed_path.endswith('.html'):
                content_type = 'text/html'
            elif parsed_path.endswith('.css'):
                content_type = 'text/css'
            elif parsed_path.endswith('.js'):
                content_type = 'application/javascript'
            else:
                content_type = 'text/plain'
            
            # Serve the file
            try:
                with open(os.path.join('.', parsed_path.lstrip('/')), 'rb') as f:
                    content = f.read()
                    self.send_response(200, content, content_type)
            except FileNotFoundError:
                self.send_response(404, b'File not found', 'text/plain')
            except Exception as e:
                self.send_response(500, str(e).encode(), 'text/plain')
        
        def do_POST(self):
            # Handle POST requests (for future use)
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b''
            
            # For now, just return a simple response
            self.send_response(200, b'POST request received', 'text/plain')
        
        def send_response(self, status_code, content, content_type):
            self.send_response(status_code)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        
        def log_request(self, method, path, status_code=200):
            timestamp = http.server.HTTPServer.date_time_string()
            print(f"[{timestamp}] {method} {path} - {status_code}")

if __name__ == '__main__':
    server = VolleyballServer()
    server.start()
