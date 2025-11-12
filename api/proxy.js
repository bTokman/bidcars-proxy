export default async function handler(req, res) {
    try {
        const targetUrl = req.query.url;

        if (!targetUrl) {
            return res.status(400).send('Missing "url" parameter.');
        }

        // дозволені хости
        const allowed = [
            'mercury.bid.cars',
            'www.mercury.bid.cars',
            'images.bid.cars',
            'cdn.bid.cars'
        ];

        let parsed;
        try {
            parsed = new URL(targetUrl);
        } catch {
            return res.status(400).send('Invalid URL');
        }

        if (!allowed.includes(parsed.host)) {
            return res.status(403).send('Host not allowed: ' + parsed.host);
        }

        // качаємо картинку як нормальний браузер
        const upstream = await fetch(parsed.toString(), {
            method: 'GET',
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept':
                    'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://bid.cars/'
            }
        });

        if (!upstream.ok) {
            return res
                .status(upstream.status)
                .send('Upstream error ' + upstream.status);
        }

        // беремо MIME
        const contentType = upstream.headers.get('content-type') || 'image/jpeg';

        const arrayBuffer = await upstream.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(buffer);
    } catch (e) {
        return res.status(500).send('Proxy error: ' + e.message);
    }
}
