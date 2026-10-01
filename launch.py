"""
Contexto App Launcher
Starts a local multi-threaded HTTP server and opens the app in the browser.
Accessible on both PC (localhost) and Mobile (via local Wi-Fi IP).
"""
import http.server
import socketserver
import webbrowser
import os
import sys
import threading
import socket

# Ensure UTF-8 output on Windows terminal
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def safe_print(*args):
    try:
        print(*args)
    except Exception:
        clean = [str(a).encode('ascii', errors='replace').decode('ascii') for a in args]
        print(*clean)

PORT = 5500
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
os.chdir(DIRECTORY)

def get_local_ip():
    """Detect local LAN IP for mobile access on same Wi-Fi."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

import json
import urllib.parse

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that serves files and provides transcript API."""
    def log_message(self, format, *args):
        pass  # Silence logs
        
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/transcript':
            qs = urllib.parse.parse_qs(parsed.query)
            video_id = qs.get('videoId', [''])[0]
            if not video_id:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"error": "Missing videoId"}')
                return

            try:
                from youtube_transcript_api import YouTubeTranscriptApi
                ytt = YouTubeTranscriptApi()
                transcripts = None
                try:
                    t_list = ytt.list(video_id=video_id)
                    try:
                        transcripts = t_list.find_transcript(['en', 'en-US', 'en-GB']).fetch()
                    except Exception:
                        pass
                    if not transcripts:
                        try:
                            transcripts = t_list.find_generated_transcript(['en', 'en-US', 'en-GB']).fetch()
                        except Exception:
                            pass
                    if not transcripts:
                        for t in t_list:
                            transcripts = t.fetch()
                            break
                except Exception:
                    pass

                if not transcripts:
                    transcripts = ytt.fetch(video_id, languages=['en', 'en-US', 'en-GB', 'pt', 'pt-BR'])

                data = [{'text': t.text, 'start': round(t.start, 2), 'duration': round(t.duration, 2)} for t in transcripts]
                resp_bytes = json.dumps(data).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(resp_bytes)))
                self.end_headers()
                self.wfile.write(resp_bytes)
                return
            except Exception as e:
                err_msg = json.dumps({'error': str(e)}).encode('utf-8')
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_msg)))
                self.end_headers()
                self.wfile.write(err_msg)
                return

        return super().do_GET()

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """Multi-threaded HTTP server to prevent Chrome connection blocking."""
    daemon_threads = True
    allow_reuse_address = True

def open_browser():
    """Open app in browser after a short pause, avoiding Guest profile."""
    import time
    import subprocess
    time.sleep(0.6)
    url = f"http://localhost:{PORT}/index.html"
    
    # Try Chrome first with Default profile to avoid guest mode
    chrome_paths = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe")
    ]
    for cp in chrome_paths:
        if os.path.exists(cp):
            try:
                subprocess.Popen([cp, "--profile-directory=Default", url])
                return
            except Exception:
                pass

    # Fallback to standard system browser
    webbrowser.open(url)

if __name__ == "__main__":
    local_ip = get_local_ip()
    try:
        httpd = ThreadedHTTPServer(("", PORT), QuietHandler)
        safe_print("======================================================")
        safe_print("🎯  CONTEXTO — ESTUDO DE INGLÊS COM VÍDEOS")
        safe_print("======================================================")
        safe_print(f"💻  No seu Computador:   http://localhost:{PORT}/index.html")
        if local_ip != "127.0.0.1":
            safe_print(f"📱  No seu Celular:      http://{local_ip}:{PORT}/index.html")
            safe_print("    (Basta estar conectado no mesmo Wi-Fi do computador)")
        safe_print("======================================================")
        safe_print("Para fechar o app, pressione Ctrl+C ou feche esta janela.\n")
        
        threading.Thread(target=open_browser, daemon=True).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            safe_print("\n👋 Contexto App encerrado.")
            sys.exit(0)
    except OSError:
        safe_print(f"⚠️ Porta {PORT} já está ativa ou em uso. Abrindo navegador...")
        webbrowser.open(f"http://localhost:{PORT}/index.html")
