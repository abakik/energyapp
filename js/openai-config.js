class OpenAIService {
    static async analyzeBill(billText, persona) {
        try {
            const response = await fetch('http://localhost:3000/api/analyze-bill', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    billText,
                    persona,
                    analysisType: 'detailed',
                    includeRecommendations: true,
                    includeCostSavings: true
                })
            });

            if (!response.ok) {
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

            const response = await fetch('http://localhost:3000/api/chat', {
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