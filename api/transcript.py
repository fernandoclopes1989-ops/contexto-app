from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
from youtube_transcript_api import YouTubeTranscriptApi

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        video_id = qs.get('videoId', [''])[0]
        
        if not video_id:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Missing videoId'}).encode('utf-8'))
            return

        try:
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
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 's-maxage=86400, stale-while-revalidate')
            self.end_headers()
            self.wfile.write(resp_bytes)
        except Exception as e:
            err_msg = json.dumps({'error': str(e)}).encode('utf-8')
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(err_msg)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
