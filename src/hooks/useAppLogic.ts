// src/hooks/useAppLogic.ts
// v61.1 - Mission Success: Definitive fix for the mission workflow race condition.

"use client";

import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import type { Team, ChatHistoryItem, Agent, DesignSession } from "@/components/AppLayout";
import { parseAssistantResponse } from "@/lib/utils";

// --- Section 1: State and Action Type Definitions ---

export interface AppState {
    view: 'welcome' | 'chat' | 'team_management' | 'team_builder';
    teams: Team[];
    designSessions: DesignSession[];
    chatHistory: ChatHistoryItem[];
    agents: Agent[];
    activeTeam: Team | null;
    activeDesignSession: DesignSession | null;
    currentChatId: string | null;
    messages: any[];
    holdingMessage: string | null; 
    dialog: 'none' | 'rename_chat' | 'delete_chat' | 'delete_agent' | 'delete_design_session' | 'rename_team' | 'delete_team';
    chatToEdit: ChatHistoryItem | null;
    agentToDelete: Agent | null;
    designSessionToDelete: DesignSession | null;
    teamToEdit: Team | null;
    status: 'idle' | 'loading' | 'error' | 'polling';
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
    holdingMessage: null, 
    dialog: 'none',
    chatToEdit: null,
    agentToDelete: null,
    designSessionToDelete: null,
    teamToEdit: null,
    status: 'idle',
    error: null,
};

type AppAction =
    | { type: 'SET_STATUS'; payload: AppState['status'] }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'INITIAL_LOAD_SUCCESS'; payload: { teams: Team[], designSessions: DesignSession[] } }
    | { type: 'SET_ACTIVE_TEAM_FOR_CHAT'; payload: Team }
    | { type: 'SET_ACTIVE_TEAM_FOR_MANAGEMENT'; payload: Team | null }
    | { type: 'FETCH_TEAM_DATA_SUCCESS'; payload: { chatHistory: ChatHistoryItem[]; agents: Agent[] } }
    | { type: 'SWITCH_MODE'; payload: 'chat' | 'team' }
    | { type: 'START_NEW_CHAT'; }
    | { type: 'LOAD_CHAT_SUCCESS'; payload: { chatId: string; messages: any[] } }
    | { type: 'SET_CHAT_STATE'; payload: { messages: any[]; chatId: string | null; chatHistory?: ChatHistoryItem[] } }
    | { type: 'START_TASK'; payload: { holdingMessage: string; chatId: string } }
    | { type: 'TASK_COMPLETE'; payload: { messages: any[]; } }
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

// --- Section 2: The Reducer Function ---

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_STATUS': return { ...state, status: action.payload, error: null };
        case 'SET_ERROR': return { ...state, status: 'error', error: action.payload, holdingMessage: null };
        case 'INITIAL_LOAD_SUCCESS':
            return { ...state, teams: action.payload.teams, designSessions: action.payload.designSessions, activeTeam: state.view !== 'team_management' ? action.payload.teams[0] || null : null, status: 'idle' };
        case 'SET_ACTIVE_TEAM_FOR_CHAT':
            return { ...state, view: 'chat', activeTeam: action.payload, activeDesignSession: null, currentChatId: null, messages: [], chatHistory: [], agents: [], status: 'loading', holdingMessage: null };
        case 'SET_ACTIVE_TEAM_FOR_MANAGEMENT':
            return { ...state, view: 'team_management', activeTeam: action.payload, activeDesignSession: null, agents: [], status: 'loading', holdingMessage: null };
        case 'FETCH_TEAM_DATA_SUCCESS':
            return { ...state, status: 'idle', chatHistory: action.payload.chatHistory, agents: action.payload.agents };
        case 'SWITCH_MODE':
            const newView = action.payload === 'team' ? 'team_management' : 'chat';
            return { ...state, view: newView, activeTeam: state.activeTeam || state.teams[0] || null, activeDesignSession: null };
        case 'START_NEW_CHAT':
            if (!state.activeTeam) return { ...state, currentChatId: null, messages: [], view: 'chat', holdingMessage: null };
            const welcomeMessage = {
                role: 'assistant',
                content: `Hello! I'm the Project Manager for the **${state.activeTeam.name}** team. I'm ready to help you. What would you like to accomplish?`,
                isWelcome: true, 
            };
            return { ...state, currentChatId: null, messages: [welcomeMessage], view: 'chat', holdingMessage: null, status: 'idle' };
        case 'LOAD_CHAT_SUCCESS': 
            return { ...state, status: 'idle', currentChatId: action.payload.chatId, messages: action.payload.messages, view: 'chat', holdingMessage: null };
        case 'SET_CHAT_STATE':
             return { ...state, status: 'idle', messages: action.payload.messages, currentChatId: action.payload.chatId, chatHistory: action.payload.chatHistory || state.chatHistory, holdingMessage: null };
        case 'START_TASK':
             return { ...state, status: 'polling', holdingMessage: action.payload.holdingMessage, currentChatId: action.payload.chatId };
        case 'TASK_COMPLETE':
            return { ...state, status: 'idle', holdingMessage: null, messages: action.payload.messages };
        case 'START_TEAM_BUILDER':
            return { ...state, view: 'team_builder', activeDesignSession: null, activeTeam: null, status: 'idle', holdingMessage: null };
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

