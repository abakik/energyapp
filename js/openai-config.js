const API_URL = process.env.NEXT_PUBLIC_API_URL || 
    (window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : '');  // Empty string will make it use relative URLs in production

class OpenAIService {
    static async analyzeBill(billText, persona) {
        try {
            // Use relative URL in production
            const response = await fetch('/api/analyze-bill', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    billText,
                    persona
                })
            });

            if (!response.ok) {
                console.error('API Response:', await response.text());  // Add this for debugging
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            return data.content;
        } catch (error) {
            console.error('Error analyzing bill:', error);
            throw new Error('Failed to analyze bill. Please try again later.');
        }
    }

    static async getChatResponse(message, context = {}) {
        try {
            console.log('Context being sent to API:', context);

            // Use relative URL in production
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    billText: context.billText || '',
                    billAnalysis: context.billAnalysis || '',
                    personaType: context.persona || 'general'
                })
            });

            if (!response.ok) {
                console.error('API Response:', await response.text());  // Add this for debugging
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            return data.content;
        } catch (error) {
            console.error('Error getting chat response:', error);
            throw new Error('Failed to get response. Please try again later.');
        }
    }
} 