// src/components/ChatSandbox.tsx 

'use client'; // This directive is necessary for components that use React hooks

import React, { useState } from 'react';

// --- Mock Data and Types ---
// We will replace this with our real types and data from Firestore later.
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'sending' | 'failed';
};

const mockMessages: Message[] = [
  { id: '1', role: 'assistant', content: 'Welcome to the Chimera Sandbox. This is a clean-room environment for building our V2 chat engine.' },
  { id: '2', role: 'user', content: 'This is a message from the user.' },
  { id: '3', role: 'assistant', content: 'This is a response from the assistant.'},
  { id: '4', role: 'user', content: 'This is a message with a "failed" status.', status: 'failed' },
  { id: '5', role: 'user', content: 'This is a message with a "sending" status.', status: 'sending' },
];

// --- Styles ---
// Comprehensive styling to create a realistic chat UI within our sandbox.
const sandboxContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100%',
  backgroundColor: '#1e1e1e',
  border: '2px dashed #00ff99',
  boxSizing: 'border-box',
  fontFamily: 'sans-serif',
};

const headerStyle: React.CSSProperties = {
  padding: '1rem',
  backgroundColor: '#2a2a2a',
  color: '#00ff99',
  textAlign: 'center',
  borderBottom: '1px solid #3a3a3a',
};

const messageAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const messageBubbleStyle = (role: 'user' | 'assistant'): React.CSSProperties => ({
  maxWidth: '70%',
  padding: '0.8rem 1rem',
  borderRadius: '18px',
  color: '#ffffff',
  alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
  backgroundColor: role === 'user' ? '#007bff' : '#3a3a3a',
});

const statusTextStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  opacity: 0.7,
  textAlign: 'right',
  marginTop: '0.5rem',
};

const inputAreaStyle: React.CSSProperties = {
  display: 'flex',
  padding: '1rem',
  borderTop: '1px solid #3a3a3a',
  backgroundColor: '#2a2a2a',
};

const textInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.8rem',
  borderRadius: '8px',
  border: '1px solid #4a4a4a',
  backgroundColor: '#3a3a3a',
  color: '#ffffff',
  fontSize: '1rem',
};

const sendButtonStyle: React.CSSProperties = {
  marginLeft: '1rem',
  padding: '0.8rem 1.5rem',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#007bff',
  color: '#ffffff',
  fontSize: '1rem',
  cursor: 'pointer',
};

// --- The Sandbox Component ---
const ChatSandbox = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [userInput, setUserInput] = useState('');

  const handleSend = () => {
    if (!userInput.trim()) return;
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput,
      status: 'sending',
    };
    setMessages(prev => [...prev, newMessage]);
    setUserInput('');
  };

  return (
    <div style={sandboxContainerStyle}>
      <header style={headerStyle}>
        <h1>Project Chimera: The Perfect Chat Engine</h1>
      </header>
      <main style={messageAreaStyle}>
        {messages.map((msg) => (
          <div key={msg.id} style={messageBubbleStyle(msg.role)}>
            {msg.content}
            {msg.status && (
              <p style={{ ...statusTextStyle, color: msg.status === 'failed' ? '#ff4d4d' : '#cccccc' }}>
                {msg.status}...
              </p>
            )}
          </div>
        ))}
      </main>
      <footer style={inputAreaStyle}>
        <input
          type="text"
          style={textInputStyle}
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button style={sendButtonStyle} onClick={handleSend}>
          Send
        </button>
      </footer>
    </div>
  );
};

export default ChatSandbox;