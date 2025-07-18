// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout, Team, ChatHistoryItem, Agent } from "@/components/AppLayout";
import { WelcomeScreen, ChatView, TeamManagementView } from "@/components/page-views";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// ==============================================================================
//  Main Home Page - Now acts as a "Controller"
// ==============================================================================
export default function HomePage() {
  const [activeMode, setActiveMode] = useState<'chat' | 'team'>('chat');
  
  // All state now lives here
  const [teams, setTeams] = useState<Team[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  
  // Dialog State
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreateAgentDialogOpen, setIsCreateAgentDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentPrompt, setNewAgentPrompt] = useState("");
  const [isEditAgentDialogOpen, setIsEditAgentDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editedAgentPrompt, setEditedAgentPrompt] = useState("");
  const [isDeleteAgentDialogOpen, setIsDeleteAgentDialogOpen] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

  // --- API Handlers ---
  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch(`${backendApiUrl}/teams`);
      const data: Team[] = await response.json();
      setTeams(data);
      if (data.length > 0) {
        if (!activeTeam) setActiveTeam(data[0]);
        if (!selectedTeam) setSelectedTeam(data[0]);
      }
      return data;
    } catch (error) { console.error("Failed to fetch teams:", error); return []; }
  }, []);

  const fetchChatHistory = useCallback(async (teamId: string) => { if (!teamId) return; try { const res = await fetch(`${backendApiUrl}/teams/${teamId}/chats`); setChatHistory(await res.json()); } catch (e) { console.error(e); setChatHistory([]); }}, []);
  const fetchAgentsForTeam = useCallback(async (teamId: string) => { if (!teamId) return; setIsLoadingAgents(true); try { const res = await fetch(`${backendApiUrl}/teams/${teamId}/agents`); setAgents(await res.json()); } catch (e) { console.error(e); setAgents([]); } finally { setIsLoadingAgents(false); }}, []);
  
  useEffect(() => { fetchTeams(); }, [fetchTeams]);
  useEffect(() => { if (selectedTeam) { fetchChatHistory(selectedTeam.teamId); } }, [selectedTeam, fetchChatHistory]);
  useEffect(() => { if (activeTeam) { fetchAgentsForTeam(activeTeam.teamId); } }, [activeTeam, fetchAgentsForTeam]);

  // --- Event Handlers ---
  const handleSelectTeamForChat = (teamId: string) => { const team = teams.find(t => t.teamId === teamId); if (team) setSelectedTeam(team); };
  const handleNewChat = () => { setCurrentChatId(null); setMessages([]); };
  const handleLoadChat = useCallback(async (chatId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendApiUrl}/chats/${chatId}`);
      const data = await response.json();
      setMessages(data.messages || []);
      setCurrentChatId(chatId);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  }, []);
  
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      const response = await fetch(`${backendApiUrl}/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTeamName }) });
      const newTeamResponse = await response.json();
      setNewTeamName("");
      setIsCreateTeamDialogOpen(false);
      const updatedTeams = await fetchTeams();
      const newlyCreatedTeam = updatedTeams.find(t => t.teamId === newTeamResponse.teamId);
      if (newlyCreatedTeam) { setActiveTeam(newlyCreatedTeam); setSelectedTeam(newlyCreatedTeam); }
    } catch (error) { console.error("Failed to create team:", error); }
  };
  
  // Agent & Chat Submit Handlers...
  // ... (These will be passed to the views)

  return (
    <>
      <AppLayout
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        teams={teams}
        selectedTeam={selectedTeam}
        chatHistory={chatHistory}
        activeTeam={activeTeam}
        currentChatId={currentChatId}
        onSelectTeamForChat={handleSelectTeamForChat}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        onSetActiveTeam={setActiveTeam}
        onCreateTeamClick={() => setIsCreateTeamDialogOpen(true)}
      >
        {activeMode === 'chat' ? (
          <ChatView 
            messages={messages}
            currentInput={currentInput}
            setCurrentInput={setCurrentInput}
            isLoading={isLoading}
            // We'll wire up handleSubmit later
            handleSubmit={() => alert("Chat submit coming soon!")} 
          />
        ) : activeTeam ? (
          <TeamManagementView
            team={activeTeam}
            agents={agents}
            isLoading={isLoadingAgents}
            // Placeholder handlers for now
            onCreateAgent={() => alert("Create agent coming soon!")}
            onEditAgent={(agent) => alert(`Editing ${agent.name}`)}
            onRenameAgent={(agent) => alert(`Renaming ${agent.name}`)}
            onDeleteAgent={(agent) => alert(`Deleting ${agent.name}`)}
          />
        ) : (
          <WelcomeScreen /> // Show welcome if no team is active
        )}
      </AppLayout>

      {/* --- ALL DIALOGS (Managed by the main page) --- */}
      <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>Create New Team</DialogTitle></DialogHeader>
              <Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="e.g., Marketing Content Engine" />
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateTeamDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTeam}>Create Team</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      {/* Other dialogs for agent management would go here */}
    </>
  );
}

// NOTE: We need to create a new file for our page-views