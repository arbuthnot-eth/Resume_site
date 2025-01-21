import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

// API endpoints in order of preference
const API_ENDPOINTS = [
  process.env.REACT_APP_API_URL,
  'https://ipfs.fleek.co/ipfs/YOUR_IPFS_HASH/api/proxy',
  'https://cloudflare-ipfs.com/ipfs/YOUR_IPFS_HASH/api/proxy'
].filter(Boolean);

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEndpointIndex, setCurrentEndpointIndex] = useState(0);

  const systemMessage = {
    role: 'system',
    content: 'You are an AI assistant with expertise in blockchain technology, smart contracts, and web3 development. You provide clear, concise, and technically accurate responses. When discussing code or technical concepts, you use specific examples and explain them in a way that\'s easy to understand.'
  };

  const tryNextEndpoint = async (messageHistory) => {
    if (currentEndpointIndex >= API_ENDPOINTS.length) {
      throw new Error('All API endpoints failed');
    }

    try {
      const response = await fetch(API_ENDPOINTS[currentEndpointIndex], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messageHistory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.warn(`Endpoint ${currentEndpointIndex} failed:`, error);
      setCurrentEndpointIndex(prev => prev + 1);
      return tryNextEndpoint(messageHistory);
    }
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
      // Create array of messages including system message
      const messageHistory = [
        systemMessage,
        ...messages.map(msg => ({
          role: msg.sender,
          content: msg.text
        })),
        userMessage
      ];

      const response = await tryNextEndpoint(messageHistory);
      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      setMessages(prev => [...prev, { 
        text: assistantMessage, 
        sender: 'assistant' 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant'
      }]);
      // Reset endpoint index to try from the beginning next time
      setCurrentEndpointIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

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
