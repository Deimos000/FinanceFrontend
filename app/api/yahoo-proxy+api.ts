
const USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const CACHE: Record<string, { data: any, timestamp: number }> = {};

export async function GET(request: Request) {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'quote';
    const query = url.searchParams.get('query');
    const symbol = url.searchParams.get('symbol');

    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    };

    try {
        let targetUrl = '';
        let cacheKey = '';
        let ttl = 60 * 1000; // Default 1 minute

        if (type === 'search') {
            if (!query) {
                return Response.json({ error: 'Query param required for search' }, { status: 400, headers });
            }
            targetUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
            cacheKey = `search:${query}`;
            ttl = 60 * 60 * 1000; // Cache searches for 1 hour
        } else {
            if (!symbol) {
                return Response.json({ error: 'Symbol param required for quote' }, { status: 400, headers });
            }
            const interval = url.searchParams.get('interval') || '1d';
            const range = url.searchParams.get('range') || '1y';
            targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
            cacheKey = `chart:${symbol}:${interval}:${range}`;

            // Cache charts longer
            if (interval === '1d' || interval === '1wk' || interval === '1mo') {
                ttl = 15 * 60 * 1000; // 15 mins for daily+ keys
            }
        }

        // Check Cache
        const cached = CACHE[cacheKey];
        if (cached && (Date.now() - cached.timestamp < ttl)) {
            // console.log(`[Yahoo Proxy] Serving from cache: ${cacheKey}`);
            return Response.json(cached.data, { status: 200, headers });
        }

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': getRandomUserAgent(),
            },
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Yahoo API Error: ${response.status} - ${text}`);

            // If rate limited, return a specific error
            if (response.status === 429) {
                return Response.json(
                    { error: 'Rate limit exceeded. Please try again later.', details: text },
                    { status: 429, headers }
                );
            }

            return Response.json(
                { error: `Yahoo API Error: ${response.statusText}`, details: text },
                { status: response.status, headers }
            );
        }

        const data = await response.json();

        // Save to Cache
        CACHE[cacheKey] = {
            data,
            timestamp: Date.now()
        };

        return Response.json(data, { status: 200, headers });

    } catch (error: any) {
        console.error('Proxy Error:', error);
        return Response.json(
            { error: 'Failed to fetch stock data', details: error.message },
            { status: 500, headers }
        );
    }
}
