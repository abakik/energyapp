import Cors from 'cors'

// Initialize the cors middleware
const cors = Cors({
    methods: ['POST', 'GET', 'HEAD'],
    origin: ['https://energyapp-ten.vercel.app', 'http://localhost:3000'],
    credentials: true,
})

// Helper method to wait for a middleware to execute before continuing
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result)
            }
            return resolve(result)
        })
    })
}

export default async function handler(req, res) {
    // Run the middleware
    await runMiddleware(req, res, cors)

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { billText, persona } = req.body;
        
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: `You are an energy bill analysis expert. Analyze the bill for a ${persona}.`
                }, {
                    role: "user",
                    content: billText
                }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error('OpenAI API Error:', data.error);
            throw new Error(data.error.message);
        }
        return res.json({ content: data.choices[0].message.content });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
} 