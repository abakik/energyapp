require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(cors({
    origin: ['https://energyapp-ten.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }));
  server.use(express.json({ limit: '10mb' }));

  // Route for bill analysis
  server.post('/api/analyze-bill', async (req, res) => {
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
            
            Quick Actions (Easy to Implement):
            
            Shift Usage to Off-Peak Times
            - What to Do: Run appliances like dishwashers and washing machines during Off-Peak hours
            - Savings: Lower energy rates during Off-Peak times can reduce your bill
            - Start: Adjust your routine this week
            
            Reduce Peak Demand
            - What to Do: Avoid using multiple high-energy appliances at the same time during Peak Hours (2pm-8pm weekdays)
            - Savings: Lowers Peak Demand Charges
            - Start: Plan appliance use to minimize simultaneous usage
            
            Unplug Unused Devices
            - What to Do: Disconnect devices when they're not in use to eliminate standby power
            - Savings: Can save up to 10% on your electricity usage
            - Start: Unplug devices today
            
            Long-Term Investments:
            
            Upgrade to Energy-Efficient Appliances
            - What to Do: Replace old appliances with energy-efficient models (look for high star ratings)
            - Savings: Significant reductions in energy use and costs over time
            - Cost: Initial investment varies; may be offset by rebates
            - Payback: Savings typically recoup costs within a few years
            
            Install Solar Panels and Battery Storage
            - What to Do: Generate your own electricity and store excess energy
            - Savings: Substantial long-term reduction in energy bills
            - Cost: High upfront cost; check for government incentives
            - Payback: Usually within 5–10 years
            
            Next Steps:
            1. Review Your Usage: Look at when and how you use electricity to find more savings opportunities
            2. Set Energy Goals: Aim to reduce your daily usage by a specific amount
            3. Seek Expert Advice: Consult with energy professionals about solar installations or appliance upgrades
            4. Monitor Progress: Use a smart meter or energy app to track your improvements over time
            
            Keep all numerical values from the bill intact and reference them in your analysis.
            Format each section with clear labels and values.`
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
      res.json({ content: data.choices[0].message.content });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Updated chat route for more concise responses
  server.post('/api/chat', async (req, res) => {
    try {
      const { message, billText, billAnalysis, personaType } = req.body;
      
      console.log('Received chat request:', {
        messageLength: message?.length,
        billTextLength: billText?.length,
        billAnalysisLength: billAnalysis?.length,
        personaType
      });

      const messages = [];
      
      // Updated system message to enforce concise responses
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
          max_tokens: 100,  // Reduced token limit to force conciseness
          presence_penalty: 0.6,  // Encourage focused responses
          frequency_penalty: 0.4  // Discourage repetitive language
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      res.json({ content: data.choices[0].message.content });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Make sure API routes are handled before the catch-all
  server.all('/api/*', (req, res) => {
    return handle(req, res);
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
}); 