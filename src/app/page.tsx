// src/app/page.tsx
// v30.0 - Streamlined AI Team Builder to use AI-generated name

"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import { AppLayout, Team, ChatHistoryItem, Agent } from "@/components/AppLayout";
import { WelcomeScreen, ChatView, TeamManagementView } from "@/components/page-views";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AgentEditDialog } from "@/components/AgentEditDialog";

// --- Interfaces and State Definitions ---
interface AppState {
    view: 'welcome' | 'chat' | 'team_management' | 'team_builder';
    teams: Team[];
    chatHistory: ChatHistoryItem[];
    agents: Agent[];
    activeTeam: Team | null;
    currentChatId: string | null;
    messages: any[];
    builderMessages: any[];
    dialog: 'none' | 'create_team' | 'rename_chat' | 'delete_chat'; // MODIFIED: Removed 'name_ai_team'
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
    | { type: 'START_LOADING'; }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'INITIAL_LOAD_SUCCESS'; payload: { teams: Team[] } }
    | { type: 'SET_ACTIVE_TEAM'; payload: Team }
    | { type: 'FETCH_TEAM_DATA_SUCCESS'; payload: { chatHistory: ChatHistoryItem[]; agents: Agent[] } }
    | { type: 'SWITCH_MODE'; payload: 'chat' | 'team' }
    | { type: 'UPDATE_TEAMS_LIST'; payload: Team[] }
    | { type: 'START_NEW_CHAT'; }
    | { type: 'LOAD_CHAT_SUCCESS'; payload: { chatId: string; messages: any[] } }
    | { type: 'CHAT_RESPONSE_SUCCESS'; payload: { messages: any[]; chatId?: string; chatHistory?: ChatHistoryItem[] } }
    | { type: 'START_TEAM_BUILDER'; }
    | { type: 'SEND_BUILDER_MESSAGE'; payload: any }
    | { type: 'RECEIVE_BUILDER_MESSAGE'; payload: any }
    | { type: 'FINISH_TEAM_BUILDER'; payload: { newTeam: Team; teams: Team[] } }
    | { type: 'CANCEL_TEAM_BUILDER'; payload: { teams: Team[] } }
    | { type: 'OPEN_DIALOG'; payload: { dialog: AppState['dialog']; chat?: ChatHistoryItem } }
    | { type: 'CLOSE_DIALOG'; }
    | { type: 'UPDATE_CHAT_HISTORY'; payload: ChatHistoryItem[] }
    | { type: 'UPDATE_AGENTS'; payload: Agent[] };

function appReducer(state: AppState, action: AppAction): AppState {
    // This reducer is unchanged from v28.0/v29.0
    switch (action.type) {
        case 'START_LOADING': return { ...state, status: 'loading', error: null };
        case 'SET_ERROR': return { ...state, status: 'error', error: action.payload };
        case 'INITIAL_LOAD_SUCCESS':
            const firstTeam = action.payload.teams[0] || null;
            return { ...state, teams: action.payload.teams, activeTeam: firstTeam, status: 'idle', view: firstTeam ? 'chat' : 'welcome' };
        case 'SET_ACTIVE_TEAM':
            return { ...state, activeTeam: action.payload, currentChatId: null, messages: [], chatHistory: [], agents: [], status: 'loading' };
        case 'FETCH_TEAM_DATA_SUCCESS':
            return { ...state, status: 'idle', chatHistory: action.payload.chatHistory, agents: action.payload.agents };
        case 'SWITCH_MODE':
            if (action.payload === 'team') {
                const teamToShow = state.activeTeam || state.teams[0] || null;
                return { ...state, view: teamToShow ? 'team_management' : 'welcome' };
            }
            return { ...state, view: state.activeTeam ? 'chat' : 'welcome' };
        case 'START_NEW_CHAT': return { ...state, currentChatId: null, messages: [], view: 'chat' };
        case 'LOAD_CHAT_SUCCESS': return { ...state, status: 'idle', currentChatId: action.payload.chatId, messages: action.payload.messages, view: 'chat' };
        case 'CHAT_RESPONSE_SUCCESS':
            return { ...state, status: 'idle', messages: action.payload.messages, currentChatId: action.payload.chatId || state.currentChatId, chatHistory: action.payload.chatHistory || state.chatHistory };
        case 'START_TEAM_BUILDER':
            const placeholderTeam: Team = { teamId: 'wip-team', name: 'Designing New Team...' };
            return { ...state, teams: [placeholderTeam, ...state.teams], activeTeam: placeholderTeam, view: 'team_builder', builderMessages: [], status: 'idle' };
        case 'SEND_BUILDER_MESSAGE': return { ...state, status: 'loading', builderMessages: [...state.builderMessages, action.payload] };
        case 'RECEIVE_BUILDER_MESSAGE': return { ...state, status: 'idle', builderMessages: [...state.builderMessages, action.payload] };
        case 'FINISH_TEAM_BUILDER':
            return { ...state, status: 'idle', teams: action.payload.teams, activeTeam: action.payload.newTeam, view: 'team_management' };
        case 'CANCEL_TEAM_BUILDER':
            const aTeam = state.teams.filter(t => t.teamId !== 'wip-team')[0] || null;
            return { ...state, status: 'idle', teams: action.payload.teams, activeTeam: aTeam, view: aTeam ? 'team_management' : 'welcome' };
        case 'UPDATE_TEAMS_LIST': return { ...state, teams: action.payload, dialog: 'none' };
        case 'UPDATE_CHAT_HISTORY': return { ...state, chatHistory: action.payload, dialog: 'none' };
        case 'UPDATE_AGENTS': return { ...state, agents: action.payload, status: 'idle' };
        case 'OPEN_DIALOG': return { ...state, dialog: action.payload.dialog, chatToEdit: action.payload.chat || null };
        case 'CLOSE_DIALOG': return { ...state, dialog: 'none', chatToEdit: null };
        default: return state;
    }
}

