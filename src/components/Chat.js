import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-r1-0528:free"); // Default model

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);

    try {
      // Call the Juno worker API with the user's query and selected model
      const response = await fetch(`https://juno-worker.imbibed.workers.dev/?query=${encodeURIComponent(userMessage)}&generationModel=${encodeURIComponent(selectedModel)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the response text
      const responseText = await response.text();
      
      // Add the assistant's response to the chat
      setMessages(prev => [...prev, { text: responseText, sender: 'assistant' }]);
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
        <div className="model-selector" style={{ marginBottom: '10px' }}> 
          <label htmlFor="model-select" style={{ marginRight: '10px', color: '#D4AF37' }}>Select Model: </label>
          <select 
            id="model-select" 
            value={selectedModel} 
            onChange={handleModelChange}
            disabled={isLoading}
            style={{ padding: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: '#D4AF37', border: 'none' }}
          >
            <option value="google/gemini-2.5-flash-preview">Gemini 2.5 Flash Preview</option>
            <option value="google/gemini-pro">Gemini Pro</option>
            <option value="deepseek/deepseek-r1-0528:free">DeepSeek R1 0528 (Free)</option>
          </select>
        </div>
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
