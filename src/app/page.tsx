// src/app/page.tsx
// v25.0 - Fixed AI Team Builder Workflow

"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import { AppLayout, Team, ChatHistoryItem, Agent } from "@/components/AppLayout";
import { WelcomeScreen, ChatView, TeamManagementView } from "@/components/page-views";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AgentEditDialog } from "@/components/AgentEditDialog";

interface AppState {
    view: 'welcome' | 'chat' | 'team_management' | 'team_builder';
    teams: Team[];
    chatHistory: ChatHistoryItem[];
    agents: Agent[];
    activeTeam: Team | null;
    currentChatId: string | null;
    messages: any[];
    builderMessages: any[];
    dialog: 'none' | 'create_team' | 'rename_chat' | 'delete_chat';
    chatToEdit: ChatHistoryItem | null;
    status: 'idle' | 'loading' | 'error';
    error: string | null;
}

const initialState: AppState = {
    view: 'welcome',
    teams: [],
    chatHistory: [],
    agents: [],
    activeTeam: null,
    currentChatId: null,
    messages: [],
    builderMessages: [],
    dialog: 'none',
    chatToEdit: null,
    status: 'idle',
    error: null,
};
type AppAction =
    | { type: 'START_LOADING' }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'INITIAL_LOAD_SUCCESS'; payload: { teams: Team[] } }
    | { type: 'SELECT_TEAM_IN_CHAT_MODE'; payload: Team }
    | { type: 'SELECT_TEAM_IN_TEAM_MODE'; payload: Team } 
    | { type: 'SELECT_TEAM_SUCCESS'; payload: { chatHistory: ChatHistoryItem[]; agents: Agent[] } }
    | { type: 'SWITCH_MODE'; payload: 'chat' | 'team' }
    | { type: 'CREATE_TEAM_SUCCESS'; payload: Team }
    | { type: 'START_NEW_CHAT' }
    | { type: 'LOAD_CHAT_SUCCESS'; payload: { chatId: string; messages: any[] } }
    | { type: 'SEND_CHAT_MESSAGE'; payload: any }
    | { type: 'RECEIVE_CHAT_MESSAGE'; payload: { messages: any[]; chatId?: string } }
    | { type: 'START_TEAM_BUILDER' }
    | { type: 'SEND_BUILDER_MESSAGE'; payload: any }
    | { type: 'RECEIVE_BUILDER_MESSAGE'; payload: any }
    | { type: 'FINISH_TEAM_BUILDER'; payload: Team }
    | { type: 'OPEN_DIALOG'; payload: { dialog: AppState['dialog']; chat?: ChatHistoryItem } }
    | { type: 'CLOSE_DIALOG' };

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'START_LOADING': return { ...state, status: 'loading', error: null };
        case 'SET_ERROR': return { ...state, status: 'error', error: action.payload };
        case 'INITIAL_LOAD_SUCCESS':
            const firstTeam = action.payload.teams[0] || null;
            return { ...state, teams: action.payload.teams, activeTeam: firstTeam, status: 'idle', view: firstTeam ? 'chat' : 'welcome' };
        case 'SELECT_TEAM_IN_CHAT_MODE':
            return { ...state, status: 'loading', activeTeam: action.payload, currentChatId: null, messages: [], view: 'chat' };
        case 'SELECT_TEAM_IN_TEAM_MODE':
            return { ...state, status: 'loading', activeTeam: action.payload, view: 'team_management' };
        case 'SELECT_TEAM_SUCCESS': return { ...state, status: 'idle', chatHistory: action.payload.chatHistory, agents: action.payload.agents };
        case 'SWITCH_MODE':
            if (action.payload === 'team') {
                const newActiveTeam = state.activeTeam || state.teams[0] || null;
                return { ...state, activeTeam: newActiveTeam, view: newActiveTeam ? 'team_management' : 'welcome' };
            }
            return { ...state, view: 'chat' };
        case 'CREATE_TEAM_SUCCESS': return { ...state, teams: [...state.teams, action.payload] };
        case 'START_NEW_CHAT': return { ...state, currentChatId: null, messages: [], view: 'chat' };
        case 'LOAD_CHAT_SUCCESS': return { ...state, status: 'idle', currentChatId: action.payload.chatId, messages: action.payload.messages, view: 'chat' };
        case 'SEND_CHAT_MESSAGE': return { ...state, status: 'loading', messages: [...state.messages, action.payload] };
        case 'RECEIVE_CHAT_MESSAGE': return { ...state, status: 'idle', messages: action.payload.messages, currentChatId: action.payload.chatId || state.currentChatId };
        case 'START_TEAM_BUILDER': return { ...state, view: 'team_builder', builderMessages: [], status: 'idle' };
        case 'SEND_BUILDER_MESSAGE': return { ...state, status: 'loading', builderMessages: [...state.builderMessages, action.payload] };
        case 'RECEIVE_BUILDER_MESSAGE': return { ...state, status: 'idle', builderMessages: [...state.builderMessages, action.payload] };
        case 'FINISH_TEAM_BUILDER':
            const newTeams = state.teams.map(t => t.teamId === 'wip-team' ? action.payload : t);
            if (!newTeams.find(t => t.teamId === action.payload.teamId)) { newTeams.push(action.payload); }
            return { ...state, teams: newTeams, activeTeam: action.payload, view: 'team_management' };
        case 'OPEN_DIALOG': return { ...state, dialog: action.payload.dialog, chatToEdit: action.payload.chat || null };
        case 'CLOSE_DIALOG': return { ...state, dialog: 'none', chatToEdit: null };
        default: return state;
    }
}

