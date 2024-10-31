export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { billText, persona } = req.body;
        
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
                    content: `You are an energy bill analysis expert. Analyze the bill for a ${persona}. 
                    Structure your response in clear sections:
                    
                    1. Usage Summary:
                    - Extract and show actual kWh usage
                    - Compare with previous periods if available
                    - Show peak/off-peak usage if available
                    
                    2. Cost Breakdown:
                    - List all charges with exact amounts
                    - Show rate details (price per kWh)
                    - Include all fees and taxes
                    
                    3. Recommendations:
                    [Previous system prompt content...]`
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
            throw new Error(data.error.message);
        }
        return res.json({ content: data.choices[0].message.content });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error processing request' });
    }
} 