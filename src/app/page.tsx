// src/app/page.tsx
// v16.2 - Definitive Fix for Main Content Rendering

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
//  Main Home Page - The Controller
// ==============================================================================
export default function HomePage() {
  const [activeMode, setActiveMode] = useState<'chat' | 'team'>('chat');
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  
  const [messages, setMessages] = useState<any[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const [isBuildingWithAI, setIsBuildingWithAI] = useState(false);
  const [builderMessages, setBuilderMessages] = useState<any[]>([]);
  const [isBuilderLoading, setIsBuilderLoading] = useState(false);

  const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

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

  const handleSelectTeamForChat = (teamId: string) => { const team = teams.find(t => t.teamId === teamId); if (team) setSelectedTeam(team); };
  const handleNewChat = () => { setCurrentChatId(null); setMessages([]); };
  const handleLoadChat = useCallback(async (chatId: string) => { setIsLoading(true); try { const response = await fetch(`${backendApiUrl}/chats/${chatId}`); const data = await response.json(); setMessages(data.messages || []); setCurrentChatId(chatId); } catch (error) { console.error(error); } finally { setIsLoading(false); } }, []);
  
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
  
  const handleSubmitChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return alert("Please select a team first.");
    const effectiveInput = currentInput.trim();
    if (!effectiveInput || isLoading) return;
    
    setIsLoading(true);
    const newMessages = [...messages, { role: 'user', content: effectiveInput }];
    setMessages(newMessages);
    setCurrentInput("");

    try {
      const response = await fetch(`${backendApiUrl}/teams/${selectedTeam.teamId}/chats`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: currentChatId, message: effectiveInput }),
      });
      const data = await response.json();
      setMessages(data.messages);
      if (!currentChatId) {
        setCurrentChatId(data.chatId);
        await fetchChatHistory(selectedTeam.teamId);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTeamBuilder = async (input: string) => {
    const userInput = { role: 'user', content: input };
    const newBuilderMessages = [...builderMessages, userInput];
    setBuilderMessages(newBuilderMessages);
    setIsBuilderLoading(true);

    if (builderMessages.length === 0) {
        const optimisticTeam: Team = { teamId: 'wip-team', name: 'Creating Team...' };
        setTeams(prevTeams => [optimisticTeam, ...prevTeams]);
        setActiveTeam(optimisticTeam);
    }

    try {
        const response = await fetch(`${backendApiUrl}/team-builder/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: newBuilderMessages })
        });
        const data = await response.json();
        setBuilderMessages([...newBuilderMessages, data]);
        if (data.tool_calls) {
            await fetchTeams();
        }
    } catch (error) {
        console.error("Error with team builder AI:", error);
        setBuilderMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
        setIsBuilderLoading(false);
        await fetchTeams(); 
    }
  };
  
  const renderMainContent = () => {
    if (activeMode === 'team') {
        if (isBuildingWithAI) {
            return <ChatView 
                messages={builderMessages}
                currentInput={currentInput}
                setCurrentInput={setCurrentInput}
                isLoading={isBuilderLoading}
                handleSubmit={(e) => { e.preventDefault(); handleSubmitTeamBuilder(currentInput); setCurrentInput(""); }} 
            />
        }
        if (activeTeam) {
            return <TeamManagementView
                team={activeTeam}
                agents={agents}
                isLoading={isLoadingAgents}
                onCreateAgent={() => alert("Create agent coming soon!")}
                onEditAgent={(agent) => alert(`Editing ${agent.name}`)}
                onRenameAgent={(agent) => alert(`Renaming ${agent.name}`)}
                onDeleteAgent={(agent) => alert(`Deleting ${agent.name}`)}
              />
        }
        return <WelcomeScreen />; // Show welcome if no active team in team mode
    }
    
    // Default to chat view
    return <ChatView 
        messages={messages}
        currentInput={currentInput}
        setCurrentInput={setCurrentInput}
        isLoading={isLoading}
        handleSubmit={handleSubmitChat} 
    />
  };

  return (
    <>
      <AppLayout
        activeMode={activeMode}
        setActiveMode={(mode) => { setActiveMode(mode); if (mode !== 'team') setIsBuildingWithAI(false); }}
        teams={teams}
        selectedTeam={selectedTeam}
        chatHistory={chatHistory}
        activeTeam={activeTeam}
        currentChatId={currentChatId}
        onSelectTeamForChat={handleSelectTeamForChat}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        onSetActiveTeam={(team) => { setActiveTeam(team); setIsBuildingWithAI(false); }}
        onCreateTeamClick={() => setIsCreateTeamDialogOpen(true)}
        onCreateTeamWithAIClick={() => { setActiveMode('team'); setIsBuildingWithAI(true); setBuilderMessages([]); }}
      >
        {renderMainContent()}
      </AppLayout>

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
    </>
  );
}