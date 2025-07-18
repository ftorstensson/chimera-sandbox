// src/app/test-layout/page.tsx
// Prototype v9.1: Definitive Color Palette as per Hex Codes

"use client"; 

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Users, Plus, Settings, Sun, Moon, MoreHorizontal, Edit, FilePenLine, Trash2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Team { teamId: string; name: string; }
interface ChatHistoryItem { chatId: string; title: string; }
interface Agent { agentId: string; name: string; system_prompt: string; }

// --- Shared ClassNames for Final Palette ---
const sidebarHoverStyle = "hover:bg-gray-200 dark:hover:bg-[#27272a]"; // zinc-800
const sidebarSelectedStyle = "!bg-gray-300 text-gray-900 dark:!bg-[#3f3f46] dark:text-gray-100"; // zinc-700

// ==============================================================================
//  Sidebar Components
// ==============================================================================
const ChatModeSidebar = ({ teams, selectedTeam, onSelectTeam, chatHistory }: { teams: Team[], selectedTeam: Team | null, onSelectTeam: (teamId: string) => void, chatHistory: ChatHistoryItem[] }) => ( 
    <div className="flex flex-col h-full"> 
        <div className="p-2 flex-shrink-0"> 
            <div className="text-center mb-4"> 
                <MessageSquare className="mx-auto h-8 w-8 mb-2" /> 
                <h2 className="text-xl font-semibold">Designer Chat</h2> 
                <p className="text-sm text-gray-500 dark:text-gray-400">Pick the multi-agent team that you want to work with</p> 
            </div> 
            <Select value={selectedTeam?.teamId} onValueChange={onSelectTeam}> 
                <SelectTrigger className={`w-full focus:ring-indigo-500 ${sidebarSelectedStyle}`}> 
                    <SelectValue placeholder="Select a team..." /> 
                </SelectTrigger> 
                <SelectContent className="bg-white text-gray-900 dark:bg-zinc-800 dark:text-white"> 
                    {teams.map(team => ( <SelectItem key={team.teamId} value={team.teamId}>{team.name}</SelectItem> ))} 
                </SelectContent> 
            </Select> 
            <Button variant="ghost" className={`w-full justify-start mt-2 ${sidebarHoverStyle}`}> <Plus className="mr-2 h-4 w-4" /> New Design Chat </Button> 
        </div> 
        <div className="flex-grow overflow-y-auto mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800"> 
            <p className="px-3 text-xs uppercase text-gray-500 tracking-wider">Recent Design Chats</p> 
            <nav className="mt-2 space-y-1 px-2"> {chatHistory.length > 0 ? ( chatHistory.map(chat => ( <Button key={chat.chatId} variant="ghost" className={`w-full justify-start ${sidebarHoverStyle}`}>{chat.title}</Button> )) ) : ( <p className="px-3 py-2 text-sm text-gray-500">No chats for this team yet.</p> )} </nav> 
        </div> 
    </div> 
);
const TeamModeSidebar = ({ teams, onTeamClick, activeTeam, onCreateTeamClick }: { teams: Team[], onTeamClick: (team: Team) => void, activeTeam: Team | null, onCreateTeamClick: () => void }) => ( 
    <div className="flex flex-col h-full"> 
        <div className="p-2 flex-shrink-0"> 
            <div className="text-center mb-4"> 
                <Users className="mx-auto h-8 w-8 mb-2" /> 
                <h2 className="text-xl font-semibold">Team Building</h2> 
                <p className="text-sm text-gray-500 dark:text-gray-400">Build and manage your multi-agent teams and agents.</p> 
            </div> 
            <Button variant="ghost" className={`w-full justify-start ${sidebarHoverStyle}`} onClick={onCreateTeamClick}> <Plus className="mr-2 h-4 w-4" /> New Team </Button> 
        </div> 
        <div className="flex-grow overflow-y-auto mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800"> 
            <p className="px-3 text-xs uppercase text-gray-500 tracking-wider">Manage Teams & Agents</p> 
            <nav className="mt-2 space-y-1 px-2"> {teams.map(team => ( <Button key={team.teamId} variant="ghost" className={`w-full justify-start ${sidebarHoverStyle} ${activeTeam?.teamId === team.teamId ? sidebarSelectedStyle : ''}`} onClick={() => onTeamClick(team)} > {team.name} </Button> ))} </nav> 
        </div> 
    </div> 
);

