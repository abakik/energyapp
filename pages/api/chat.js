import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, billText, billAnalysis, personaType } = req.body;
        
        const messages = [];
        
        messages.push({
            role: "system",
            content: `You are a friendly energy assistant. Follow these strict guidelines:

            1. Keep all responses under 3 sentences
            2. Use simple, everyday language
            3. Focus on one key point per response
            4. When explaining terms, use brief, relatable examples
            5. For bill-related questions, reference specific numbers
            6. Avoid technical jargon unless specifically asked
            7. Maximum response length: 50 words

            The user fits the ${personaType} persona.
            Be direct and friendly, but prioritize brevity over detail.`
        });

        if (billText) {
            messages.push({
                role: "system",
                content: `Bill context: ${billText}`
            });
        }

        if (billAnalysis) {
            messages.push({
                role: "system",
                content: `Analysis context: ${billAnalysis}`
            });
        }

        messages.push({
            role: "user",
            content: message
        });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.7,
                max_tokens: 100,
                presence_penalty: 0.6,
                frequency_penalty: 0.4
            })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }
        return res.json({ content: data.choices[0].message.content });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 