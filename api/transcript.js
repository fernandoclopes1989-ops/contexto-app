import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
  // Setup CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const videoId = url.searchParams.get('videoId');

    if (!videoId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing videoId' }));
      return;
    }

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

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Transcript unavailable for this video' }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
}