export default function HomePage() {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [currentInput, setCurrentInput] = useState("");
    const [dialogInput, setDialogInput] = useState("");
    const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);
    const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

    // safeFetch and data fetching hooks are unchanged
    const safeFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        try {
            const response = await fetch(url, { ...options, headers: { ...options.headers, 'Content-Type': 'application/json' }});
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Request failed: ${response.status} ${errorBody}`);
            }
            return await response.json();
        } catch (error: any) {
            console.error("Fetch error:", error);
            dispatch({ type: 'SET_ERROR', payload: error.message || 'A network error occurred.' });
            return null;
        }
    }, []);
    const fetchTeams = useCallback(async () => {
        dispatch({ type: 'START_LOADING' });
        const teams = await safeFetch(`${backendApiUrl}/teams`);
        if (teams) dispatch({ type: 'INITIAL_LOAD_SUCCESS', payload: { teams } });
    }, [safeFetch]);
    const fetchDependenciesForTeam = useCallback(async (teamId: string) => {
        if (!teamId || teamId === 'wip-team') return;
        dispatch({ type: 'START_LOADING' });
        const [chatData, agentData] = await Promise.all([
            safeFetch(`${backendApiUrl}/teams/${teamId}/chats`),
            safeFetch(`${backendApiUrl}/teams/${teamId}/agents`)
        ]);
        if (chatData !== null && agentData !== null) {
            dispatch({ type: 'FETCH_TEAM_DATA_SUCCESS', payload: { chatHistory: chatData, agents: agentData } });
        }
    }, [safeFetch]);
    useEffect(() => { fetchTeams(); }, [fetchTeams]);
    useEffect(() => { if (state.activeTeam) fetchDependenciesForTeam(state.activeTeam.teamId); }, [state.activeTeam, fetchDependenciesForTeam]);

    // Navigation and chat handlers are unchanged
    const handleSetActiveTeam = (teamOrId: Team | string) => {
        if (state.view === 'team_builder') {
            const finalTeams = state.teams.filter(t => t.teamId !== 'wip-team');
            dispatch({ type: 'CANCEL_TEAM_BUILDER', payload: { teams: finalTeams } });
        }
        const team = typeof teamOrId === 'string' ? state.teams.find(t => t.teamId === teamOrId) : teamOrId;
        if (team && team.teamId !== state.activeTeam?.teamId) {
            dispatch({ type: 'SET_ACTIVE_TEAM', payload: team });
        }
    };
    const handleModeChange = (mode: 'chat' | 'team') => {
        if (state.view === 'team_builder') {
            const finalTeams = state.teams.filter(t => t.teamId !== 'wip-team');
            dispatch({ type: 'CANCEL_TEAM_BUILDER', payload: { teams: finalTeams } });
            if(mode === 'chat') dispatch({ type: 'SWITCH_MODE', payload: mode });
            return;
        }
        dispatch({ type: 'SWITCH_MODE', payload: mode });
    };
    const handleNewChat = () => dispatch({ type: 'START_NEW_CHAT' });
    const handleLoadChat = useCallback(async (chatId: string) => {
        dispatch({ type: 'START_LOADING' });
        const data = await safeFetch(`${backendApiUrl}/chats/${chatId}`);
        if (data && data.messages) dispatch({ type: 'LOAD_CHAT_SUCCESS', payload: { chatId, messages: data.messages } });
    }, [safeFetch]);
    const handleSubmitChat = async (e: React.FormEvent) => {
        e.preventDefault();
        const userInput = currentInput.trim();
        if (!userInput || !state.activeTeam) return;
        const userMessage = { role: 'user', content: userInput };
        dispatch({ type: 'SEND_BUILDER_MESSAGE', payload: userMessage });
        setCurrentInput("");
        const body = JSON.stringify({ message: userInput, chatId: state.currentChatId });
        const data = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`, { method: 'POST', body });
        if (data) {
            const needsHistoryRefresh = !state.currentChatId;
            const chatHistory = needsHistoryRefresh ? await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`) : state.chatHistory;
            dispatch({ type: 'CHAT_RESPONSE_SUCCESS', payload: { messages: data.messages, chatId: data.chatId, chatHistory: chatHistory || state.chatHistory } });
        }
    };
    
    // MODIFIED: Team Builder Logic
    const handleStartTeamBuilder = () => dispatch({ type: 'START_TEAM_BUILDER' });

    const handleSubmitTeamBuilder = async (e: React.FormEvent) => {
        e.preventDefault();
        const userInput = { role: 'user', content: currentInput.trim() };
        if (!userInput.content) return;
        
        dispatch({ type: 'SEND_BUILDER_MESSAGE', payload: userInput });
        setCurrentInput("");

        const response = await safeFetch(`${backendApiUrl}/team-builder/chat`, { method: 'POST', body: JSON.stringify({ messages: [...state.builderMessages, userInput] }) });
        
        if (response) {
            dispatch({ type: 'RECEIVE_BUILDER_MESSAGE', payload: response });
            const match = response.content.match(/```json\s*([\s\S]*?)\s*```/);
            if (match && match[1]) {
                try {
                    const teamData = JSON.parse(match[1]);
                    // MODIFIED: Check for team_name and agents, then create directly
                    if (teamData.team_name && teamData.agents && Array.isArray(teamData.agents)) {
                        const newTeamResponse = await safeFetch(`${backendApiUrl}/team-builder/create`, { method: 'POST', body: JSON.stringify(teamData) });
                        if(newTeamResponse && newTeamResponse.success) {
                            const finalTeams = [newTeamResponse, ...state.teams.filter(t => t.teamId !== 'wip-team')];
                            dispatch({ type: 'FINISH_TEAM_BUILDER', payload: { newTeam: newTeamResponse, teams: finalTeams } });
                        }
                    } else {
                         throw new Error("AI response did not contain a valid 'team_name' and 'agents' array.");
                    }
                } catch (e) {
                    const errMessage = { role: 'assistant', content: "Sorry, the AI returned invalid data. Please ask it to provide the JSON again."};
                    dispatch({ type: 'RECEIVE_BUILDER_MESSAGE', payload: errMessage });
                }
            }
        }
    };

    // Other handlers are unchanged
    const handleDialogOpen = (dialog: AppState['dialog'], chat?: ChatHistoryItem) => {
        if (chat) setDialogInput(chat.title);
        dispatch({ type: 'OPEN_DIALOG', payload: { dialog, chat } });
    };
    const handleDialogClose = () => {
        dispatch({ type: 'CLOSE_DIALOG' });
        setDialogInput("");
    };
    const handleCreateTeam = async () => {
        if (!dialogInput) return;
        const data = await safeFetch(`${backendApiUrl}/teams`, { method: 'POST', body: JSON.stringify({ name: dialogInput }) });
        if (data && data.success) {
            const newTeams = [{ teamId: data.teamId, name: data.name }, ...state.teams];
            dispatch({ type: 'UPDATE_TEAMS_LIST', payload: newTeams });
            handleDialogClose();
        }
    };
    const handleRenameChat = async () => {
        if (!dialogInput || !state.chatToEdit) return;
        const { chatId } = state.chatToEdit;
        const data = await safeFetch(`${backendApiUrl}/chats/${chatId}/rename`, { method: 'POST', body: JSON.stringify({ new_title: dialogInput }) });
        if (data && data.success) {
            const newHistory = state.chatHistory.map(c => c.chatId === chatId ? { ...c, title: dialogInput } : c);
            dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: newHistory });
            handleDialogClose();
        }
    };
    const handleDeleteChat = async () => {
        if (!state.chatToEdit || !state.activeTeam) return;
        const { chatId } = state.chatToEdit;
        const data = await safeFetch(`${backendApiUrl}/chats/${chatId}`, { method: 'DELETE' });
        if (data && data.success) {
            const newHistory = state.chatHistory.filter(c => c.chatId !== chatId);
            dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: newHistory });
            if (state.currentChatId === chatId) dispatch({ type: 'START_NEW_CHAT' });
            handleDialogClose();
        }
    };
    const handleEditAgentClick = (agent: Agent | null) => {
        setAgentToEdit(agent);
    };
    const handleSaveAgent = async (agentData: { name: string, system_prompt: string }) => {
        if (!state.activeTeam) return;
        const isCreating = !agentToEdit?.agentId;
        const url = isCreating ? `${backendApiUrl}/teams/${state.activeTeam.teamId}/agents` : `${backendApiUrl}/teams/${state.activeTeam.teamId}/agents/${agentToEdit.agentId}`;
        const method = isCreating ? 'POST' : 'PUT';
        const data = await safeFetch(url, { method, body: JSON.stringify(agentData) });
        if (data && data.success) {
            const updatedAgents = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/agents`);
            if (updatedAgents) dispatch({ type: 'UPDATE_AGENTS', payload: updatedAgents });
            handleEditAgentClick(null);
        }
    };
    const handleDeleteAgent = async (agentId: string) => {
        if (!state.activeTeam) return;
        const data = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/agents/${agentId}`, { method: 'DELETE' });
        if (data && data.success) {
             const updatedAgents = state.agents.filter(a => a.agentId !== agentId);
             dispatch({ type: 'UPDATE_AGENTS', payload: updatedAgents });
             handleEditAgentClick(null);
        }
    };
    
    // Render logic is unchanged
    const renderMainContent = () => {
        if (state.status === 'error') return <div className="p-8 text-red-500">Error: {state.error}</div>;
        switch (state.view) {
            case 'welcome': return <WelcomeScreen />;
            case 'chat': return <ChatView messages={state.messages} currentInput={currentInput} setCurrentInput={setCurrentInput} isLoading={state.status === 'loading'} handleSubmit={handleSubmitChat} />;
            case 'team_management':
                if (!state.activeTeam || state.activeTeam.teamId === 'wip-team') return <WelcomeScreen />;
                return <TeamManagementView team={state.activeTeam} agents={state.agents} isLoading={state.status === 'loading'} onCreateAgent={() => handleEditAgentClick({ agentId: '', name: '', system_prompt: '' })} onEditAgent={handleEditAgentClick} />;
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

            {/* MODIFIED: Removed the 'name_ai_team' Dialog */}
            <Dialog open={state.dialog === 'create_team'} onOpenChange={handleDialogClose}> <DialogContent> <DialogHeader><DialogTitle>Create New Team</DialogTitle></DialogHeader> <Input value={dialogInput} onChange={(e) => setDialogInput(e.target.value)} placeholder="e.g., Marketing Engine" /> <DialogFooter><Button variant="outline" onClick={handleDialogClose}>Cancel</Button><Button onClick={handleCreateTeam}>Create</Button></DialogFooter> </DialogContent> </Dialog>
            <Dialog open={state.dialog === 'rename_chat'} onOpenChange={handleDialogClose}> <DialogContent> <DialogHeader><DialogTitle>Rename Chat</DialogTitle></DialogHeader> <Input value={dialogInput} onChange={(e) => setDialogInput(e.target.value)} placeholder="Enter new title..." /> <DialogFooter><Button variant="outline" onClick={handleDialogClose}>Cancel</Button><Button onClick={handleRenameChat}>Rename</Button></DialogFooter> </DialogContent> </Dialog>
            <Dialog open={state.dialog === 'delete_chat'} onOpenChange={handleDialogClose}> <DialogContent> <DialogHeader><DialogTitle>Delete Chat</DialogTitle></DialogHeader> <p>Are you sure you want to delete "{state.chatToEdit?.title}"?</p> <DialogFooter><Button variant="outline" onClick={handleDialogClose}>Cancel</Button><Button variant="destructive" onClick={handleDeleteChat}>Delete</Button></DialogFooter> </DialogContent> </Dialog>
            
            <AgentEditDialog isOpen={!!agentToEdit} onOpenChange={(isOpen) => { if (!isOpen) handleEditAgentClick(null); }} agentToEdit={agentToEdit} onSave={handleSaveAgent} onDelete={handleDeleteAgent} />
        </>
    );
}