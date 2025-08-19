// src/components/ChatSandbox.tsx

'use client';

import React, { useState, useEffect } from 'react';
// Step 1: Import Firebase essentials
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// --- Types ---
// This now represents the structure of our live Firestore documents
type Message = {
  id: string; // The document ID from Firestore
  role: 'user' | 'assistant';
  content: string;
  status?: 'sending' | 'failed';
};

// --- Styles (unchanged) ---
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
  // State will now be populated by our live listener
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  // Step 2: Hardcode the Test Chat ID
  const [chatId, setChatId] = useState('HgvBJbizAVR868wUU7s7'); // Replace with YOUR chat document ID if different

  // Step 3, 4, 5, 6: Establish the real-time listener
  useEffect(() => {
    if (!chatId) return;

    // We must have the exact path to the subcollection
    const messagesCollectionPath = `sandbox_chats/${chatId}/messages`;
    const messagesCollectionRef = collection(db, messagesCollectionPath);
    
    // The query now includes ordering
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

    // onSnapshot is the real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesFromFirestore: Message[] = [];
      querySnapshot.forEach((doc) => {
        messagesFromFirestore.push({
          id: doc.id,
          ...doc.data(),
        } as Message);
      });
      console.log("Received update from Firestore:", messagesFromFirestore);
      setMessages(messagesFromFirestore);
    }, (error) => {
      console.error("Error listening to Firestore:", error);
    });

    // Cleanup function to prevent memory leaks
    return () => unsubscribe();

  }, [chatId]);

  const handleSend = () => {
    // We will implement the "write" logic in the next step.
    console.log('Sending message:', userInput);
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