// ==============================================================================
//  Main Content Components
// ==============================================================================
const TeamManagementView = ({ team, agents, isLoading, onCreateAgent, onEditAgent, onRenameAgent, onDeleteAgent }: { team: Team, agents: Agent[], isLoading: boolean, onCreateAgent: () => void, onEditAgent: (agent: Agent) => void, onRenameAgent: (agent: Agent) => void, onDeleteAgent: (agent: Agent) => void }) => ( 
    <div> 
        <header className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-zinc-800"> 
            <div> <h1 className="text-3xl font-bold">{team.name}</h1> <p className="mt-1 text-lg text-gray-500 dark:text-gray-400"> Manage the agents in this team. </p> </div> 
            <Button onClick={onCreateAgent}> <Plus className="mr-2 h-4 w-4" /> New Agent </Button> 
        </header> 
        <div className="mt-6"> {isLoading ? <p>Loading agents...</p> : ( 
            <div className="space-y-4"> {agents.map(agent => ( 
                <div key={agent.agentId} className="p-4 border dark:border-zinc-800 rounded-lg flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50"> 
                    <div> <h3 className="font-semibold">{agent.name}</h3> <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-lg">{agent.system_prompt}</p> </div> 
                    <DropdownMenu> <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger> <DropdownMenuContent className="dark:bg-zinc-800 dark:text-white"> <DropdownMenuItem onClick={() => onRenameAgent(agent)}><Edit className="mr-2 h-4 w-4"/> Rename</DropdownMenuItem> <DropdownMenuItem onClick={() => onEditAgent(agent)}><FilePenLine className="mr-2 h-4 w-4"/> Edit Prompt</DropdownMenuItem> <DropdownMenuSeparator/> <DropdownMenuItem className="text-red-500" onClick={() => onDeleteAgent(agent)}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem> </DropdownMenuContent> </DropdownMenu> 
                </div> 
            ))} </div> 
        )} </div> 
    </div> 
);