// --- Section 3: The Custom Hook ---

export const useAppLogic = () => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

    const safeFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        try {
            const response = await fetch(url, { ...options, headers: { ...options.headers, 'Content-Type': 'application/json' }});
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Request failed: ${response.status} ${errorBody}`);
            }
            if (response.status === 204 || response.headers.get("content-length") === "0" || response.status === 202) {
                return { success: true };
            }
            return await response.json();
        } catch (error: any) {
            console.error("Fetch error:", error);
            dispatch({ type: 'SET_ERROR', payload: error.message || 'A network error occurred.' });
            return null;
        }
    }, []);
    
    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    const pollChat = useCallback(async (chatId: string) => {
        const data = await safeFetch(`${backendApiUrl}/chats/${chatId}`);
        if (data && data.messages) {
            const lastMessageContent = data.messages[data.messages.length - 1]?.content || "";
            const parsed = parseAssistantResponse(lastMessageContent);
            if (parsed.action !== 'execute_task') {
                dispatch({ type: 'TASK_COMPLETE', payload: { messages: data.messages } });
                const newHistory = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam?.teamId}/chats`);
                if (newHistory) dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: newHistory });
                stopPolling();
            }
        }
    }, [safeFetch, stopPolling, state.activeTeam?.teamId]);

    useEffect(() => {
        if (state.status === 'polling' && state.currentChatId) {
            pollingIntervalRef.current = setInterval(() => pollChat(state.currentChatId!), 3000);
        }
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, [state.status, state.currentChatId, pollChat]);

    const fetchDependenciesForTeam = useCallback(async (teamId: string) => {
        if (!teamId) return;
        dispatch({ type: 'SET_STATUS', payload: 'loading' });
        const [chatHistory, agents] = await Promise.all([
            safeFetch(`${backendApiUrl}/teams/${teamId}/chats`),
            safeFetch(`${backendApiUrl}/teams/${teamId}/agents`)
        ]);
        if (chatHistory !== null && agents !== null) {
            dispatch({ type: 'FETCH_TEAM_DATA_SUCCESS', payload: { chatHistory, agents } });
        }
    }, [safeFetch]);
    
    const loadInitialData = useCallback(async () => {
        dispatch({ type: 'SET_STATUS', payload: 'loading' });
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
            stopPolling();
            fetchDependenciesForTeam(state.activeTeam.teamId);
        }
    }, [state.activeTeam, state.view, fetchDependenciesForTeam, stopPolling]);

    const handleSetActiveTeam = (teamOrId: Team | string) => {
        const team = typeof teamOrId === 'string' ? state.teams.find(t => t.teamId === teamOrId) : teamOrId;
        if (!team || team.teamId === state.activeTeam?.teamId) return;
        if (state.view === 'team_management') dispatch({ type: 'SET_ACTIVE_TEAM_FOR_MANAGEMENT', payload: team });
        else dispatch({ type: 'SET_ACTIVE_TEAM_FOR_CHAT', payload: team });
    };
    
    const handleModeChange = (mode: 'chat' | 'team') => dispatch({ type: 'SWITCH_MODE', payload: mode });
    const handleNewChat = () => {
        stopPolling();
        dispatch({ type: 'START_NEW_CHAT' });
    }
    
    const handleLoadChat = useCallback(async (chatId: string) => {
        stopPolling();
        dispatch({ type: 'SET_STATUS', payload: 'loading' });
        const data = await safeFetch(`${backendApiUrl}/chats/${chatId}`);
        if (data && data.messages) dispatch({ type: 'LOAD_CHAT_SUCCESS', payload: { chatId, messages: data.messages } });
    }, [safeFetch, stopPolling]);
    
    const handleSendMessage = async (userInput: string, isMission: boolean) => {
        if (!userInput || !state.activeTeam) return;

        const userMessage = { role: 'user', content: userInput };
        const isNewChat = !state.currentChatId;
        const welcomeMessage = isNewChat ? state.messages.find(m => m.isWelcome) : null;
        const optimisticMessages = [...state.messages, userMessage];

        dispatch({ type: 'SET_CHAT_STATE', payload: { messages: optimisticMessages, chatId: state.currentChatId } });
        
        let chatId = state.currentChatId;

        if (isNewChat) {
            const newChatData = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`, { 
                method: 'POST', body: JSON.stringify({ message: userInput, isNewChat: true }) 
            });
            if (newChatData && newChatData.chatId) {
                chatId = newChatData.chatId;
                const newHistory = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`);
                dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: newHistory || [] });
            } else {
                dispatch({ type: 'SET_ERROR', payload: "Failed to create a new chat."});
                return;
            }
        }
        
        if (!chatId) {
            dispatch({ type: 'SET_ERROR', payload: "Could not obtain a valid Chat ID." });
            return;
        }

        if (isMission) {
            safeFetch(`${backendApiUrl}/chats/${chatId}/run-mission`, { 
                method: 'POST', body: JSON.stringify({ message: userInput, chatId: chatId }) 
            });
            dispatch({ type: 'START_TASK', payload: { holdingMessage: "Okay, I'll get the team started on that right away...", chatId }});
        } else {
            dispatch({ type: 'SET_STATUS', payload: 'loading' });
            const response = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`, { 
                method: 'POST', body: JSON.stringify({ message: userInput, chatId: chatId }) 
            });
            if (response && response.messages) {
                const finalMessages = welcomeMessage ? [welcomeMessage, ...response.messages] : response.messages;
                dispatch({ type: 'SET_CHAT_STATE', payload: { messages: finalMessages, chatId: response.chatId || chatId }});
            }
        }
    };
    
    const handleSubmitTeamBuilder = async (userInput: string) => {
        if (!userInput) return;
        const userMessage = { role: 'user', content: userInput };
        dispatch({ type: 'OPTIMISTIC_UPDATE_DESIGN_SESSION', payload: { userMessage } });
        const messagesForApi = [...(state.activeDesignSession?.messages || []), userMessage];
        const designSessionId = state.activeDesignSession?.designSessionId;
        const body = JSON.stringify({ messages: messagesForApi, designSessionId });
        const updatedSession = await safeFetch(`${backendApiUrl}/team-builder/chat`, { method: 'POST', body });
        
        if (updatedSession) {
            const lastMessageContent = updatedSession.messages[updatedSession.messages.length - 1]?.content || '';
            const jsonMatch = lastMessageContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                 try {
                    const parsedJson = JSON.parse(jsonMatch[1]);
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
    
    const handleChatAction = async (actionId: string) => {
        const lastUserMessage = [...state.messages].reverse().find(m => m.role === 'user');
        if (!lastUserMessage) return;
        const messagesWithoutAction = state.messages.filter(m => !parseAssistantResponse(m.content).actions);

        if (actionId === 'confirm_redirect') {
            dispatch({ type: 'SET_STATUS', payload: 'loading' });
            dispatch({ type: 'SET_CHAT_STATE', payload: { messages: messagesWithoutAction, chatId: state.currentChatId } });
            const redirectBody = JSON.stringify({ messages: [], initial_user_idea: lastUserMessage.content });
            const updatedSession = await safeFetch(`${backendApiUrl}/team-builder/chat`, { method: 'POST', body: redirectBody });
            if (updatedSession) dispatch({ type: 'UPDATE_DESIGN_SESSION_SUCCESS', payload: updatedSession });
        } else if (actionId === 'cancel_redirect') {
            const finalMessages = [...messagesWithoutAction, { role: 'assistant', content: "Okay, let's stay here. What else can I help you with?" }];
            dispatch({ type: 'SET_CHAT_STATE', payload: { messages: finalMessages, chatId: state.currentChatId } });
        }
    };

    const handleStartTeamBuilder = () => dispatch({ type: 'START_TEAM_BUILDER' });
    const handleLoadDesignSession = (session: DesignSession) => dispatch({ type: 'LOAD_DESIGN_SESSION', payload: session });
    
    const handleUpdateMission = async (mission: string) => {
        if (!state.activeTeam || mission === state.activeTeam.mission) return;
        dispatch({ type: 'SET_STATUS', payload: 'loading' });
        const body = JSON.stringify({ mission: mission });
        const response = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}`, { method: 'PUT', body });
        if (response && response.success) {
            const updatedTeam = { ...state.activeTeam, mission: mission };
            dispatch({ type: 'UPDATE_ACTIVE_TEAM', payload: updatedTeam });
        }
    };
    
    const handleDialogOpen = (dialog: AppState['dialog'], options?: { chat?: ChatHistoryItem, agent?: Agent, designSession?: DesignSession, team?: Team }) => {
        dispatch({ type: 'OPEN_DIALOG', payload: { dialog, ...options } });
    };
    
    const handleDialogClose = () => dispatch({ type: 'CLOSE_DIALOG' });
    
    const handleRenameChat = async (newTitle: string) => {
        if (!newTitle || !state.chatToEdit) return;
        const { chatId } = state.chatToEdit;
        const data = await safeFetch(`${backendApiUrl}/chats/${chatId}/rename`, { method: 'POST', body: JSON.stringify({ new_title: newTitle }) });
        if (data && data.success) {
            const newHistory = state.chatHistory.map(c => c.chatId === chatId ? { ...c, title: newTitle } : c);
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
            if (state.currentChatId === chatId) handleNewChat();
            handleDialogClose();
        }
    };
    
    const handleSaveAgent = async (agentData: { name: string, system_prompt: string }, agentId?: string) => {
        if (!state.activeTeam) return;
        dispatch({ type: 'SET_STATUS', payload: 'loading' });
        const isCreating = !agentId;
        const url = isCreating ? `${backendApiUrl}/teams/${state.activeTeam.teamId}/agents` : `${backendApiUrl}/teams/${state.activeTeam.teamId}/agents/${agentId}`;
        const method = isCreating ? 'POST' : 'PUT';
        const data = await safeFetch(url, { method, body: JSON.stringify(agentData) });
        if (data && data.success) {
            const updatedAgents = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/agents`);
            if (updatedAgents) dispatch({ type: 'UPDATE_AGENTS', payload: updatedAgents });
        }
         dispatch({ type: 'SET_STATUS', payload: 'idle' });
    };
    
    const handleConfirmDeleteAgent = async () => {
        if (!state.activeTeam || !state.agentToDelete) return;
        const { agentId } = state.agentToDelete;
        const data = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/agents/${agentId}`, { method: 'DELETE' });
        if (data && data.success) {
             const updatedAgents = state.agents.filter(a => a.agentId !== agentId);
             dispatch({ type: 'UPDATE_AGENTS', payload: updatedAgents });
             handleDialogClose();
        }
    };

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
    
    const handleRenameTeam = async (newName: string) => {
        if (!newName || !state.teamToEdit) return;
        const { teamId } = state.teamToEdit;
        // NOTE: Backend endpoint for rename is not implemented, this is an optimistic update.
        const newTeams = state.teams.map(t => t.teamId === teamId ? { ...t, name: newName } : t);
        dispatch({ type: 'UPDATE_TEAMS_LIST', payload: newTeams });
        if (state.activeTeam?.teamId === teamId) {
            dispatch({ type: 'SET_ACTIVE_TEAM_FOR_MANAGEMENT', payload: { ...state.activeTeam, name: newName } });
        }
        handleDialogClose();
    };
    
    const handleConfirmDeleteTeam = async () => {
        if (!state.teamToEdit) return;
        const { teamId } = state.teamToEdit;
        const data = await safeFetch(`${backendApiUrl}/teams/${teamId}`, { method: 'DELETE' });
        if (data && data.success) {
            const newTeams = state.teams.filter(t => t.teamId !== teamId);
            dispatch({ type: 'UPDATE_TEAMS_LIST', payload: newTeams });
            if (state.activeTeam?.teamId === teamId) {
                dispatch({ type: 'SET_ACTIVE_TEAM_FOR_MANAGEMENT', payload: newTeams[0] || null });
            }
            handleDialogClose();
        }
    };

    return {
        state,
        handleSendMessage,
        handleSubmitTeamBuilder,
        handleSetActiveTeam,
        handleModeChange,
        handleNewChat,
        handleLoadChat,
        handleStartTeamBuilder,
        handleLoadDesignSession,
        handleUpdateMission,
        handleChatAction,
        // Dialog handlers
        handleDialogOpen,
        handleDialogClose,
        handleRenameChat,
        handleDeleteChat,
        handleSaveAgent,
        handleConfirmDeleteAgent,
        handleConfirmDeleteDesignSession,
        handleRenameTeam,
        handleConfirmDeleteTeam,
    };
};