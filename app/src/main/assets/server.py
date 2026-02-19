#!/usr/bin/env python3
"""
Physio SUAI - Local Development Server
Run this file to test the app locally on http://localhost:7700
"""

import http.server
import socketserver
import os

PORT = 7700

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

# Change to the script's directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = MyHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("=" * 60)
    print("🚀 Physio SUAI Development Server")
    print("=" * 60)
    print(f"✅ Server running at: http://localhost:{PORT}")
    print(f"✅ Open in browser:   http://localhost:{PORT}/index.html")
    print("✅ Press Ctrl+C to stop the server")
    print("=" * 60)
    print()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped.")
        pass
