// api/ai.js – Vercel Serverless Function for OpenRouter API
// Uses environment variable OPENROUTER_API_KEY

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const API_KEY = process.env.OPENROUTER_API_KEY;

    if (!API_KEY || API_KEY.trim() === '') {
        console.error('❌ Missing OpenRouter API key');
        return res.status(500).json({
            error: 'Missing OpenRouter API key. Please set OPENROUTER_API_KEY in Vercel environment variables.'
        });
    }

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': 'https://winchu-alpha.vercel.app',
                'X-Title': 'Winchu · Nexus'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: messages,
                max_tokens: 300,
                temperature: 0.7,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            let errorMessage = `OpenRouter API error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error && errorData.error.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (e) {}
            return res.status(response.status).json({ error: errorMessage });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('❌ AI Proxy Error:', error.message);
        return res.status(500).json({
            error: 'Internal server error: ' + error.message
        });
    }
}