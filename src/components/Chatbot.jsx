import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css'; // Ensure you have styles for the new elements

const API_URL = 'https://backend-4kvw.onrender.com/api';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({}); // State to hold conversation context
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, loading]);

  useEffect(() => {
    setMessages([{ sender: 'bot', text: 'Hello! I am your HR assistant. How can I help you today?' }]);
  }, []);

  const addMessage = (sender, messageData) => {
    setMessages(prev => [...prev, { sender, ...messageData }]);
  };

  const processCommand = async (commandText) => {
    if (!commandText.trim()) return;

    addMessage('user', { text: commandText });
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/chatbot/command`, {
        command: commandText,
        context: context, // Send current context to the backend
      });
      addMessage('bot', res.data.reply); // reply is now an object {text, actions?}
      setContext(res.data.context); // Update context with the response from the backend
    } catch (error) {
      const errorText = error.response?.data?.reply?.text || 'Sorry, I encountered an error. Please try again.';
      addMessage('bot', { text: errorText });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    processCommand(input);
    setInput('');
  };

  const handleActionClick = (command) => {
    if (loading) return;
    processCommand(command);
  };

  return (
    <div className="chatbot">
      <h2 className="chat-title">Chat Assistant</h2>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
<div
  className="message-text"
  dangerouslySetInnerHTML={{
    __html: (msg.text || '')
      .replace(/\n/g, '<br />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }}
/>
            {msg.actions && (
              <div className="message-actions">
                {msg.actions.map((action, i) => (
                  <button key={i} className="action-button" onClick={() => handleActionClick(action.command)} disabled={loading}>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-message bot">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
}