import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import OpenAI from 'openai';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepseekClient, setDeepseekClient] = useState(null);
  const [apiError, setApiError] = useState('');

  // Initialize API client
  useEffect(() => {
    try {
      if (process.env.REACT_APP_DEEPSEEK_API_KEY) {
        setDeepseekClient(new OpenAI({
          baseURL: "https://api.deepseek.com",
          apiKey: process.env.REACT_APP_DEEPSEEK_API_KEY,
          dangerouslyAllowBrowser: true
        }));
      } else {
        setApiError('DeepSeek API configuration is missing. Please check environment variables.');
      }
    } catch (error) {
      console.error('Error initializing DeepSeek client:', error);
      setApiError('Failed to initialize DeepSeek client. Please try again later.');
    }
  }, []);

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
      if (!deepseekClient) throw new Error('DeepSeek client not available');
      
      const response = await deepseekClient.chat.completions.create({
        model: "deepseek-reasoner",
        messages: [
          systemMessage,
          ...messages.map(msg => ({
            role: msg.sender,
            content: msg.text
          })),
          userMessage
        ],
        stream: true
      });

      let fullContent = '';
      for await (const chunk of response) {
        if (chunk.choices[0].delta.content) {
          fullContent += chunk.choices[0].delta.content;
          // Update only the assistant's message
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.sender === 'assistant') {
              return [...prev.slice(0, -1), { text: fullContent, sender: 'assistant' }];
            } else {
              return [...prev, { text: fullContent, sender: 'assistant' }];
            }
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error. Please try again.',
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
          {apiError}
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
          disabled={isLoading || !deepseekClient}
        />
        <button type="submit" disabled={isLoading || !input.trim() || !deepseekClient}>
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
