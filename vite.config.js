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
      }
    }
  ],
  build: {
    outDir: 'dist'
  }
});
