// src/app/test-layout/page.tsx
// Sandbox for Agent Management UI - v4 (Edit functionality added)

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Team, Agent } from "@/components/AppLayout"; // Re-using existing types

export default function SandboxPage() {
  // --- State Management ---
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // New state to track if we are creating or editing
  const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);

  const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

  // --- Data Fetching ---
  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch(`${backendApiUrl}/teams`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data: Team[] = await response.json();
      setTeams(data);
      if (data.length > 0) setActiveTeam(data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }, []);

  const fetchAgentsForTeam = useCallback(async (teamId: string) => {
    if (!teamId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendApiUrl}/teams/${teamId}/agents`);
      if (!res.ok) throw new Error(`Failed to fetch agents for team ${teamId}`);
      const data: Agent[] = await res.json();
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);
  useEffect(() => { if (activeTeam) { fetchAgentsForTeam(activeTeam.teamId); } }, [activeTeam, fetchAgentsForTeam]);
  
  // --- Event Handlers ---
  const handleCreateAgentClick = () => {
    setAgentToEdit(null); // Ensure we are in "create" mode
    setAgentName("");
    setAgentPrompt("");
    setIsDialogOpen(true);
  };
  
  const handleEditAgentClick = (agent: Agent) => {
    setAgentToEdit(agent); // Set the agent to edit
    setAgentName(agent.name);
    setAgentPrompt(agent.system_prompt);
    setIsDialogOpen(true);
  };

  const handleSaveAgent = async () => {
    if (!activeTeam || !agentName.trim() || !agentPrompt.trim()) {
      alert("Agent Name and Prompt cannot be empty.");
      return;
    }
    setIsSaving(true);
    setError(null);

    // Determine if we are creating or updating
    const isEditing = agentToEdit !== null;
    const url = isEditing
      ? `${backendApiUrl}/teams/${activeTeam.teamId}/agents/${agentToEdit.agentId}`
      : `${backendApiUrl}/teams/${activeTeam.teamId}/agents`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          system_prompt: agentPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'save'} the agent.`);
      }
      
      setIsDialogOpen(false);
      await fetchAgentsForTeam(activeTeam.teamId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render ---
  return (
    <>
      <div className="p-8 max-w-4xl mx-auto">
        <header className="pb-4 border-b">
          <h1 className="text-3xl font-bold">Agent Management Sandbox</h1>
          {/* ... */}
        </header>
        <section className="mt-6">
          <h2 className="text-2xl font-semibold">Current Team</h2>
          {activeTeam ? (
            <p className="text-gray-600 dark:text-gray-400">
              Managing agents for: <span className="font-bold text-indigo-500">{activeTeam.name}</span>
            </p>
          ) : (<p>Loading teams...</p>)}
        </section>

        <section className="mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Agents</h2>
            <Button onClick={handleCreateAgentClick}>Create New Agent</Button>
          </div>
          
          <div className="mt-4 space-y-4">
            {isLoading ? (<p>Loading agents...</p>) 
             : error ? (<p className="text-red-500">Error: {error}</p>) 
             : agents.length > 0 ? (
              agents.map(agent => (
                <div key={agent.agentId} className="p-4 border dark:border-zinc-800 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-lg">{agent.system_prompt}</p>
                  </div>
                  {/* New Edit Button */}
                  <Button variant="outline" onClick={() => handleEditAgentClick(agent)}>Edit</Button>
                </div>
              ))
            ) : (<p>No agents found for this team.</p>)}
          </div>
        </section>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            {/* Dynamic Title */}
            <DialogTitle>{agentToEdit ? 'Edit Agent' : 'Create New Agent'}</DialogTitle>
            <DialogDescription>
              {agentToEdit ? 'Update the details for this agent.' : 'Define the name and core instructions for your new AI agent.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="prompt" className="text-right pt-2">System Prompt</Label>
              <Textarea id="prompt" value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} className="col-span-3" rows={8}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSaveAgent} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}