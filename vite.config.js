import { defineConfig } from 'vite';
import { YoutubeTranscript } from 'youtube-transcript';

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

            // 1. Fetch transcript using official/innertube extraction
            try {
              const raw = await YoutubeTranscript.fetchTranscript(videoId);
              if (Array.isArray(raw) && raw.length > 0) {
                const formatted = raw.map(item => ({
                  start: Math.round((item.offset / 1000) * 10) / 10,
                  duration: Math.max(2.5, Math.round((item.duration / 1000) * 10) / 10),
                  text: (item.text || '')
                    .replace(/&amp;/g, '&')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/\n+/g, ' ')
                    .trim()
                })).filter(i => i.text.length > 0 && !i.text.startsWith('[Music]') && !i.text.startsWith('[Applause]'));

                if (formatted.length > 0) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify(formatted));
                  return;
                }
              }
            } catch (ytErr) {
              console.warn(`[transcript-api] YoutubeTranscript failed for ${videoId}:`, ytErr.message);
            }

            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Transcript unavailable for this video' }));
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
