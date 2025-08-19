// src/components/ChatSandbox.tsx
// v2.0 - FEAT: Implement the full, end-to-end Chimera Protocol.

'use client';

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

// --- Types ---
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'sending' | 'failed' | 'thinking';
  timestamp?: any;
  tempId?: string; // Add tempId for reconciliation
};

// --- Styles (with additions for thinking dots) ---
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
  wordWrap: 'break-word',
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

const thinkingIndicatorStyle: React.CSSProperties = {
    alignSelf: 'flex-start',
    color: '#cccccc',
    fontStyle: 'italic',
    padding: '0.8rem 1rem',
};

// --- The Sandbox Component ---
const ChatSandbox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [chatId] = useState('HgvBJbizAVR868wUU7s7');
  const [isAiThinking, setIsAiThinking] = useState(false); // State for the "thinking dots"
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);
  
  // Real-time listener for reading and reconciling messages
  useEffect(() => {
    if (!chatId) return;

    const messagesCollectionRef = collection(db, `sandbox_chats/${chatId}/messages`);
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesFromFirestore: Message[] = [];
      let aiIsCurrentlyThinking = false;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Check for the AI's placeholder message
        if (data.role === 'assistant' && data.content === '...') {
            aiIsCurrentlyThinking = true;
        }
        messagesFromFirestore.push({ id: doc.id, ...data } as Message);
      });
      
      setMessages(messagesFromFirestore);
      setIsAiThinking(aiIsCurrentlyThinking); // Update the thinking status
    }, (error) => {
      console.error("Firebase onSnapshot Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (!userInput.trim() || isAiThinking) return; // Prevent sending while AI is thinking

    const tempId = crypto.randomUUID();
    const userMessageContent = userInput.trim();
    setUserInput(''); // Clear input immediately

    // Optimistic UI Update: We will write directly to Firestore which the listener will catch.
    const messagesCollectionRef = collection(db, `sandbox_chats/${chatId}/messages`);
    const newMessage = {
      tempId: tempId,
      role: 'user',
      content: userMessageContent,
      timestamp: serverTimestamp(),
      status: 'sending' // We can use this status in the UI if we want
    };
    
    try {
      await addDoc(messagesCollectionRef, newMessage);

      // Trigger the backend AI. This happens in the background.
      await fetch('/api/sandbox-trigger-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              chatId: chatId,
              userInput: userMessageContent
          }),
      });
    } catch (error) {
      console.error("Error sending message or triggering AI:", error);
      // Optional: Update the message status to 'failed' in Firestore
    }
  };

  return (
    <div style={sandboxContainerStyle}>
      <header style={headerStyle}>
        <h1>Project Chimera: The Perfect Chat Engine</h1>
      </header>
      <main style={messageAreaStyle}>
        {messages.map((msg) => (
          <div key={msg.tempId || msg.id} style={messageBubbleStyle(msg.role)}>
            {msg.content}
            {msg.status === 'sending' && (
              <p style={statusTextStyle}>Sending...</p>
            )}
          </div>
        ))}
        {isAiThinking && <div style={thinkingIndicatorStyle}>AI is thinking...</div>}
        <div ref={messagesEndRef} />
      </main>
      <footer style={inputAreaStyle}>
        <input
          type="text"
          style={textInputStyle}
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isAiThinking} // Disable input while AI is thinking
        />
        <button style={sendButtonStyle} onClick={handleSend} disabled={isAiThinking}>
          Send
        </button>
      </footer>
    </div>
  );
};

export default ChatSandbox;