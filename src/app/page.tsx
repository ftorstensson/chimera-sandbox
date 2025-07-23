// src/app/page.tsx
// v34.1 - Fixed Typo in handleSetActiveTeam Logic

"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import { AppLayout, Team, ChatHistoryItem, Agent, DesignSession } from "@/components/AppLayout";
import { WelcomeScreen, ChatView, TeamManagementView } from "@/components/page-views";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import { Users } from 'lucide-react';

// --- Interfaces and State Definitions ---
interface AppState {
    view: 'welcome' | 'chat' | 'team_management' | 'team_builder';
    teams: Team[];
    designSessions: DesignSession[];
    chatHistory: ChatHistoryItem[];
    agents: Agent[];
    activeTeam: Team | null;
    activeDesignSession: DesignSession | null;
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
    designSessions: [],
    chatHistory: [],
    agents: [],
    activeTeam: null,
    activeDesignSession: null,
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
    | { type: 'INITIAL_LOAD_SUCCESS'; payload: { teams: Team[], designSessions: DesignSession[] } }
    | { type: 'SET_ACTIVE_TEAM_FOR_CHAT'; payload: Team | null }
    | { type: 'SET_ACTIVE_TEAM_FOR_MANAGEMENT'; payload: Team }
    | { type: 'FETCH_TEAM_DATA_SUCCESS'; payload: { chatHistory: ChatHistoryItem[]; agents: Agent[] } }
    | { type: 'SWITCH_MODE'; payload: 'chat' | 'team' }
    | { type: 'UPDATE_TEAMS_LIST'; payload: Team[] }
    | { type: 'START_NEW_CHAT'; }
    | { type: 'LOAD_CHAT_SUCCESS'; payload: { chatId: string; messages: any[] } }
    | { type: 'CHAT_RESPONSE_SUCCESS'; payload: { messages: any[]; chatId?: string; chatHistory?: ChatHistoryItem[] } }
    | { type: 'START_NEW_DESIGN_SESSION_SUCCESS'; payload: DesignSession }
    | { type: 'LOAD_DESIGN_SESSION'; payload: DesignSession }
    | { type: 'SEND_BUILDER_MESSAGE'; payload: any }
    | { type: 'RECEIVE_BUILDER_MESSAGE'; payload: { message: any, designSessionId: string } }
    | { type: 'FINISH_TEAM_BUILDER'; payload: { newTeam: Team; teams: Team[]; designSessions: DesignSession[] } }
    | { type: 'OPEN_DIALOG'; payload: { dialog: AppState['dialog']; chat?: ChatHistoryItem } }
    | { type: 'CLOSE_DIALOG'; }
    | { type: 'UPDATE_CHAT_HISTORY'; payload: ChatHistoryItem[] }
    | { type: 'UPDATE_AGENTS'; payload: Agent[] };

function appReducer(state: AppState, action: AppAction): AppState {
    // Reducer is unchanged from v34.0
    switch (action.type) {
        case 'START_LOADING': return { ...state, status: 'loading', error: null };
        case 'SET_ERROR': return { ...state, status: 'error', error: action.payload };
        case 'INITIAL_LOAD_SUCCESS':
            return { ...state, teams: action.payload.teams, designSessions: action.payload.designSessions, activeTeam: action.payload.teams[0] || null, status: 'idle', view: 'chat' };
        case 'SET_ACTIVE_TEAM_FOR_CHAT':
            return { ...state, activeTeam: action.payload, activeDesignSession: null, currentChatId: null, messages: [], chatHistory: [], agents: [], status: 'loading', view: 'chat' };
        case 'SET_ACTIVE_TEAM_FOR_MANAGEMENT':
            return { ...state, activeTeam: action.payload, activeDesignSession: null, agents: [], status: 'loading', view: 'team_management' };
        case 'FETCH_TEAM_DATA_SUCCESS':
            return { ...state, status: 'idle', chatHistory: action.payload.chatHistory, agents: action.payload.agents };
        case 'SWITCH_MODE':
            if (action.payload === 'team') {
                return { ...state, view: 'team_management', activeTeam: null, activeDesignSession: null, builderMessages: [], currentChatId: null };
            }
            return { ...state, view: 'chat', activeTeam: state.teams[0] || null, activeDesignSession: null };
        case 'START_NEW_CHAT': return { ...state, currentChatId: null, messages: [], view: 'chat' };
        case 'LOAD_CHAT_SUCCESS': return { ...state, status: 'idle', currentChatId: action.payload.chatId, messages: action.payload.messages, view: 'chat' };
        case 'CHAT_RESPONSE_SUCCESS':
            return { ...state, status: 'idle', messages: action.payload.messages, currentChatId: action.payload.chatId || state.currentChatId, chatHistory: action.payload.chatHistory || state.chatHistory };
        case 'START_NEW_DESIGN_SESSION_SUCCESS':
            return { ...state, designSessions: [action.payload, ...state.designSessions], builderMessages: action.payload.messages, activeDesignSession: action.payload, view: 'team_builder', activeTeam: null, status: 'idle' };
        case 'LOAD_DESIGN_SESSION':
            return { ...state, builderMessages: action.payload.messages, activeDesignSession: action.payload, view: 'team_builder', activeTeam: null, status: 'idle' };
        case 'SEND_BUILDER_MESSAGE': return { ...state, status: 'loading', builderMessages: [...state.builderMessages, action.payload] };
        case 'RECEIVE_BUILDER_MESSAGE':
            const updatedSessions = state.designSessions.map(s => s.designSessionId === action.payload.designSessionId ? { ...s, messages: [...s.messages, action.payload.message] } : s);
            return { ...state, status: 'idle', builderMessages: [...state.builderMessages, action.payload.message], designSessions: updatedSessions };
        case 'FINISH_TEAM_BUILDER':
            return { ...state, status: 'idle', teams: action.payload.teams, designSessions: action.payload.designSessions, activeTeam: action.payload.newTeam, activeDesignSession: null, view: 'team_management' };
        case 'UPDATE_TEAMS_LIST': return { ...state, teams: action.payload, dialog: 'none' };
        case 'UPDATE_CHAT_HISTORY': return { ...state, chatHistory: action.payload, dialog: 'none' };
        case 'UPDATE_AGENTS': return { ...state, agents: action.payload, status: 'idle' };
        case 'OPEN_DIALOG': return { ...state, dialog: action.payload.dialog, chatToEdit: action.payload.chat || null };
        case 'CLOSE_DIALOG': return { ...state, dialog: 'none', chatToEdit: null };
        default: return state;
    }
}

const TeamWelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400"/>
      <h1 className="text-2xl font-bold">Team Management</h1>
      <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Select a team from the sidebar to view and manage its agents.</p>
    </div>
);

