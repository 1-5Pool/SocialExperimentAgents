#!/usr/bin/env python3
"""
Simple HTTP server for the Social Experiment UI
Serves static files with proper MIME types for development
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Change to the UI directory
ui_dir = Path(__file__).parent
os.chdir(ui_dir)

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"""
🚀 Social Experiment UI Server Starting...

📂 Serving files from: {ui_dir}
🌐 Open your browser to: http://localhost:{PORT}

📝 Available pages:
   • http://localhost:{PORT}/           - Main Simulator
   • http://localhost:{PORT}/templates.html  - Template Manager  
   • http://localhost:{PORT}/experiments.html - Experiment Dashboard

🔧 Make sure backend is running on http://localhost:8000
   cd ../backend && bash deployment/run_local.sh

Press Ctrl+C to stop the server
""")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Shutting down server...")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Try a different port or stop the existing server.")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()