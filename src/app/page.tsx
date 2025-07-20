// src/app/page.tsx
// v20.1 - Definitive Fix for All State, Rendering, and UI Bugs

"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout, Team, ChatHistoryItem, Agent } from "@/components/AppLayout";
import { WelcomeScreen, ChatView, TeamManagementView } from "@/components/page-views";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [activeMode, setActiveMode] = useState<'chat' | 'team'>('chat');
  const [teams, setTeams] = useState<Team[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [isRenameChatDialogOpen, setIsRenameChatDialogOpen] = useState(false);
  const [isDeleteChatDialogOpen, setIsDeleteChatDialogOpen] = useState(false);
  const [chatToEdit, setChatToEdit] = useState<ChatHistoryItem | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isBuildingWithAI, setIsBuildingWithAI] = useState(false);
  const [builderMessages, setBuilderMessages] = useState<any[]>([]);
  const [isBuilderLoading, setIsBuilderLoading] = useState(false);
  const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

  const fetchTeams = useCallback(async () => { try { const response = await fetch(`${backendApiUrl}/teams`); const data: Team[] = await response.json(); setTeams(data); return data; } catch (error) { console.error(error); return []; } }, []);
  const fetchChatHistory = useCallback(async (teamId: string) => { if (!teamId) return; try { const res = await fetch(`${backendApiUrl}/teams/${teamId}/chats`); setChatHistory(await res.json() || []); } catch (e) { console.error(e); setChatHistory([]); }}, []);
  const fetchAgentsForTeam = useCallback(async (teamId: string) => { if (!teamId) return; setIsLoadingAgents(true); try { const res = await fetch(`${backendApiUrl}/teams/${teamId}/agents`); setAgents(await res.json() || []); } catch (e) { console.error(e); setAgents([]); } finally { setIsLoadingAgents(false); }}, []);
  
  useEffect(() => {
    fetchTeams().then(fetchedTeams => {
        if (fetchedTeams.length > 0 && !activeTeam) {
            setActiveTeam(fetchedTeams[0]);
        }
    });
  }, []);

  useEffect(() => {
    if (activeTeam) {
      fetchChatHistory(activeTeam.teamId);
      fetchAgentsForTeam(activeTeam.teamId);
      handleNewChat(); // Reset chat when team changes
    } else {
      setChatHistory([]);
      setAgents([]);
    }
  }, [activeTeam]);

  const handleSetActiveTeam = (teamOrId: Team | string) => {
    const team = typeof teamOrId === 'string'
      ? teams.find(t => t.teamId === teamOrId)
      : teamOrId;
    
    if (team) {
      setActiveTeam(team);
    }
  };
  
  const handleNewChat = () => { setCurrentChatId(null); setMessages([]); };
  const handleLoadChat = useCallback(async (chatId: string) => { setIsLoading(true); try { const response = await fetch(`${backendApiUrl}/chats/${chatId}`); const data = await response.json(); setMessages(data.messages || []); setCurrentChatId(chatId); } catch (error) { console.error(error); } finally { setIsLoading(false); } }, []);
  
  const handleCreateTeam = async () => { if (!newTeamName.trim()) return; try { const response = await fetch(`${backendApiUrl}/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTeamName }) }); const newTeam = await response.json(); setNewTeamName(""); setIsCreateTeamDialogOpen(false); const updatedTeams = await fetchTeams(); const newTeamInList = updatedTeams.find(t => t.teamId === newTeam.teamId); if (newTeamInList) { handleSetActiveTeam(newTeamInList); } } catch (error) { console.error(error); }};
  const handleRenameChat = async () => { if (!chatToEdit || !newChatTitle.trim() || !activeTeam) return; try { await fetch(`${backendApiUrl}/chats/${chatToEdit.chatId}/rename`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ new_title: newChatTitle }), }); setIsRenameChatDialogOpen(false); setNewChatTitle(""); await fetchChatHistory(activeTeam.teamId); } catch (error) { console.error("Failed to rename chat:", error); }};
  const handleDeleteChat = async () => { if (!chatToEdit || !activeTeam) return; try { await fetch(`${backendApiUrl}/chats/${chatToEdit.chatId}`, { method: "DELETE" }); if (currentChatId === chatToEdit.chatId) { handleNewChat(); } setIsDeleteChatDialogOpen(false); await fetchChatHistory(activeTeam.teamId); } catch (error) { console.error("Failed to delete chat:", error); }};
  
  const handleSubmitChat = async (e: React.FormEvent) => { e.preventDefault(); if (!activeTeam) return; const effectiveInput = currentInput.trim(); if (!effectiveInput || isLoading) return; setIsLoading(true); const newMessages = [...messages, { role: 'user', content: effectiveInput }]; setMessages(newMessages); setCurrentInput(""); try { const response = await fetch(`${backendApiUrl}/teams/${activeTeam.teamId}/chats`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId: currentChatId, message: effectiveInput }), }); const data = await response.json(); if (data.error) throw new Error(data.error); setMessages(data.messages || []); if (!currentChatId && data.chatId) { setCurrentChatId(data.chatId); await fetchChatHistory(activeTeam.teamId); } } catch (error) { const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."; setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]); } finally { setIsLoading(false); }};
  const handleSubmitTeamBuilder = async (input: string) => { const userInput = { role: 'user', content: input }; const newBuilderMessages = [...builderMessages, userInput]; setBuilderMessages(newBuilderMessages); setIsBuilderLoading(true); if (builderMessages.length === 0) { const optimisticTeam: Team = { teamId: 'wip-team', name: 'Creating Team...' }; setTeams(prevTeams => [optimisticTeam, ...prevTeams]); setActiveTeam(optimisticTeam); } try { const response = await fetch(`${backendApiUrl}/team-builder/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newBuilderMessages }) }); const data = await response.json(); setBuilderMessages([...newBuilderMessages, data]); const updatedTeams = await fetchTeams(); if (data.tool_outputs && data.tool_outputs.new_team_id) { const newTeam = updatedTeams.find(t => t.teamId === data.tool_outputs.new_team_id); if (newTeam) { handleSetActiveTeam(newTeam); } } } catch (error) { console.error(error); setBuilderMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]); } finally { setIsBuilderLoading(false); }};
  
  const renderMainContent = () => { if (activeMode === 'team') { if (isBuildingWithAI) { return <ChatView messages={builderMessages} currentInput={currentInput} setCurrentInput={setCurrentInput} isLoading={isBuilderLoading} handleSubmit={(e) => { e.preventDefault(); handleSubmitTeamBuilder(currentInput); setCurrentInput(""); }} /> } if (activeTeam) { return <TeamManagementView team={activeTeam} agents={agents} isLoading={isLoadingAgents} onCreateAgent={() => alert("TBD")} onEditAgent={(agent) => alert(`TBD: ${agent.name}`)} onRenameAgent={(agent) => alert(`TBD: ${agent.name}`)} onDeleteAgent={(agent) => alert(`TBD: ${agent.name}`)} /> } return <WelcomeScreen />; } if (activeTeam) { return <ChatView messages={messages} currentInput={currentInput} setCurrentInput={setCurrentInput} isLoading={isLoading} handleSubmit={handleSubmitChat} /> } return <WelcomeScreen/>; };

  return (
    <>
      <AppLayout
        activeMode={activeMode} setActiveMode={(mode) => { setActiveMode(mode); if (mode !== 'team') setIsBuildingWithAI(false); }}
        teams={teams} activeTeam={activeTeam} chatHistory={chatHistory} currentChatId={currentChatId}
        onSetActiveTeam={handleSetActiveTeam} onNewChat={handleNewChat} onLoadChat={handleLoadChat}
        onCreateTeamClick={() => setIsCreateTeamDialogOpen(true)}
        onCreateTeamWithAIClick={() => { setActiveMode('team'); setIsBuildingWithAI(true); setBuilderMessages([]); }}
        onRenameChat={(chat) => { setChatToEdit(chat); setNewChatTitle(chat.title); setIsRenameChatDialogOpen(true); }}
        onDeleteChat={(chat) => { setChatToEdit(chat); setIsDeleteChatDialogOpen(true); }}
      >
        {renderMainContent()}
      </AppLayout>

      <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}> <DialogContent> <DialogHeader><DialogTitle>Create New Team</DialogTitle></DialogHeader> <Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="e.g., Marketing Engine" /> <DialogFooter> <Button variant="outline" onClick={() => setIsCreateTeamDialogOpen(false)}>Cancel</Button> <Button onClick={handleCreateTeam}>Create Team</Button> </DialogFooter> </DialogContent> </Dialog>
      <Dialog open={isRenameChatDialogOpen} onOpenChange={setIsRenameChatDialogOpen}> <DialogContent> <DialogHeader><DialogTitle>Rename Chat</DialogTitle></DialogHeader> <Input value={newChatTitle} onChange={(e) => setNewChatTitle(e.target.value)} placeholder="Enter new title..." /> <DialogFooter> <Button variant="outline" onClick={() => setIsRenameChatDialogOpen(false)}>Cancel</Button> <Button onClick={handleRenameChat}>Rename</Button> </DialogFooter> </DialogContent> </Dialog>
      <Dialog open={isDeleteChatDialogOpen} onOpenChange={setIsDeleteChatDialogOpen}> <DialogContent> <DialogHeader><DialogTitle>Are you sure?</DialogTitle></DialogHeader> <p>This will permanently delete the chat titled "{chatToEdit?.title}".</p> <DialogFooter> <Button variant="outline" onClick={() => setIsDeleteChatDialogOpen(false)}>Cancel</Button> <Button variant="destructive" onClick={handleDeleteChat}>Delete</Button> </DialogFooter> </DialogContent> </Dialog>
    </>
  );
}
