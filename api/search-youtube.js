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
}
