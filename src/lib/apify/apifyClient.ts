const APIFY_BASE_URL = 'https://api.apify.com/v2';

function getApifyToken(): string {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
        throw new Error('APIFY_API_TOKEN environment variable is not set');
    }
    return token;
}

export async function apifyFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = getApifyToken();
    const url = `${APIFY_BASE_URL}${path}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const body = await response.text();
        console.error(`Apify API error ${response.status}:`, body.slice(0, 200));
        throw new Error(`Apify API request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
}
