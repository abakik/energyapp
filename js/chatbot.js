document.addEventListener('DOMContentLoaded', function() {
    const chatbotToggle = document.querySelector('.chatbot-toggle');
    const chatbotContainer = document.querySelector('.chatbot-container');
    const closeChat = document.querySelector('.close-chat');
    const chatMessages = document.querySelector('.chat-messages');
    const chatInput = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.send-message');

    // Add minimize button to header
    const chatbotHeader = document.querySelector('.chatbot-header');
    chatbotHeader.innerHTML = `
        <h3>Energy Assistant</h3>
        <div class="chatbot-controls">
            <button class="minimize-chat">−</button>
            <button class="close-chat">×</button>
        </div>
    `;

    const minimizeChat = document.querySelector('.minimize-chat');
    
    // Handle minimize
    minimizeChat.addEventListener('click', () => {
        chatbotContainer.classList.toggle('minimized');
        minimizeChat.textContent = chatbotContainer.classList.contains('minimized') ? '□' : '−';
    });

    // Start chatbot minimized
    setTimeout(() => {
        chatbotContainer.classList.remove('hidden');
        chatbotContainer.classList.add('minimized');
        const greeting = hasBillContext() 
            ? "Hello! I can help you understand your energy bill. What would you like to know?"
            : "Hello! Please upload your energy bill so I can help you understand it better.";
        addMessage('bot', greeting);
    }, 500);

    // Toggle chatbot
    chatbotToggle.addEventListener('click', () => {
        chatbotContainer.classList.toggle('hidden');
        if (!chatbotContainer.classList.contains('hidden') && chatMessages.children.length === 0) {
            const greeting = hasBillContext() 
                ? "Hello! I can help you understand your energy bill. What would you like to know?"
                : "Hello! Please upload your energy bill so I can help you understand it better.";
            addMessage('bot', greeting);
        }
    });

    // Close chatbot
    closeChat.addEventListener('click', () => {
        chatbotContainer.classList.add('hidden');
    });

    // Send message
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            addMessage('user', message);
            chatInput.value = '';
            
            // Show typing indicator
            const typingDiv = document.createElement('div');
            typingDiv.classList.add('message', 'bot', 'typing');
            typingDiv.textContent = 'Typing...';
            chatMessages.appendChild(typingDiv);
            
            try {
                // Get the current state
                const context = {
                    billText: window.globalState.billText,
                    billAnalysis: window.globalState.billAnalysis,
                    persona: window.globalState.selectedPersona
                };

                console.log('Sending context to chatbot:', context); // Debug log
                
                const response = await OpenAIService.getChatResponse(message, context);
                
                // Remove typing indicator
                chatMessages.removeChild(typingDiv);
                
                // Add bot response
                addMessage('bot', response);
            } catch (error) {
                // Remove typing indicator
                chatMessages.removeChild(typingDiv);
                
                // Show error message
                addMessage('bot', 'Sorry, I encountered an error. Please try again later.');
                console.error('Chat error:', error);
            }
        }
    }

    // Send message on button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Add message to chat
    function addMessage(type, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Add a function to check if bill data is available
    function hasBillContext() {
        return window.globalState.billText && window.globalState.billAnalysis;
    }
}); 