// ==============================================================================
//  The Main Page Component
// ==============================================================================
const TestLayoutContent = () => {
  const [activeMode, setActiveMode] = useState<'chat' | 'team'>('team');
  const { theme, setTheme } = useTheme();
  const [teams, setTeams] = useState<Team[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
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
  const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

  const fetchTeams = useCallback(async () => { try { const response = await fetch(`${backendApiUrl}/teams`); const data: Team[] = await response.json(); setTeams(data); if (data.length > 0) { if (!activeTeam) setActiveTeam(data[0]); if (!selectedTeam) setSelectedTeam(data[0]); } return data; } catch (error) { console.error("Failed to fetch teams:", error); return []; } }, []);
  const fetchChatHistory = useCallback(async (teamId: string) => { if (!teamId) return; try { const res = await fetch(`${backendApiUrl}/teams/${teamId}/chats`); setChatHistory(await res.json()); } catch (e) { console.error(e); setChatHistory([]); }}, []);
  const fetchAgentsForTeam = useCallback(async (teamId: string) => { if (!teamId) return; setIsLoadingAgents(true); try { const res = await fetch(`${backendApiUrl}/teams/${teamId}/agents`); setAgents(await res.json()); } catch (e) { console.error(e); setAgents([]); } finally { setIsLoadingAgents(false); }}, []);
  useEffect(() => { fetchTeams(); }, [fetchTeams]);
  useEffect(() => { if (selectedTeam) { fetchChatHistory(selectedTeam.teamId); } }, [selectedTeam, fetchChatHistory]);
  useEffect(() => { if (activeTeam) { fetchAgentsForTeam(activeTeam.teamId); } }, [activeTeam, fetchAgentsForTeam]);
  const handleSelectTeamForChat = (teamId: string) => { const team = teams.find(t => t.teamId === teamId); if (team) setSelectedTeam(team); };
  const handleCreateTeam = async () => { if (!newTeamName.trim()) return; try { const response = await fetch(`${backendApiUrl}/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTeamName }) }); const newTeamResponse = await response.json(); setNewTeamName(""); setIsCreateTeamDialogOpen(false); const updatedTeams = await fetchTeams(); const newlyCreatedTeam = updatedTeams.find(t => t.teamId === newTeamResponse.teamId); if (newlyCreatedTeam) { setActiveTeam(newlyCreatedTeam); setSelectedTeam(newlyCreatedTeam); } } catch (error) { console.error("Failed to create team:", error); }};
  const handleCreateAgent = async () => { if (!activeTeam || !newAgentName.trim()) return; try { await fetch(`${backendApiUrl}/teams/${activeTeam.teamId}/agents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newAgentName, system_prompt: newAgentPrompt }) }); setIsCreateAgentDialogOpen(false); setNewAgentName(""); setNewAgentPrompt(""); await fetchAgentsForTeam(activeTeam.teamId); } catch (error) { console.error("Failed to create agent:", error); }};
  const handleEditAgent = async () => { if (!editingAgent || !activeTeam) return; try { await fetch(`${backendApiUrl}/teams/${activeTeam.teamId}/agents/${editingAgent.agentId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_prompt: editedAgentPrompt }) }); setIsEditAgentDialogOpen(false); setEditingAgent(null); await fetchAgentsForTeam(activeTeam.teamId); } catch (error) { console.error("Failed to edit agent:", error); }};
  const handleDeleteAgent = async () => { if (!deletingAgent || !activeTeam) return; try { await fetch(`${backendApiUrl}/teams/${activeTeam.teamId}/agents/${deletingAgent.agentId}`, { method: 'DELETE' }); setIsDeleteAgentDialogOpen(false); setDeletingAgent(null); await fetchAgentsForTeam(activeTeam.teamId); } catch (error) { console.error("Failed to delete agent:", error); }};

  return (
    <>
      <div className="flex h-screen bg-white dark:bg-[#171719] text-gray-900 dark:text-gray-100">
        <aside className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-zinc-800 p-2 flex flex-col bg-gray-100 dark:bg-[#141415]">
          <div className="flex-shrink-0 p-2"> <ToggleGroup type="single" value={activeMode} onValueChange={(value: 'chat' | 'team') => { if (value) setActiveMode(value); }} className="w-full grid grid-cols-2"> <ToggleGroupItem value="chat" aria-label="Toggle chat mode" className={activeMode === 'chat' ? sidebarSelectedStyle : sidebarHoverStyle}>CHAT</ToggleGroupItem> <ToggleGroupItem value="team" aria-label="Toggle team mode" className={activeMode === 'team' ? sidebarSelectedStyle : sidebarHoverStyle}>TEAM</ToggleGroupItem> </ToggleGroup> </div>
          <div className="flex-grow mt-2 overflow-y-auto">
            {activeMode === 'chat' ? ( <ChatModeSidebar teams={teams} selectedTeam={selectedTeam} onSelectTeam={handleSelectTeamForChat} chatHistory={chatHistory} /> ) : ( <TeamModeSidebar teams={teams} onTeamClick={setActiveTeam} activeTeam={activeTeam} onCreateTeamClick={() => setIsCreateTeamDialogOpen(true)} /> )}
          </div>
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-zinc-800 mt-2 pt-2 flex items-center justify-between"> <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={sidebarHoverStyle}> <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /> <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /> </Button> <Button variant="ghost" className={`text-sm ${sidebarHoverStyle}`}> <Settings className="mr-2 h-4 w-4" /> Settings </Button> </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto">
          {activeMode === 'team' && activeTeam ? ( <TeamManagementView team={activeTeam} agents={agents} isLoading={isLoadingAgents} onCreateAgent={() => setIsCreateAgentDialogOpen(true)} onEditAgent={(agent) => { setEditingAgent(agent); setEditedAgentPrompt(agent.system_prompt); setIsEditAgentDialogOpen(true); }} onRenameAgent={(agent) => alert("Rename coming soon!")} onDeleteAgent={(agent) => { setDeletingAgent(agent); setIsDeleteAgentDialogOpen(true); }}/> ) : ( <div> <h1 className="text-3xl font-bold">Chat View</h1> <p className="mt-2 text-lg text-gray-500"> The chat interface will go here. </p> </div> )}
        </main>
      </div>
      <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}> <DialogContent> <DialogHeader> <DialogTitle>Create New Team</DialogTitle> <DialogDescription> Give your new team of agents a name. </DialogDescription> </DialogHeader> <div className="grid gap-4 py-4"> <Label htmlFor="team-name">Team Name</Label> <Input id="team-name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="e.g., Marketing Content Engine" /> </div> <DialogFooter> <Button variant="outline" onClick={() => setIsCreateTeamDialogOpen(false)}>Cancel</Button> <Button onClick={handleCreateTeam}>Create Team</Button> </DialogFooter> </DialogContent> </Dialog>
      <Dialog open={isCreateAgentDialogOpen} onOpenChange={setIsCreateAgentDialogOpen}> <DialogContent><DialogHeader><DialogTitle>Create New Agent</DialogTitle><DialogDescription>Define the name and core instructions for your new agent.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><Label htmlFor="agent-name">Agent Name</Label><Input id="agent-name" value={newAgentName} onChange={e=>setNewAgentName(e.target.value)} placeholder="e.g., Copywriter" /><Label htmlFor="agent-prompt">System Prompt</Label><Textarea id="agent-prompt" value={newAgentPrompt} onChange={e=>setNewAgentPrompt(e.target.value)} placeholder="You are a witty copywriter..." rows={6}/></div><DialogFooter><Button variant="outline" onClick={()=>setIsCreateAgentDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateAgent}>Create Agent</Button></DialogFooter></DialogContent> </Dialog>
      <Dialog open={isEditAgentDialogOpen} onOpenChange={setIsEditAgentDialogOpen}> <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Edit Prompt for {editingAgent?.name}</DialogTitle></DialogHeader><Textarea value={editedAgentPrompt} onChange={e=>setEditedAgentPrompt(e.target.value)} rows={15} className="font-mono"/><DialogFooter><Button variant="outline" onClick={()=>setIsEditAgentDialogOpen(false)}>Cancel</Button><Button onClick={handleEditAgent}>Save Prompt</Button></DialogFooter></DialogContent> </Dialog>
      <Dialog open={isDeleteAgentDialogOpen} onOpenChange={setIsDeleteAgentDialogOpen}> <DialogContent><DialogHeader><DialogTitle>Delete Agent?</DialogTitle><DialogDescription>Are you sure you want to delete the agent <span className="font-bold text-yellow-400">{deletingAgent?.name}</span>? This is permanent.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={()=>setIsDeleteAgentDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteAgent}>Yes, Delete Agent</Button></DialogFooter></DialogContent> </Dialog>
    </>
  );
}

export default function TestLayoutPage() { return ( <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange> <TestLayoutContent /> </ThemeProvider> ); }