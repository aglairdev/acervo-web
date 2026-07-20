const https = require('https');
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  const url = event.queryStringParameters?.url;
  if (!url || !url.includes('mediafire.com')) {
    return { statusCode: 400, headers: CORS, body: 'URL inválida' };
  }
  try {
    const html = await fetchPage(url);
    const match = html.match(
      /id="downloadButton"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*id="downloadButton"/
    );
    const direct = match?.[1] || match?.[2];

    if (!direct) {
      return { statusCode: 404, headers: CORS, body: 'Link direto não encontrado' };
    }
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: direct }),
    };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: err.message };
  }
};