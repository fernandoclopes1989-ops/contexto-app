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
            const proxyUrls = [
              `https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}&lang=en`,
              `https://youtube-transcript-api.vercel.app/api?videoId=${videoId}`
            ];
            for (const pUrl of proxyUrls) {
              try {
                const response = await fetch(pUrl, { signal: AbortSignal.timeout(1500) });
                if (response.ok) {
                  const data = await response.json();
                  if (Array.isArray(data) && data.length > 0) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify(data));
                    return;
                  }
                }
              } catch (_) {}
            }
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Transcript unavailable' }));
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
