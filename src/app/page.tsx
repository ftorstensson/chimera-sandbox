// src/app/page.tsx
// v54.3 - DEFINITIVE FIX for team deletion and JSON parsing bugs

"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import { AppLayout, Team, ChatHistoryItem, Agent, DesignSession } from "@/components/AppLayout";
import { WelcomeScreen, ChatView, TeamManagementView } from "@/components/page-views";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
    dialog: 'none' | 'rename_chat' | 'delete_chat' | 'delete_agent' | 'delete_design_session' | 'rename_team' | 'delete_team';
    chatToEdit: ChatHistoryItem | null;
    agentToDelete: Agent | null;
    designSessionToDelete: DesignSession | null;
    teamToEdit: Team | null;
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
    dialog: 'none',
    chatToEdit: null,
    agentToDelete: null,
    designSessionToDelete: null,
    teamToEdit: null,
    status: 'idle',
    error: null,
};

type AppAction =
    | { type: 'START_LOADING'; }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'INITIAL_LOAD_SUCCESS'; payload: { teams: Team[], designSessions: DesignSession[] } }
    | { type: 'SET_ACTIVE_TEAM_FOR_CHAT'; payload: Team }
    | { type: 'SET_ACTIVE_TEAM_FOR_MANAGEMENT'; payload: Team | null }
    | { type: 'FETCH_TEAM_DATA_SUCCESS'; payload: { chatHistory: ChatHistoryItem[]; agents: Agent[] } }
    | { type: 'SWITCH_MODE'; payload: 'chat' | 'team' }
    | { type: 'START_NEW_CHAT'; }
    | { type: 'LOAD_CHAT_SUCCESS'; payload: { chatId: string; messages: any[] } }
    | { type: 'CHAT_RESPONSE_SUCCESS'; payload: { messages: any[]; chatId?: string | null; chatHistory?: ChatHistoryItem[] } }
    | { type: 'START_TEAM_BUILDER'; }
    | { type: 'OPTIMISTIC_UPDATE_DESIGN_SESSION'; payload: { userMessage: any } }
    | { type: 'UPDATE_DESIGN_SESSION_SUCCESS'; payload: DesignSession }
    | { type: 'ADD_CREATION_MESSAGE'; payload: { designSessionId: string | null } }
    | { type: 'LOAD_DESIGN_SESSION'; payload: DesignSession }
    | { type: 'FINISH_TEAM_BUILDER'; payload: { newTeam: Team; teams: Team[]; designSessions: DesignSession[] } }
    | { type: 'OPEN_DIALOG'; payload: { dialog: AppState['dialog']; chat?: ChatHistoryItem, agent?: Agent, designSession?: DesignSession, team?: Team } }
    | { type: 'CLOSE_DIALOG'; }
    | { type: 'UPDATE_TEAMS_LIST'; payload: Team[] }
    | { type: 'UPDATE_ACTIVE_TEAM'; payload: Team }
    | { type: 'UPDATE_CHAT_HISTORY'; payload: ChatHistoryItem[] }
    | { type: 'UPDATE_AGENTS'; payload: Agent[] }
    | { type: 'UPDATE_DESIGN_SESSIONS'; payload: DesignSession[] };

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'START_LOADING': return { ...state, status: 'loading', error: null };
        case 'SET_ERROR': return { ...state, status: 'error', error: action.payload };
        case 'INITIAL_LOAD_SUCCESS':
            return { ...state, teams: action.payload.teams, designSessions: action.payload.designSessions, activeTeam: state.view !== 'team_management' ? action.payload.teams[0] || null : null, status: 'idle' };
        case 'SET_ACTIVE_TEAM_FOR_CHAT':
            return { ...state, view: 'chat', activeTeam: action.payload, activeDesignSession: null, currentChatId: null, messages: [], chatHistory: [], agents: [], status: 'loading' };
        case 'SET_ACTIVE_TEAM_FOR_MANAGEMENT':
            return { ...state, view: 'team_management', activeTeam: action.payload, activeDesignSession: null, agents: [], status: 'loading' };
        case 'FETCH_TEAM_DATA_SUCCESS':
            return { ...state, status: 'idle', chatHistory: action.payload.chatHistory, agents: action.payload.agents };
        case 'SWITCH_MODE':
            if (action.payload === 'team') {
                return { ...state, view: 'team_management', activeTeam: state.activeTeam || state.teams[0] || null, activeDesignSession: null };
            }
            return { ...state, view: 'chat', activeTeam: state.activeTeam || state.teams[0] || null, activeDesignSession: null };
        case 'START_NEW_CHAT': return { ...state, currentChatId: null, messages: [], view: 'chat' };
        case 'LOAD_CHAT_SUCCESS': return { ...state, status: 'idle', currentChatId: action.payload.chatId, messages: action.payload.messages, view: 'chat' };
        case 'CHAT_RESPONSE_SUCCESS':
            return { ...state, status: 'idle', messages: action.payload.messages, currentChatId: action.payload.chatId || state.currentChatId, chatHistory: action.payload.chatHistory || state.chatHistory };
        case 'START_TEAM_BUILDER':
            return { ...state, view: 'team_builder', activeDesignSession: null, activeTeam: null, status: 'idle' };
        case 'OPTIMISTIC_UPDATE_DESIGN_SESSION':
            const currentMessages = state.activeDesignSession ? state.activeDesignSession.messages : [];
            const newActiveSession = {
                ...(state.activeDesignSession || { designSessionId: '', name: 'New Team Design', messages: [] }),
                messages: [...currentMessages, action.payload.userMessage]
            };
            return { ...state, status: 'loading', activeDesignSession: newActiveSession as DesignSession };
        case 'UPDATE_DESIGN_SESSION_SUCCESS':
            const updatedSession = action.payload;
            const newSessions = state.designSessions.map(s => s.designSessionId === updatedSession.designSessionId ? updatedSession : s);
            const sessionExists = state.designSessions.some(s => s.designSessionId === updatedSession.designSessionId);
            if (!sessionExists) newSessions.unshift(updatedSession);
            return { ...state, status: 'idle', activeDesignSession: updatedSession, designSessions: newSessions, view: 'team_builder', activeTeam: null };
        case 'ADD_CREATION_MESSAGE':
            if (!state.activeDesignSession) return state;
            const creationMessage = { role: 'assistant', content: 'Great! I have everything I need. Creating your new team...' };
            const sessionWithCreationMessage = { ...state.activeDesignSession, messages: [...state.activeDesignSession.messages, creationMessage] };
            return { ...state, status: 'loading', activeDesignSession: sessionWithCreationMessage };
        case 'LOAD_DESIGN_SESSION':
            return { ...state, view: 'team_builder', activeDesignSession: action.payload, activeTeam: null, status: 'idle' };
        case 'FINISH_TEAM_BUILDER':
            return { ...state, status: 'idle', teams: action.payload.teams, designSessions: action.payload.designSessions, activeTeam: action.payload.newTeam, activeDesignSession: null, view: 'team_management' };
        case 'OPEN_DIALOG': 
            return { ...state, dialog: action.payload.dialog, chatToEdit: action.payload.chat || null, agentToDelete: action.payload.agent || null, designSessionToDelete: action.payload.designSession || null, teamToEdit: action.payload.team || null };
        case 'CLOSE_DIALOG': 
            return { ...state, dialog: 'none', chatToEdit: null, agentToDelete: null, designSessionToDelete: null, teamToEdit: null };
        case 'UPDATE_TEAMS_LIST': return { ...state, teams: action.payload };
        case 'UPDATE_ACTIVE_TEAM':
             const newTeams = state.teams.map(t => t.teamId === action.payload.teamId ? action.payload : t);
            return { ...state, status: 'idle', activeTeam: action.payload, teams: newTeams };
        case 'UPDATE_CHAT_HISTORY': return { ...state, chatHistory: action.payload };
        case 'UPDATE_AGENTS': return { ...state, agents: action.payload };
        case 'UPDATE_DESIGN_SESSIONS': return { ...state, designSessions: action.payload };
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
        const [chatHistory, agents] = await Promise.all([
            safeFetch(`${backendApiUrl}/teams/${teamId}/chats`),
            safeFetch(`${backendApiUrl}/teams/${teamId}/agents`)
        ]);
        if (chatHistory !== null && agents !== null) {
            dispatch({ type: 'FETCH_TEAM_DATA_SUCCESS', payload: { chatHistory, agents } });
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
        if (state.activeTeam && (state.view === 'chat' || state.view === 'team_management')) {
            fetchDependenciesForTeam(state.activeTeam.teamId);
        }
    }, [state.activeTeam, state.view, fetchDependenciesForTeam]);

    const handleSetActiveTeam = (teamOrId: Team | string) => {
        const team = typeof teamOrId === 'string' ? state.teams.find(t => t.teamId === teamOrId) : teamOrId;
        if (!team || team.teamId === state.activeTeam?.teamId) return;
        if (state.view === 'team_management') dispatch({ type: 'SET_ACTIVE_TEAM_FOR_MANAGEMENT', payload: team });
        else dispatch({ type: 'SET_ACTIVE_TEAM_FOR_CHAT', payload: team });
    };
    
    const handleModeChange = (mode: 'chat' | 'team') => dispatch({ type: 'SWITCH_MODE', payload: mode });
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
        const newMessages = [...state.messages, userMessage];
        dispatch({ type: 'CHAT_RESPONSE_SUCCESS', payload: { messages: newMessages, chatId: state.currentChatId, chatHistory: state.chatHistory } });
        dispatch({ type: 'START_LOADING' });
        setCurrentInput("");
        const body = JSON.stringify({ message: userInput, chatId: state.currentChatId });
        const data = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`, { method: 'POST', body });
        if (data) {
            const needsHistoryRefresh = !state.currentChatId;
            const chatHistory = needsHistoryRefresh ? await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`) : state.chatHistory;
            dispatch({ type: 'CHAT_RESPONSE_SUCCESS', payload: { messages: data.messages, chatId: data.chatId, chatHistory: chatHistory || state.chatHistory } });
        }
    };
    
    const handleChatAction = async (actionId: string) => {
        const lastUserMessage = [...state.messages].reverse().find(m => m.role === 'user');
        if (!lastUserMessage) return;
        const messagesWithoutAction = state.messages.filter(m => {
            try {
                const content = JSON.parse(m.content);
                return !(content.text && content.actions);
            } catch { return true; }
        });

        if (actionId === 'confirm_redirect') {
            dispatch({ type: 'START_LOADING' });
            dispatch({ type: 'CHAT_RESPONSE_SUCCESS', payload: { messages: messagesWithoutAction } });
            const redirectBody = JSON.stringify({ messages: [], initial_user_idea: lastUserMessage.content });
            const updatedSession = await safeFetch(`${backendApiUrl}/team-builder/chat`, { method: 'POST', body: redirectBody });
            if (updatedSession) dispatch({ type: 'UPDATE_DESIGN_SESSION_SUCCESS', payload: updatedSession });
        } else if (actionId === 'cancel_redirect') {
            const finalMessages = [...messagesWithoutAction, { role: 'assistant', content: "Okay, let's stay here. What else can I help you with?" }];
            dispatch({ type: 'CHAT_RESPONSE_SUCCESS', payload: { messages: finalMessages } });
        }
    };

    const handleStartTeamBuilder = () => dispatch({ type: 'START_TEAM_BUILDER' });
    const handleLoadDesignSession = (session: DesignSession) => dispatch({ type: 'LOAD_DESIGN_SESSION', payload: session });
    
    const handleUpdateMission = async (mission: string) => {
        if (!state.activeTeam || mission === state.activeTeam.mission) return;
        dispatch({ type: 'START_LOADING' });
        const body = JSON.stringify({ mission: mission });
        const response = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}`, { method: 'PUT', body });
        if (response && response.success) {
            const updatedTeam = { ...state.activeTeam, mission: mission };
            dispatch({ type: 'UPDATE_ACTIVE_TEAM', payload: updatedTeam });
        }
    };
    
    const handleSubmitTeamBuilder = async (e: React.FormEvent) => {
        e.preventDefault();
        const userInputContent = currentInput.trim();
        if (!userInputContent) return;
        const userMessage = { role: 'user', content: userInputContent };
        dispatch({ type: 'OPTIMISTIC_UPDATE_DESIGN_SESSION', payload: { userMessage } });
        setCurrentInput("");
        const messagesForApi = [...(state.activeDesignSession?.messages || []), userMessage];
        const designSessionId = state.activeDesignSession?.designSessionId;
        const body = JSON.stringify({ messages: messagesForApi, designSessionId });
        const updatedSession = await safeFetch(`${backendApiUrl}/team-builder/chat`, { method: 'POST', body });
        
        if (updatedSession) {
            const lastMessage = updatedSession.messages[updatedSession.messages.length - 1];
            const content = lastMessage?.content?.trim() || '';
            
            const match = content.match(/```json\s*([\s\S]*?)\s*```/);
            
            if (match && match[1]) {
                try {
                    const parsedJson = JSON.parse(match[1]);
                    if (parsedJson.team_name && Array.isArray(parsedJson.agents)) {
                        dispatch({ type: 'ADD_CREATION_MESSAGE', payload: { designSessionId: updatedSession.designSessionId } });
                        const createBody = JSON.stringify({ ...parsedJson, designSessionId: updatedSession.designSessionId });
                        const newTeamResponse = await safeFetch(`${backendApiUrl}/team-builder/create`, { method: 'POST', body: createBody });
                        
                        if (newTeamResponse && newTeamResponse.teamId) {
                            const [latestTeams, latestDesignSessions] = await Promise.all([
                                safeFetch(`${backendApiUrl}/teams`),
                                safeFetch(`${backendApiUrl}/team-builder/sessions`)
                            ]);
                            if (latestTeams !== null && latestDesignSessions !== null) {
                                const newTeam = latestTeams.find((t: Team) => t.teamId === newTeamResponse.teamId);
                                if (newTeam) {
                                    dispatch({ type: 'FINISH_TEAM_BUILDER', payload: { newTeam, teams: latestTeams, designSessions: latestDesignSessions } });
                                } else {
                                    dispatch({ type: 'SET_ERROR', payload: `Could not find newly created team in the list.`});
                                }
                            }
                        } else {
                            dispatch({ type: 'UPDATE_DESIGN_SESSION_SUCCESS', payload: updatedSession });
                            dispatch({ type: 'SET_ERROR', payload: `Failed to create team: ${newTeamResponse?.error || 'Unknown error'}`});
                        }
                    } else {
                         dispatch({ type: 'UPDATE_DESIGN_SESSION_SUCCESS', payload: updatedSession });
                    }
                } catch (e) {
                    dispatch({ type: 'UPDATE_DESIGN_SESSION_SUCCESS', payload: updatedSession });
                }
            } else {
                dispatch({ type: 'UPDATE_DESIGN_SESSION_SUCCESS', payload: updatedSession });
            }
        }
    };
    
    const handleDialogOpen = (dialog: AppState['dialog'], options?: { chat?: ChatHistoryItem, agent?: Agent, designSession?: DesignSession, team?: Team }) => {
        if (options?.chat) setDialogInput(options.chat.title);
        if (options?.team) setDialogInput(options.team.name);
        dispatch({ type: 'OPEN_DIALOG', payload: { dialog, ...options } });
    };
    
    const handleDialogClose = () => {
        dispatch({ type: 'CLOSE_DIALOG' });
        setDialogInput("");
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
        if (agent && !agent.agentId) setAgentToEdit({ ...agent, system_prompt: '' });
        else setAgentToEdit(agent);
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
    
    const handleDeleteAgent = (agent: Agent) => dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'delete_agent', agent } });
    
    const handleConfirmDeleteAgent = async () => {
        if (!state.activeTeam || !state.agentToDelete) return;
        const { agentId } = state.agentToDelete;
        const data = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/agents/${agentId}`, { method: 'DELETE' });
        if (data && data.success) {
             const updatedAgents = state.agents.filter(a => a.agentId !== agentId);
             dispatch({ type: 'UPDATE_AGENTS', payload: updatedAgents });
             handleEditAgentClick(null);
             handleDialogClose();
        }
    };

    const handleDeleteDesignSession = (session: DesignSession) => dispatch({ type: 'OPEN_DIALOG', payload: { dialog: 'delete_design_session', designSession: session } });

    const handleConfirmDeleteDesignSession = async () => {
        if (!state.designSessionToDelete) return;
        const { designSessionId } = state.designSessionToDelete;
        const data = await safeFetch(`${backendApiUrl}/team-builder/sessions/${designSessionId}`, { method: 'DELETE' });
        if (data && data.success) {
            const updatedSessions = state.designSessions.filter((s: DesignSession) => s.designSessionId !== designSessionId);
            dispatch({ type: 'UPDATE_DESIGN_SESSIONS', payload: updatedSessions });
            if (state.activeDesignSession?.designSessionId === designSessionId) dispatch({ type: 'SWITCH_MODE', payload: 'team' });
            handleDialogClose();
        }
    };
    
    const handleRenameTeam = async () => {
        if (!dialogInput || !state.teamToEdit) return;
        const { teamId } = state.teamToEdit;
        // NOTE: This endpoint needs to be created in the backend.
        // For now, we'll do an optimistic update.
        // const data = await safeFetch(`${backendApiUrl}/teams/${teamId}/rename`, { method: 'POST', body: JSON.stringify({ new_name: dialogInput }) });
        // if (data && data.success) {
            const newTeams = state.teams.map(t => t.teamId === teamId ? { ...t, name: dialogInput } : t);
            dispatch({ type: 'UPDATE_TEAMS_LIST', payload: newTeams });
            if (state.activeTeam?.teamId === teamId) {
                dispatch({ type: 'SET_ACTIVE_TEAM_FOR_MANAGEMENT', payload: { ...state.activeTeam, name: dialogInput } });
            }
            handleDialogClose();
        // }
    };
    
    const handleConfirmDeleteTeam = async () => {
        if (!state.teamToEdit) return;
        const { teamId } = state.teamToEdit;
        const data = await safeFetch(`${backendApiUrl}/teams/${teamId}`, { method: 'DELETE' });
        if (data && data.success) {
            const newTeams = state.teams.filter(t => t.teamId !== teamId);
            dispatch({ type: 'UPDATE_TEAMS_LIST', payload: newTeams });
            if (state.activeTeam?.teamId === teamId) {
                // --- THIS IS THE FIX for the delete error ---
                // We now correctly pass the first team from the remaining list, or null.
                dispatch({ type: 'SET_ACTIVE_TEAM_FOR_MANAGEMENT', payload: newTeams[0] || null });
            }
            handleDialogClose();
        }
    };

    const renderMainContent = () => {
        if (state.status === 'error') return <div className="p-8 text-red-500">Error: {state.error}</div>;
        if (state.status === 'loading' && !state.activeTeam && !state.activeDesignSession) return <div className="p-8">Loading...</div>;

        switch (state.view) {
            case 'welcome': return <WelcomeScreen />;
            case 'chat':
                if (!state.activeTeam) return <WelcomeScreen />;
                return <ChatView messages={state.messages} currentInput={currentInput} setCurrentInput={setCurrentInput} isLoading={state.status === 'loading'} handleSubmit={handleSubmitChat} onAction={handleChatAction} />;
            case 'team_management':
                if (!state.activeTeam) return <TeamWelcomeScreen />;
                return <TeamManagementView 
                    team={state.activeTeam} 
                    agents={state.agents} 
                    isLoading={state.status === 'loading'} 
                    onCreateAgent={() => handleEditAgentClick({ agentId: '', name: '', system_prompt: '' })} 
                    onEditAgent={handleEditAgentClick}
                    onUpdateMission={handleUpdateMission}
                    onRenameTeam={() => {
                        if (state.activeTeam) {
                            handleDialogOpen('rename_team', { team: state.activeTeam })
                        }
                    }}
                    onDeleteTeam={() => {
                        if (state.activeTeam) {
                            handleDialogOpen('delete_team', { team: state.activeTeam })
                        }
                    }}
                />;
            case 'team_builder':
                const builderMessages = state.activeDesignSession ? state.activeDesignSession.messages : [];
                return <ChatView messages={builderMessages} currentInput={currentInput} setCurrentInput={setCurrentInput} isLoading={state.status === 'loading'} handleSubmit={handleSubmitTeamBuilder} onAction={() => {}} />;
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
                activeDesignSession={state.activeDesignSession}
                chatHistory={state.chatHistory}
                currentChatId={state.currentChatId}
                onSetActiveTeam={handleSetActiveTeam}
                onNewChat={handleNewChat}
                onLoadChat={handleLoadChat}
                onCreateTeamWithAIClick={handleStartTeamBuilder}
                onLoadDesignSession={handleLoadDesignSession}
                onDeleteDesignSession={handleDeleteDesignSession}
                onRenameChat={(chat) => handleDialogOpen('rename_chat', { chat })}
                onDeleteChat={(chat) => handleDialogOpen('delete_chat', { chat })}
                onUpdateMission={handleUpdateMission}
            >
                {renderMainContent()}
            </AppLayout>

            <Dialog open={state.dialog === 'rename_chat'} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Rename Chat</DialogTitle></DialogHeader>
                    <Input value={dialogInput} onChange={(e) => setDialogInput(e.target.value)} placeholder="Enter new title..." />
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button onClick={handleRenameChat}>Rename</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={state.dialog === 'delete_chat'} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Chat</DialogTitle></DialogHeader>
                    <p>Are you sure you want to delete "{state.chatToEdit?.title}"?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteChat}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={state.dialog === 'delete_agent'} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Agent</DialogTitle></DialogHeader>
                    <p>Are you sure you want to permanently delete the agent "{state.agentToDelete?.name}"?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmDeleteAgent}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={state.dialog === 'delete_design_session'} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Design Session</DialogTitle></DialogHeader>
                    <p>Are you sure you want to permanently delete the design session "{state.designSessionToDelete?.name}"?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmDeleteDesignSession}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
             <Dialog open={state.dialog === 'rename_team'} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Rename Team</DialogTitle></DialogHeader>
                    <Input value={dialogInput} onChange={(e) => setDialogInput(e.target.value)} placeholder="Enter new team name..." />
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button onClick={handleRenameTeam}>Rename</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={state.dialog === 'delete_team'} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Team</DialogTitle></DialogHeader>
                    <DialogDescription>
                        Are you sure you want to permanently delete the team "{state.teamToEdit?.name}"? This action cannot be undone.
                    </DialogDescription>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmDeleteTeam}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <AgentEditDialog isOpen={!!agentToEdit} onOpenChange={(isOpen) => { if (!isOpen) handleEditAgentClick(null); }} agentToEdit={agentToEdit} onSave={handleSaveAgent} onDelete={handleDeleteAgent} />
        </>
    );
}