export default function HomePage() {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [currentInput, setCurrentInput] = useState("");
    const [dialogInput, setDialogInput] = useState("");
    const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);
    const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

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
    
    const fetchDependenciesForTeam = useCallback(async (teamId: string) => {
        if (!teamId) return;
        dispatch({ type: 'START_LOADING' });
        const [chatData, agentData] = await Promise.all([
            safeFetch(`${backendApiUrl}/teams/${teamId}/chats`),
            safeFetch(`${backendApiUrl}/teams/${teamId}/agents`)
        ]);
        if (chatData !== null && agentData !== null) {
            dispatch({ type: 'FETCH_TEAM_DATA_SUCCESS', payload: { chatHistory: chatData, agents: agentData } });
        }
    }, [safeFetch]);
    
    const loadInitialData = useCallback(async () => {
        dispatch({ type: 'START_LOADING' });
        const [teams, designSessions] = await Promise.all([
            safeFetch(`${backendApiUrl}/teams`),
            safeFetch(`${backendApiUrl}/team-builder/sessions`)
        ]);
        if (teams !== null && designSessions !== null) {
            dispatch({ type: 'INITIAL_LOAD_SUCCESS', payload: { teams, designSessions } });
        }
    }, [safeFetch]);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);
    useEffect(() => {
        if (state.activeTeam && state.view !== 'team_management') {
            fetchDependenciesForTeam(state.activeTeam.teamId);
        } else if (state.activeTeam && state.view === 'team_management' && state.agents.length === 0) {
            fetchDependenciesForTeam(state.activeTeam.teamId);
        }
    }, [state.activeTeam, state.view, fetchDependenciesForTeam]);

    // MODIFIED: Simplified the handler
    const handleSetActiveTeam = (teamOrId: Team | string) => {
        const team = typeof teamOrId === 'string' ? state.teams.find(t => t.teamId === teamOrId) : teamOrId;
        if (!team) return;

        // The activeMode variable will determine the correct action
        const activeMode = (state.view === 'team_management' || state.view === 'team_builder') ? 'team' : 'chat';

        if (activeMode === 'team') {
            if (state.activeTeam?.teamId !== team.teamId) {
                dispatch({ type: 'SET_ACTIVE_TEAM_FOR_MANAGEMENT', payload: team });
            }
        } else {
            if (state.activeTeam?.teamId !== team.teamId) {
                dispatch({ type: 'SET_ACTIVE_TEAM_FOR_CHAT', payload: team });
            }
        }
    };
    
    const handleModeChange = (mode: 'chat' | 'team') => {
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
    const handleStartTeamBuilder = async () => {
        const sessionData = await safeFetch(`${backendApiUrl}/team-builder/session`, { method: 'POST' });
        if (sessionData) {
            dispatch({ type: 'START_NEW_DESIGN_SESSION_SUCCESS', payload: sessionData });
        }
    };
    const handleLoadDesignSession = (session: DesignSession) => {
        dispatch({ type: 'LOAD_DESIGN_SESSION', payload: session });
    };
    const handleSubmitTeamBuilder = async (e: React.FormEvent) => {
        e.preventDefault();
        const userInput = { role: 'user', content: currentInput.trim() };
        if (!userInput.content || !state.activeDesignSession) return;
        const currentMessages = state.builderMessages;
        dispatch({ type: 'SEND_BUILDER_MESSAGE', payload: userInput });
        setCurrentInput("");
        const body = JSON.stringify({ messages: [...currentMessages, userInput], designSessionId: state.activeDesignSession.designSessionId });
        const response = await safeFetch(`${backendApiUrl}/team-builder/chat`, { method: 'POST', body });
        if (response) {
            dispatch({ type: 'RECEIVE_BUILDER_MESSAGE', payload: { message: response, designSessionId: state.activeDesignSession.designSessionId } });
            const content = response.content.trim();
            const match = content.match(/^```json\s*([\s\S]*?)\s*```$/);
            if (match && match[1]) {
                try {
                    const teamData = JSON.parse(match[1]);
                    if (teamData.team_name && teamData.agents && Array.isArray(teamData.agents)) {
                        const createBody = JSON.stringify({ ...teamData, designSessionId: state.activeDesignSession.designSessionId });
                        const newTeamResponse = await safeFetch(`${backendApiUrl}/team-builder/create`, { method: 'POST', body: createBody });
                        if(newTeamResponse && newTeamResponse.success) {
                            const finalTeams = [newTeamResponse, ...state.teams];
                            const finalDesignSessions = state.designSessions.filter(s => s.designSessionId !== state.activeDesignSession?.designSessionId);
                            dispatch({ type: 'FINISH_TEAM_BUILDER', payload: { newTeam: newTeamResponse, teams: finalTeams, designSessions: finalDesignSessions } });
                        }
                    }
                } catch (e) {
                    console.log("AI provided a non-fatal invalid JSON, continuing conversation.");
                }
            }
        }
    };
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
    
    const renderMainContent = () => {
        if (state.status === 'loading' && state.view !== 'team_builder') return <div className="p-8">Loading...</div>;
        if (state.status === 'error') return <div className="p-8 text-red-500">Error: {state.error}</div>;
        const activeMode = (state.view === 'team_management' || state.view === 'team_builder') ? 'team' : 'chat';
        switch (state.view) {
            case 'welcome': return <WelcomeScreen />;
            case 'chat':
                if (!state.activeTeam) return <WelcomeScreen />;
                return <ChatView messages={state.messages} currentInput={currentInput} setCurrentInput={setCurrentInput} isLoading={state.status === 'loading'} handleSubmit={handleSubmitChat} />;
            case 'team_management':
                if (!state.activeTeam) return <TeamWelcomeScreen />;
                return <TeamManagementView team={state.activeTeam} agents={state.agents} isLoading={state.status === 'loading'} onCreateAgent={() => handleEditAgentClick({ agentId: '', name: '', system_prompt: '' })} onEditAgent={handleEditAgentClick} />;
            case 'team_builder':
                return <ChatView messages={state.builderMessages} currentInput={currentInput} setCurrentInput={setCurrentInput} isLoading={state.status === 'loading'} handleSubmit={handleSubmitTeamBuilder} />;
            default: return <WelcomeScreen />;
        }
    };
    
    const activeMode = (state.view === 'team_management' || state.view === 'team_builder') ? 'team' : 'chat';
    
    return (
        <>
            <AppLayout
                activeMode={activeMode}
                setActiveMode={handleModeChange}
                teams={state.teams}
                designSessions={state.designSessions}
                activeTeam={state.activeTeam}
                chatHistory={state.chatHistory}
                currentChatId={state.currentChatId}
                onSetActiveTeam={handleSetActiveTeam}
                onNewChat={handleNewChat}
                onLoadChat={handleLoadChat}
                onCreateTeamClick={() => handleDialogOpen('create_team')}
                onCreateTeamWithAIClick={handleStartTeamBuilder}
                onLoadDesignSession={handleLoadDesignSession}
                onRenameChat={(chat) => handleDialogOpen('rename_chat', chat)}
                onDeleteChat={(chat) => handleDialogOpen('delete_chat', chat)}>
                {renderMainContent()}
            </AppLayout>

            <Dialog open={state.dialog === 'create_team'} onOpenChange={handleDialogClose}> <DialogContent> <DialogHeader><DialogTitle>Create New Team</DialogTitle></DialogHeader> <Input value={dialogInput} onChange={(e) => setDialogInput(e.target.value)} placeholder="e.g., Marketing Engine" /> <DialogFooter><Button variant="outline" onClick={handleDialogClose}>Cancel</Button><Button onClick={handleCreateTeam}>Create</Button></DialogFooter> </DialogContent> </Dialog>
            <Dialog open={state.dialog === 'rename_chat'} onOpenChange={handleDialogClose}> <DialogContent> <DialogHeader><DialogTitle>Rename Chat</DialogTitle></DialogHeader> <Input value={dialogInput} onChange={(e) => setDialogInput(e.target.value)} placeholder="Enter new title..." /> <DialogFooter><Button variant="outline" onClick={handleDialogClose}>Cancel</Button><Button onClick={handleRenameChat}>Rename</Button></DialogFooter> </DialogContent> </Dialog>
            <Dialog open={state.dialog === 'delete_chat'} onOpenChange={handleDialogClose}> <DialogContent> <DialogHeader><DialogTitle>Delete Chat</DialogTitle></DialogHeader> <p>Are you sure you want to delete "{state.chatToEdit?.title}"?</p> <DialogFooter><Button variant="outline" onClick={handleDialogClose}>Cancel</Button><Button variant="destructive" onClick={handleDeleteChat}>Delete</Button></DialogFooter> </DialogContent> </Dialog>
            
            <AgentEditDialog isOpen={!!agentToEdit} onOpenChange={(isOpen) => { if (!isOpen) handleEditAgentClick(null); }} agentToEdit={agentToEdit} onSave={handleSaveAgent} onDelete={handleDeleteAgent} />
        </>
    );
}