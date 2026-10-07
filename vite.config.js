import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true
  },
  plugins: [
    {
      name: 'transcript-api',
      configureServer(server) {
        server.middlewares.use('/api/transcript', async (req, res) => {
          try {
            const url = new URL(req.url, 'http://localhost');
            const videoId = url.searchParams.get('videoId');
            if (!videoId) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing videoId' }));
              return;
            }

            // Execute Python API locally
            const { exec } = await import('child_process');
            exec(`python api/transcript.py`, { 
              env: { ...process.env, REQUEST_METHOD: 'GET', QUERY_STRING: `videoId=${videoId}` } 
            }, (error, stdout, stderr) => {
              const pyScript = `
import sys, json
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    ytt = YouTubeTranscriptApi()
    t_list = ytt.list(video_id='${videoId}')
    
    transcripts = None
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
            
    if not transcripts:
        transcripts = ytt.fetch('${videoId}', languages=['en', 'en-US', 'en-GB', 'pt', 'pt-BR'])
        
    data = [{'text': t['text'], 'start': round(t['start'], 2), 'duration': round(t['duration'], 2)} for t in transcripts]
    print(json.dumps(data))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;
              exec(`python -c "${pyScript.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`, { maxBuffer: 1024 * 1024 * 10 }, (err, out, errOut) => {
                try {
                  const data = JSON.parse(out);
                  if (data.error) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  } else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify(data));
                  }
                } catch (e) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Failed to parse python output: ' + e.message }));
                }
              });
            });

          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
        });

        server.middlewares.use('/api/search-youtube', async (req, res) => {
          try {
            const url = new URL(req.url, 'http://localhost');
            const query = url.searchParams.get('q');
            if (!query) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing query (q)' }));
              return;
            }

            const ytUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);
            const response = await fetch(ytUrl, {
              headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
              }
            });
            const html = await response.text();
            const match = html.match(/ytInitialData\s*=\s*({.+?});/);
            
            if (match) {
              const data = JSON.parse(match[1]);
              const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
              
              const videos = [];
              if (Array.isArray(contents)) {
                for (const item of contents) {
                  if (item.videoRenderer) {
                    const v = item.videoRenderer;
                    if (v.videoId) {
                      videos.push({
                        id: v.videoId,
                        title: v.title?.runs?.[0]?.text || "Vídeo do YouTube",
                        duration: v.lengthText?.simpleText || v.lengthText?.accessibility?.accessibilityData?.label || "",
                        thumbnail: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`
                      });
                    }
                  }
                }
              }
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(videos));
              return;
            }

            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Search failed or parse error' }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      }
    }
  ],
  build: {
    outDir: 'dist'
  }
});
