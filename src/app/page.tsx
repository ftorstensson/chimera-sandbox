// src/app/page.tsx
// v15.2 - Final Fix: Handle Deletion of Selected Team
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import ExpertOutputDisplay from "@/components/ExpertOutputDisplay";
import { Menu, Compass, Code, MessageSquare, Plus, MoreHorizontal, Edit, Trash2, Users, FilePenLine, ChevronsUpDown, Check, Settings } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface ChatMessage { role: 'user' | 'assistant' | 'tool'; content: string | null; agent_used?: string; structured_data?: any; }
interface ChatHistoryItem { chatId: string; title: string; }
interface Agent { agentId: string; name: string; system_prompt: string; }
interface Team { teamId: string; name: string; }

const WelcomeScreen = () => ( <div className="flex flex-col items-center justify-center h-full text-center pb-24"> <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Hello, I'm Vibe Designer</h1> <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Your creative partner for designing new applications.</p> <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl"> <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"><Compass className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Explore new app ideas</p></div> <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"><Code className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Design application architecture</p></div> <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"><MessageSquare className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Craft user-centric experiences</p></div> </div> </div> );

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [renamingTeam, setRenamingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isAgentManagerOpen, setIsAgentManagerOpen] = useState(false);
  const [isEditAgentOpen, setIsEditAgentOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [renamingAgentId, setRenamingAgentId] = useState<string | null>(null);
  const [newAgentName, setNewAgentName] = useState("");
  const [isDeleteAgentDialogOpen, setIsDeleteAgentDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isCreateAgentOpen, setIsCreateAgentOpen] = useState(false);
  const [createAgentName, setCreateAgentName] = useState("");
  const [createAgentPrompt, setCreateAgentPrompt] = useState("");

  const bottomOfChatRef = useRef<HTMLDivElement>(null);
  const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';
  
  const fetchTeams = useCallback(async (deletedTeamId?: string) => {
    try {
      const response = await fetch(`${backendApiUrl}/teams`);
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data: Team[] = await response.json();
      setTeams(data);

      if (deletedTeamId && selectedTeam?.teamId === deletedTeamId) {
        setSelectedTeam(data.length > 0 ? data[0] : null);
      } else if (data.length > 0 && !selectedTeam) {
        setSelectedTeam(data[0]);
      } else if (data.length === 0) {
        setSelectedTeam(null);
      }
    } catch (error) { console.error("Failed to fetch teams:", error); }
  }, [selectedTeam]);

  const fetchChatHistory = useCallback(async (teamId: string) => {
    if (!teamId) return setChatHistory([]);
    try {
      const response = await fetch(`${backendApiUrl}/teams/${teamId}/chats`);
      if (!response.ok) throw new Error("Failed to fetch chat history");
      const data: ChatHistoryItem[] = await response.json();
      setChatHistory(data);
    } catch (error) { console.error("Failed to fetch chat history:", error); setChatHistory([]); }
  }, []);
  
  const fetchAgents = useCallback(async (teamId: string) => {
    if (!teamId) return setAgents([]);
    try {
      const response = await fetch(`${backendApiUrl}/teams/${teamId}/agents`);
      if (!response.ok) throw new Error("Failed to fetch agents");
      const agentData: Agent[] = await response.json();
      setAgents(agentData);
    } catch (error) { console.error("Failed to fetch agents:", error); }
  }, []);

  useEffect(() => { fetchTeams(); }, []); 
  useEffect(() => { if (selectedTeam) { fetchChatHistory(selectedTeam.teamId); handleNewChat(); } else { setChatHistory([]); } }, [selectedTeam]);
  
  const handleNewChat = () => { setCurrentChatId(null); setMessages([]); setCurrentInput(""); };

  const loadChatHistory = useCallback(async (chatId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendApiUrl}/chats/${chatId}`);
      if (!response.ok) throw new Error(`Failed to fetch chat: ${response.statusText}`);
      const data = await response.json();
      setMessages(data.messages || []);
      setCurrentChatId(chatId);
    } catch (error) {
      setMessages([{ role: 'assistant', content: `Error loading chat: ${error instanceof Error ? error.message : "Unknown error"}` }]);
      setCurrentChatId(null);
    } finally { setIsLoading(false); }
  }, []);

  const handleSubmit = async (input: string) => {
    if (!selectedTeam) return alert("Please select a team first.");
    const effectiveInput = input.trim();
    if (!effectiveInput || isLoading) return;
    setIsLoading(true);
    const optimisticMessages: ChatMessage[] = [...(messages.length === 0 && !currentChatId ? [] : messages), { role: 'user', content: effectiveInput }];
    setMessages(optimisticMessages);
    setCurrentInput("");
    try {
      const response = await fetch(`${backendApiUrl}/teams/${selectedTeam.teamId}/chats`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: currentChatId, message: effectiveInput }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setMessages(data.messages);
      if (!currentChatId && data.chatId) {
        setCurrentChatId(data.chatId);
        await fetchChatHistory(selectedTeam.teamId);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }]);
    } finally { setIsLoading(false); }
  };
  
  const handleManageAgents = async () => { if (selectedTeam) { await fetchAgents(selectedTeam.teamId); setIsAgentManagerOpen(true); }};
  const handleDeleteAgent = async () => { if (agentToDelete && selectedTeam) { try { await fetch(`${backendApiUrl}/teams/${selectedTeam.teamId}/agents/${agentToDelete.agentId}`, { method: 'DELETE' }); setIsDeleteAgentDialogOpen(false); setAgentToDelete(null); await fetchAgents(selectedTeam.teamId); } catch (error) { console.error("Failed to delete agent:", error); }}};
  const handleCreateAgent = async () => { if (selectedTeam && createAgentName.trim()) { try { await fetch(`${backendApiUrl}/teams/${selectedTeam.teamId}/agents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: createAgentName, system_prompt: createAgentPrompt }) }); setIsCreateAgentOpen(false); setCreateAgentName(""); setCreateAgentPrompt(""); await fetchAgents(selectedTeam.teamId); } catch (error) { console.error("Failed to create agent:", error); }}};
  const handleRenameAgent = async (agentId: string) => { if (selectedTeam && newAgentName.trim()) { try { await fetch(`${backendApiUrl}/teams/${selectedTeam.teamId}/agents/${agentId}/rename`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newAgentName }) }); await fetchAgents(selectedTeam.teamId); } catch (error) { console.error("Failed to rename agent:", error); } finally { setRenamingAgentId(null); }}};
  const handleSaveAgent = async () => { if (currentAgent && selectedTeam) { try { await fetch(`${backendApiUrl}/teams/${selectedTeam.teamId}/agents/${currentAgent.agentId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system_prompt: editedPrompt }) }); setIsEditAgentOpen(false); await fetchAgents(selectedTeam.teamId); } catch (error) { console.error("Failed to save agent prompt:", error); }}};
  
  // Team Management Handlers
  const handleCreateTeam = async () => { if (newTeamName.trim()) { try { await fetch(`${backendApiUrl}/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTeamName }) }); setNewTeamName(""); await fetchTeams(); } catch (error) { console.error("Failed to create team:", error); }}};
  const handleRenameTeam = async () => { if (renamingTeam && newTeamName.trim()) { try { await fetch(`${backendApiUrl}/teams/${renamingTeam.teamId}/rename`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTeamName }) }); setRenamingTeam(null); setNewTeamName(""); await fetchTeams(); } catch (error) { console.error("Failed to rename team:", error); }}};
  
  const handleDeleteTeam = async () => {
    if (deletingTeam) {
      try {
        const deletedTeamId = deletingTeam.teamId;
        await fetch(`${backendApiUrl}/teams/${deletedTeamId}`, { method: 'DELETE' });
        setDeletingTeam(null);
        await fetchTeams(deletedTeamId); // Pass the deleted ID to fetchTeams
      } catch (error) { console.error("Failed to delete team:", error); }
    }
  };

  useEffect(() => { bottomOfChatRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-[#131314] text-gray-900 dark:text-gray-100">
      <aside className={`flex flex-col flex-shrink-0 bg-[#1e1f20] text-white transition-all duration-300 ${isSidebarOpen ? 'w-72 p-2' : 'w-0'}`}>
        <div className="space-y-2 flex-shrink-0">
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="w-full justify-between text-lg"><span className="truncate">{selectedTeam ? selectedTeam.name : "Select a Team"}</span><ChevronsUpDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
                {teams.map(team => (<DropdownMenuItem key={team.teamId} onSelect={() => setSelectedTeam(team)}>{team.name}{selectedTeam?.teamId === team.teamId && <Check className="ml-auto h-4 w-4" />}</DropdownMenuItem>))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsTeamManagerOpen(true)}><Settings className="mr-2 h-4 w-4" /> Manage Teams</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" className="w-full justify-start gap-2 text-lg" onClick={handleNewChat}><Plus /> New Chat</Button>
        </div>
        <div className="flex-grow overflow-y-auto mt-2 pt-2 border-t border-gray-700/50"><p className="px-2 py-2 text-sm font-medium text-gray-400">Recent Chats</p><nav className="space-y-1">{chatHistory.map(chat => (<a href="#" key={chat.chatId} onClick={(e) => { e.preventDefault(); loadChatHistory(chat.chatId); }} className={`flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md hover:bg-[#2d2e30] truncate ${currentChatId === chat.chatId ? 'text-white bg-[#2d2e30]' : 'text-gray-300'}`}><MessageSquare className="h-4 w-4 flex-shrink-0" />{chat.title}</a>))}</nav></div>
        <div className="flex-shrink-0 border-t border-gray-700/50 pt-2"><Button variant="ghost" className="w-full justify-start gap-2 text-lg" onClick={handleManageAgents}><Users /> Manage Agents</Button></div>
      </aside>
      <main className="flex flex-1 flex-col h-full bg-white dark:bg-[#131314]">
        <header className="flex items-center p-2 flex-shrink-0 border-b dark:border-gray-700"><Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-2 text-gray-500"><Menu size={24} /></Button><h1 className="text-xl font-semibold">Vibe Designer AI</h1></header>
        <div className="flex-1 overflow-y-auto p-6 space-y-6"><div className="w-full max-w-3xl mx-auto">{messages.length === 0 && !isLoading ? <WelcomeScreen /> : messages.map((msg, index) => {if (msg.role === 'user' && msg.content) return <UserMessage key={index}>{msg.content}</UserMessage>; if (msg.role === 'assistant' && msg.content) { return (<AssistantMessage key={index}>{msg.content}{msg.agent_used && msg.structured_data && <ExpertOutputDisplay agentName={msg.agent_used} data={msg.structured_data} />}</AssistantMessage>); } return null;})}{isLoading && messages.length > 0 && <div className="flex justify-start"><div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-2xl rounded-bl-none shadow-sm animate-pulse">...thinking</div></div>}<div ref={bottomOfChatRef}></div></div></div>
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700"><div className="w-full max-w-3xl mx-auto"><form onSubmit={(e) => { e.preventDefault(); handleSubmit(currentInput); }}><div className="flex items-end space-x-2"><Textarea value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} placeholder="Describe your app idea..." className="flex-grow rounded-lg px-4 py-2 resize-none bg-gray-100 dark:bg-gray-700" rows={1}/><Button type="submit" className="rounded-lg h-10 w-16 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading || !selectedTeam}>Send</Button></div></form></div></div>
      </main>

      {/* --- ALL DIALOGS --- */}
      <Dialog open={isTeamManagerOpen} onOpenChange={setIsTeamManagerOpen}><DialogContent><DialogHeader><DialogTitle>Team Management</DialogTitle><DialogDescription>Create, rename, or delete your teams.</DialogDescription></DialogHeader>
        <div className="py-4 space-y-2"><div className="flex space-x-2"><Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="New team name..." /><Button onClick={handleCreateTeam}><Plus className="mr-2 h-4 w-4"/>Create</Button></div></div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {teams.map(team => (<div key={team.teamId} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            {renamingTeam?.teamId === team.teamId ? (<Input defaultValue={team.name} onBlur={handleRenameTeam} onChange={e=>setNewTeamName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleRenameTeam()}} autoFocus />) : (<p>{team.name}</p>)}
            <div><Button variant="ghost" size="icon" onClick={()=>{setRenamingTeam(team); setNewTeamName(team.name)}}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => setDeletingTeam(team)}><Trash2 className="h-4 w-4 text-red-500"/></Button></div>
          </div>))}
        </div>
      <DialogFooter><Button variant="outline" onClick={() => setIsTeamManagerOpen(false)}>Done</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!deletingTeam} onOpenChange={()=>setDeletingTeam(null)}><DialogContent><DialogHeader><DialogTitle>Delete Team?</DialogTitle><DialogDescription>Are you sure you want to delete the team <span className="font-bold text-yellow-400">{deletingTeam?.name}</span>? This action is permanent.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={()=>setDeletingTeam(null)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteTeam}>Yes, Delete Team</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isAgentManagerOpen} onOpenChange={setIsAgentManagerOpen}><DialogContent className="max-w-2xl"><DialogHeader className="flex-row items-center justify-between"><div><DialogTitle>Agent Manager</DialogTitle><DialogDescription>Manage agents for team: <span className="font-bold text-indigo-400">{selectedTeam?.name}</span></DialogDescription></div><Button onClick={() => setIsCreateAgentOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create New Agent</Button></DialogHeader><div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto p-2">{agents.map((agent) => (<div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50"><div className="flex-1 min-w-0">{renamingAgentId === agent.agentId ? (<Input defaultValue={agent.name} onChange={(e) => setNewAgentName(e.target.value)} onBlur={() => handleRenameAgent(agent.agentId)} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameAgent(agent.agentId); }} autoFocus className="text-lg font-semibold"/>) : (<h3 className="text-lg font-semibold">{agent.name}</h3>)}<p className="mt-2 text-sm text-gray-500 dark:text-gray-400 truncate">{agent.system_prompt}</p></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="ml-4 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => { setRenamingAgentId(agent.agentId); setNewAgentName(agent.name); }}><Edit className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem><DropdownMenuItem onClick={() => handleEditAgent(agent)}><FilePenLine className="mr-2 h-4 w-4" /> Edit Prompt</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-500" onClick={() => { setAgentToDelete(agent); setIsDeleteAgentDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Delete Agent</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>))}</div><DialogFooter><Button variant="outline" onClick={() => setIsAgentManagerOpen(false)}>Close</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isCreateAgentOpen} onOpenChange={setIsCreateAgentOpen}><DialogContent><DialogHeader><DialogTitle>Create New Agent</DialogTitle><DialogDescription>Define the name and core instructions for your new agent.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name</Label><Input id="name" value={createAgentName} onChange={(e) => setCreateAgentName(e.target.value)} className="col-span-3" placeholder="e.g., Marketing Specialist"/></div><div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="prompt" className="text-right pt-2">System Prompt</Label><Textarea id="prompt" value={createAgentPrompt} onChange={(e) => setCreateAgentPrompt(e.target.value)} className="col-span-3" placeholder="You are a helpful assistant who specializes in..." rows={8}/></div></div><DialogFooter><Button variant="outline" onClick={() => setIsCreateAgentOpen(false)}>Cancel</Button><Button onClick={handleCreateAgent}>Create Agent</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isDeleteAgentDialogOpen} onOpenChange={setIsDeleteAgentDialogOpen}><DialogContent><DialogHeader><DialogTitle>Are you absolutely sure?</DialogTitle><DialogDescription>This will permanently delete the agent <span className="font-bold text-yellow-400">{agentToDelete?.name}</span>.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteAgentDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteAgent}>Yes, Delete Agent</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isEditAgentOpen} onOpenChange={setIsEditAgentOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Edit Agent: {currentAgent?.name}</DialogTitle><DialogDescription>Modify the system prompt below.</DialogDescription></DialogHeader><div className="mt-4"><Textarea value={editedPrompt} onChange={(e) => setEditedPrompt(e.target.value)} className="h-96 text-sm font-mono bg-gray-50 dark:bg-gray-900"/></div><DialogFooter><Button variant="outline" onClick={() => setIsEditAgentOpen(false)}>Cancel</Button><Button onClick={handleSaveAgent}>Save Changes</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}