
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import OpenAI from 'openai';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const client = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.REACT_APP_DEEPSEEK_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await client.chat.completions.create({
        model: "deepseek-reasoner",
        messages: [...messages, userMessage],
        stream: true
      });

      let fullContent = '';
      for await (const chunk of response) {
        if (chunk.choices[0].delta.content) {
          fullContent += chunk.choices[0].delta.content;
          setMessages(prev => [
            ...prev.slice(0, -1),
            userMessage,
            { role: 'assistant', content: fullContent }
          ]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <h1>Chat with AI</h1>
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ))}
          {loading && <div className="loading">Loading...</div>}
        </div>
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button type="submit" disabled={loading}>Send</button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
