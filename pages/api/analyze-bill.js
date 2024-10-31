export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Your API logic here
        const { text } = req.body;
        // ...
    } catch (error) {
        return res.status(500).json({ error: 'Error processing request' });
    }
} 