export default function HomePage() {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [currentInput, setCurrentInput] = useState("");
    const [dialogInput, setDialogInput] = useState("");
    const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
    const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);
    const [agentName, setAgentName] = useState("");
    const [agentPrompt, setAgentPrompt] = useState("");
    const [isSavingAgent, setIsSavingAgent] = useState(false);
    const [isDeletingAgent, setIsDeletingAgent] = useState(false);
    const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

    const fetchTeams = useCallback(async () => {
        try {
            const response = await fetch(`${backendApiUrl}/teams`);
            const data: Team[] = await response.json();
            dispatch({ type: 'INITIAL_LOAD_SUCCESS', payload: { teams: data } });
            return data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch teams.' });
            return [];
        }
    }, []);

    const fetchDependenciesForTeam = useCallback(async (teamId: string) => {
        dispatch({ type: 'START_LOADING' });
        try {
            const [chatRes, agentRes] = await Promise.all([ fetch(`${backendApiUrl}/teams/${teamId}/chats`), fetch(`${backendApiUrl}/teams/${teamId}/agents`), ]);
            const chatHistory = await chatRes.json();
            const agents = await agentRes.json();
            dispatch({ type: 'SELECT_TEAM_SUCCESS', payload: { chatHistory, agents } });
        } catch (error) { dispatch({ type: 'SET_ERROR', payload: 'Failed to load team data.' }); }
    }, []);

    useEffect(() => { fetchTeams(); }, [fetchTeams]);
    useEffect(() => { if (state.activeTeam) { fetchDependenciesForTeam(state.activeTeam.teamId); } }, [state.activeTeam, fetchDependenciesForTeam]);
    
    const handleSetActiveTeam = (teamOrId: Team | string) => { const teamToSelect = typeof teamOrId === 'string' ? state.teams.find(t => t.teamId === teamOrId) : teamOrId; if (teamToSelect && teamToSelect.teamId !== state.activeTeam?.teamId) { const currentMode = (state.view === 'team_management' || state.view === 'team_builder') ? 'team' : 'chat'; if (currentMode === 'team') { dispatch({ type: 'SELECT_TEAM_IN_TEAM_MODE', payload: teamToSelect }); } else { dispatch({ type: 'SELECT_TEAM_IN_CHAT_MODE', payload: teamToSelect }); } } };
    const handleModeChange = (mode: 'chat' | 'team') => { if(mode === 'team' && state.view === 'team_builder') return; dispatch({ type: 'SWITCH_MODE', payload: mode }); };
    const handleNewChat = () => dispatch({ type: 'START_NEW_CHAT' });
    const handleLoadChat = useCallback(async (chatId: string) => { dispatch({ type: 'START_LOADING' }); try { const response = await fetch(`${backendApiUrl}/chats/${chatId}`); const data = await response.json(); dispatch({ type: 'LOAD_CHAT_SUCCESS', payload: { chatId, messages: data.messages || [] } }); } catch (error) { dispatch({ type: 'SET_ERROR', payload: 'Failed to load chat.' }); } }, []);
    const handleSubmitChat = async (e: React.FormEvent) => { e.preventDefault(); if (!state.activeTeam || !currentInput.trim()) return; const userMessage = { role: 'user', content: currentInput }; dispatch({ type: 'SEND_CHAT_MESSAGE', payload: userMessage }); setCurrentInput(""); try { const res = await fetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId: state.currentChatId, message: userMessage.content }), }); const data = await res.json(); if (data.error) throw new Error(data.error); dispatch({ type: 'RECEIVE_CHAT_MESSAGE', payload: { messages: data.messages, chatId: data.chatId } }); if (!state.currentChatId) { await fetchDependenciesForTeam(state.activeTeam.teamId); } } catch (error) { dispatch({ type: 'SET_ERROR', payload: `Chat failed: ${error}` }); } };
    const handleCreateTeam = async () => { if (!dialogInput.trim()) return; dispatch({ type: 'START_LOADING' }); try { const response = await fetch(`${backendApiUrl}/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: dialogInput }) }); const newTeam = await response.json(); dispatch({ type: 'CREATE_TEAM_SUCCESS', payload: newTeam }); handleSetActiveTeam(newTeam); handleDialogClose(); } catch (error) { dispatch({ type: 'SET_ERROR', payload: 'Failed to create team.' }); } };
    const handleRenameChat = async () => { if (!state.chatToEdit || !dialogInput.trim() || !state.activeTeam) return; try { await fetch(`${backendApiUrl}/chats/${state.chatToEdit.chatId}/rename`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ new_title: dialogInput }), }); handleDialogClose(); await fetchDependenciesForTeam(state.activeTeam.teamId); } catch (error) { dispatch({ type: 'SET_ERROR', payload: 'Failed to rename chat.' }); } };
    const handleDeleteChat = async () => { if (!state.chatToEdit || !state.activeTeam) return; try { await fetch(`${backendApiUrl}/chats/${state.chatToEdit.chatId}`, { method: "DELETE" }); if (state.currentChatId === state.chatToEdit.chatId) { dispatch({ type: 'START_NEW_CHAT' }); } handleDialogClose(); await fetchDependenciesForTeam(state.activeTeam.teamId); } catch (error) { dispatch({ type: 'SET_ERROR', payload: 'Failed to delete chat.' }); } };
    const handleStartTeamBuilder = () => dispatch({ type: 'START_TEAM_BUILDER' });
    
    const handleSubmitTeamBuilder = async (e: React.FormEvent) => {
        e.preventDefault();
        const userInputContent = currentInput.trim();
        if (!userInputContent) return;
        const userMessage = { role: 'user', content: userInputContent };
        dispatch({ type: 'SEND_BUILDER_MESSAGE', payload: userMessage });
        setCurrentInput("");
        try {
            const response = await fetch(`${backendApiUrl}/team-builder/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [...state.builderMessages, userMessage] }) });
            const data = await response.json();
            dispatch({ type: 'RECEIVE_BUILDER_MESSAGE', payload: data });
            const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/;
            const match = data.content.match(codeBlockRegex);
            if (match && match[1]) {
                const teamData = JSON.parse(match[1]);
                const creationResponse = await fetch(`${backendApiUrl}/team-builder/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(teamData) });
                const newTeam = await creationResponse.json();
                if (newTeam.success) {
                    await fetchTeams(); // Refetch all teams
                    dispatch({ type: 'FINISH_TEAM_BUILDER', payload: { teamId: newTeam.teamId, name: newTeam.name } });
                } else {
                   throw new Error(newTeam.error || "Team creation failed on backend.");
                }
            }
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: `Team Builder failed: ${error}`});
        }
    };

    const handleDialogOpen = (dialog: AppState['dialog'], chat?: ChatHistoryItem) => { setDialogInput(chat?.title || ""); dispatch({ type: 'OPEN_DIALOG', payload: { dialog, chat } }); };
    const handleDialogClose = () => { setDialogInput(""); dispatch({ type: 'CLOSE_DIALOG' }); };
    const handleCreateAgentClick = () => { setAgentToEdit(null); setAgentName(""); setAgentPrompt(""); setIsAgentDialogOpen(true); };
    const handleEditAgentClick = (agent: Agent) => { setAgentToEdit(agent); setAgentName(agent.name); setAgentPrompt(agent.system_prompt); setIsAgentDialogOpen(true); };
    const handleSaveAgent = async () => { if (!state.activeTeam || !agentName.trim() || !agentPrompt.trim()) return; setIsSavingAgent(true); const isEditing = agentToEdit !== null; const url = isEditing ? `${backendApiUrl}/teams/${state.activeTeam.teamId}/agents/${agentToEdit.agentId}` : `${backendApiUrl}/teams/${state.activeTeam.teamId}/agents`; const method = isEditing ? 'PUT' : 'POST'; try { const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: agentName, system_prompt: agentPrompt }) }); if (!res.ok) throw new Error('API request failed'); setIsAgentDialogOpen(false); await fetchDependenciesForTeam(state.activeTeam.teamId); } catch (error) { dispatch({ type: 'SET_ERROR', payload: `Failed to save agent: ${error}` }); } finally { setIsSavingAgent(false); } };
    const handleDeleteAgent = async () => { if (!state.activeTeam || !agentToEdit) return; if (!confirm(`Are you sure you want to delete "${agentToEdit.name}"?`)) return; setIsDeletingAgent(true); try { const res = await fetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/agents/${agentToEdit.agentId}`, { method: 'DELETE' }); if (!res.ok) throw new Error('API request failed'); setIsAgentDialogOpen(false); await fetchDependenciesForTeam(state.activeTeam.teamId); } catch (error) { dispatch({ type: 'SET_ERROR', payload: `Failed to delete agent: ${error}` }); } finally { setIsDeletingAgent(false); } };
    
    const renderMainContent = () => {
        switch (state.view) {
            case 'welcome': return <WelcomeScreen />;
            case 'chat': return <ChatView messages={state.messages} currentInput={currentInput} setCurrentInput={setCurrentInput} isLoading={state.status === 'loading'} handleSubmit={handleSubmitChat} />;
            case 'team_management': 
                if (!state.activeTeam) return <WelcomeScreen />;
                return <TeamManagementView team={state.activeTeam} agents={state.agents} isLoading={state.status === 'loading'} onCreateAgent={handleCreateAgentClick} onEditAgent={handleEditAgentClick} />;
            case 'team_builder': return <ChatView messages={state.builderMessages} currentInput={currentInput} setCurrentInput={setCurrentInput} isLoading={state.status === 'loading'} handleSubmit={handleSubmitTeamBuilder} />;
            default: return <WelcomeScreen />;
        }
    };
    const activeMode = (state.view === 'team_management' || state.view === 'team_builder') ? 'team' : 'chat';
    return (
        <>
            <AppLayout activeMode={activeMode} setActiveMode={handleModeChange} teams={state.teams} activeTeam={state.activeTeam} chatHistory={state.chatHistory} currentChatId={state.currentChatId} onSetActiveTeam={handleSetActiveTeam} onNewChat={handleNewChat} onLoadChat={handleLoadChat} onCreateTeamClick={() => handleDialogOpen('create_team')} onCreateTeamWithAIClick={handleStartTeamBuilder} onRenameChat={(chat) => handleDialogOpen('rename_chat', chat)} onDeleteChat={(chat) => handleDialogOpen('delete_chat', chat)}>
                {renderMainContent()}
            </AppLayout>

            <Dialog open={state.dialog === 'create_team'} onOpenChange={handleDialogClose}> <DialogContent> <DialogHeader><DialogTitle>Create New Team</DialogTitle></DialogHeader> <Input value={dialogInput} onChange={(e) => setDialogInput(e.target.value)} placeholder="e.g., Marketing Engine" /> <DialogFooter><Button variant="outline" onClick={handleDialogClose}>Cancel</Button><Button onClick={handleCreateTeam}>Create</Button></DialogFooter> </DialogContent> </Dialog>
            <Dialog open={state.dialog === 'rename_chat'} onOpenChange={handleDialogClose}> <DialogContent> <DialogHeader><DialogTitle>Rename Chat</DialogTitle></DialogHeader> <Input value={dialogInput} onChange={(e) => setDialogInput(e.target.value)} placeholder="Enter new title..." /> <DialogFooter><Button variant="outline" onClick={handleDialogClose}>Cancel</Button><Button onClick={handleRenameChat}>Rename</Button></DialogFooter> </DialogContent> </Dialog>
            <Dialog open={state.dialog === 'delete_chat'} onOpenChange={handleDialogClose}> <DialogContent> <DialogHeader><DialogTitle>Delete Chat</DialogTitle></DialogHeader> <p>Are you sure you want to delete "{state.chatToEdit?.title}"?</p> <DialogFooter><Button variant="outline" onClick={handleDialogClose}>Cancel</Button><Button variant="destructive" onClick={handleDeleteChat}>Delete</Button></DialogFooter> </DialogContent> </Dialog>
            <AgentEditDialog isOpen={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen} agentToEdit={agentToEdit} onSave={handleSaveAgent} onDelete={handleDeleteAgent} isSaving={isSavingAgent} isDeleting={isDeletingAgent} agentName={agentName} setAgentName={setAgentName} agentPrompt={agentPrompt} setAgentPrompt={setAgentPrompt} />
        </>
    );
}