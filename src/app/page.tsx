"use client";

import { useState } from "react";

// This is the simplified, self-contained UI that is guaranteed to work.

export default function VibeDesignerPage() {
  const [idea, setIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!idea) {
      alert("Please enter your app idea.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    // --- PASTE YOUR NEW, WORKING BACKEND URL HERE ---
    const backendApiUrl = 'https://idx-vibe-agent-backend-84437919-534939227554.australia-southeast1.run.app';
    // --------------------------------------------------

    try {
      const response = await fetch(backendApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea }),
      });

      if (!response.ok) {
        // Try to get a more detailed error message from the backend
        const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
        throw new Error(errorData.error || `An unknown error occurred.`);
      }

      const data = await response.json();
      setResult(data);

    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // This is the simple UI rendering
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '5vh auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center' }}>Vibe Designer AI</h1>
      <p style={{ textAlign: 'center', color: '#666', marginTop: '0.5rem' }}>
        Turn your vibe into a buildable plan.
      </p>

      <div style={{ marginTop: '2.5rem' }}>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g., An AI coach that helps people practice for job interviews"
          style={{ 
            width: '100%', 
            minHeight: '120px', 
            padding: '12px', 
            fontSize: '1rem', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            boxSizing: 'border-box'
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{ 
            display: 'block', 
            width: '100%', 
            padding: '1rem', 
            fontSize: '1.1rem', 
            fontWeight: 'bold', 
            marginTop: '1rem', 
            backgroundColor: isLoading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isLoading ? 'Generating Plan...' : 'Generate Full Project Plan ✨'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', border: '1px solid #c62828' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            Your Complete Project Plan:
          </h2>
          <pre style={{ backgroundColor: '#f6f8fa', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.875rem' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}