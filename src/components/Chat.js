import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const systemMessage = {
    role: 'system',
    content: 'You are an AI assistant with expertise in blockchain technology, smart contracts, and web3 development. You provide clear, concise, and technically accurate responses. When discussing code or technical concepts, you use specific examples and explain them in a way that\'s easy to understand.'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage.content, sender: 'user' }]);

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-reasoner',
          messages: [
            systemMessage,
            ...messages.map(msg => ({
              role: msg.sender,
              content: msg.text
            })),
            userMessage
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.slice(6);
            
            // Skip [DONE] message
            if (content.trim() === '[DONE]') continue;
            
            try {
              const data = JSON.parse(content);
              if (data.choices[0].delta.content) {
                fullContent += data.choices[0].delta.content;
                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage.sender === 'assistant') {
                    return [...prev.slice(0, -1), { text: fullContent, sender: 'assistant' }];
                  } else {
                    return [...prev, { text: fullContent, sender: 'assistant' }];
                  }
                });
              }
            } catch (parseError) {
              console.error('Error parsing chunk:', parseError);
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.status === 429) {
        errorMessage = 'The API is currently rate limited. Please try again in a few moments.';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        errorMessage = 'Unable to reach DeepSeek API. Please check your connection and try again.';
      }

      setMessages(prev => [...prev, { 
        text: errorMessage,
        sender: 'assistant'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (apiError) {
    return (
      <div className="chat-container">
        <div className="error-message">
          <h3>Service Unavailable</h3>
          <p>{apiError}</p>
          <p>Please ensure the DeepSeek API is properly configured and try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        ))}
        {isLoading && (
          <div className="loading">
            Thinking...
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
