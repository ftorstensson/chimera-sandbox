// src/hooks/useAppLogic.ts
// v64.2 - FIX: Refactors polling logic to resolve stalled tasks.

"use client";

import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import type { Team, ChatHistoryItem, Agent, DesignSession } from "@/components/AppLayout";
import { parseAssistantResponse } from "@/lib/utils";

// --- Section 1: State and Action Type Definitions (no changes) ---

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
    | { type: 'START_TASK'; payload: { chatId: string, messages: any[] } }
    | { type: 'TASK_COMPLETE'; payload: { messages: any[]; chatId: string } }
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


// --- Section 2: The Reducer Function (minor change to TASK_COMPLETE) ---

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
            };
            return { ...state, currentChatId: null, messages: [welcomeMessage], view: 'chat', holdingMessage: null, status: 'idle' };
        case 'LOAD_CHAT_SUCCESS':
            const lastMessage = action.payload.messages[action.payload.messages.length - 1];
            const parsed = parseAssistantResponse(lastMessage?.content);
            if (parsed.action === 'execute_task') {
                return { ...state, status: 'polling', currentChatId: action.payload.chatId, messages: action.payload.messages, view: 'chat' };
            }
            return { ...state, status: 'idle', currentChatId: action.payload.chatId, messages: action.payload.messages, view: 'chat', holdingMessage: null };
        case 'SET_CHAT_STATE':
             return { ...state, messages: action.payload.messages, currentChatId: action.payload.chatId, chatHistory: action.payload.chatHistory || state.chatHistory };
        case 'START_TASK':
             return { ...state, status: 'polling', messages: action.payload.messages, currentChatId: action.payload.chatId };
        // UPDATED: Now only sets status to idle. Message update is handled by pollChat.
        case 'TASK_COMPLETE':
            // Only update the state if the completed task belongs to the currently active chat.
            if (state.currentChatId === action.payload.chatId) {
                return { ...state, status: 'idle', holdingMessage: null, messages: action.payload.messages };
            }
            return state; // Ignore if it's for an old chat
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


// --- Section 3: The Custom Hook (REFACTORED POLLING LOGIC) ---

export const useAppLogic = () => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

    const safeFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        try {
            const response = await fetch(url, { ...options, headers: { ...options.headers, 'Content-Type': 'application/json' }});
            if (!response.ok && response.status !== 202) {
                const errorBody = await response.text();
                throw new Error(`Request failed: ${response.status} ${errorBody}`);
            }
            const body = response.status === 204 ? null : await response.json();
            return { success: true, status: response.status, body: body };
        } catch (error: any) {
            console.error("Fetch error:", error);
            dispatch({ type: 'SET_ERROR', payload: error.message || 'A network error occurred.' });
            return null;
        }
    }, []);
    
    // UPDATED: Simplified stopPolling function.
    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    // UPDATED: The entire polling useEffect hook is refactored for stability.
    useEffect(() => {
        // This function is defined inside the effect to capture the current state.
        const pollChat = async () => {
            if (!state.currentChatId || !state.activeTeam) return;

            const result = await safeFetch(`${backendApiUrl}/chats/${state.currentChatId}`);
            
            if (result?.body?.messages) {
                const lastMessageContent = result.body.messages[result.body.messages.length - 1]?.content || "";
                const parsed = parseAssistantResponse(lastMessageContent);

                // This is the stop condition.
                if (parsed.action !== 'execute_task') {
                    stopPolling();
                    dispatch({ type: 'TASK_COMPLETE', payload: { messages: result.body.messages, chatId: state.currentChatId } });
                    
                    // Refresh the chat history in the sidebar after the task is fully complete.
                    const newHistoryResult = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`);
                    if (newHistoryResult?.body) {
                        dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: newHistoryResult.body });
                    }
                }
            }
        };

        if (state.status === 'polling') {
            stopPolling(); // Ensure no multiple intervals are running.
            pollingIntervalRef.current = setInterval(pollChat, 3000);
        } else {
            stopPolling(); // Clean up if status changes for any other reason.
        }

        // Cleanup function to stop polling when the component unmounts or dependencies change.
        return () => stopPolling();
        
    }, [state.status, state.currentChatId, state.activeTeam, safeFetch, stopPolling]);


    const fetchDependenciesForTeam = useCallback(async (teamId: string) => {
        if (!teamId) return;
        dispatch({ type: 'SET_STATUS', payload: 'loading' });
        const [chatHistoryResult, agentsResult] = await Promise.all([
            safeFetch(`${backendApiUrl}/teams/${teamId}/chats`),
            safeFetch(`${backendApiUrl}/teams/${teamId}/agents`)
        ]);
        if (chatHistoryResult?.body && agentsResult?.body) {
            dispatch({ type: 'FETCH_TEAM_DATA_SUCCESS', payload: { chatHistory: chatHistoryResult.body, agents: agentsResult.body } });
        }
    }, [safeFetch]);
    
    const loadInitialData = useCallback(async () => {
        dispatch({ type: 'SET_STATUS', payload: 'loading' });
        const [teamsResult, designSessionsResult] = await Promise.all([
            safeFetch(`${backendApiUrl}/teams`),
            safeFetch(`${backendApiUrl}/team-builder/sessions`)
        ]);
        if (teamsResult?.body && designSessionsResult?.body) {
            dispatch({ type: 'INITIAL_LOAD_SUCCESS', payload: { teams: teamsResult.body, designSessions: designSessionsResult.body } });
        }
    }, [safeFetch]);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);
    
    useEffect(() => { 
        if (state.activeTeam && (state.view === 'chat' || state.view === 'team_management')) {
            // We don't stop polling here anymore, the main polling effect handles it.
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
    
    const handleNewChat = () => {
        stopPolling();
        dispatch({ type: 'START_NEW_CHAT' });
    }
    
    const handleLoadChat = useCallback(async (chatId: string) => {
        stopPolling();
        dispatch({ type: 'SET_STATUS', payload: 'loading' });
        const result = await safeFetch(`${backendApiUrl}/chats/${chatId}`);
        if (result?.body?.messages) {
            dispatch({ type: 'LOAD_CHAT_SUCCESS', payload: { chatId, messages: result.body.messages } });
        }
    }, [safeFetch, stopPolling]);
    
    const handleSendMessage = async (userInput: string) => {
        if (!userInput || !state.activeTeam) return;

        const isNewChat = !state.currentChatId;
        const optimisticMessages = [...state.messages, { role: 'user', content: userInput }];
        dispatch({ type: 'SET_CHAT_STATE', payload: { messages: optimisticMessages, chatId: state.currentChatId } });
        
        dispatch({ type: 'SET_STATUS', payload: 'loading' });

        const response = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`, { 
            method: 'POST', 
            body: JSON.stringify({ 
                message: userInput, 
                chatId: state.currentChatId,
                isNewChat: isNewChat 
            }) 
        });

        if (!response) {
            dispatch({ type: 'SET_STATUS', payload: 'idle' });
            return;
        }
        
        // This logic remains sound. The backend returns 202 to signal polling.
        if (response.status === 202) {
            const chatId = response.body?.chatId;
            const chatResult = await safeFetch(`${backendApiUrl}/chats/${chatId}`);
            if (chatId && chatResult?.body?.messages) {
                dispatch({ type: 'START_TASK', payload: { chatId: chatId, messages: chatResult.body.messages }});
                if (isNewChat) {
                    const newHistoryResult = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`);
                    if (newHistoryResult?.body) dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: newHistoryResult.body });
                }
            } else {
                dispatch({ type: 'SET_ERROR', payload: "Failed to get chat state after starting task." });
            }
        } else if (response.status === 200 && response.body?.messages) {
             dispatch({ type: 'SET_CHAT_STATE', payload: { messages: response.body.messages, chatId: response.body.chatId }});
             dispatch({ type: 'SET_STATUS', payload: 'idle' });
            
            if (isNewChat) {
                const newHistoryResult = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`);
                if (newHistoryResult?.body) dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: newHistoryResult.body });
            }
        } else {
            dispatch({ type: 'SET_STATUS', payload: 'idle' });
        }
    };
    
    // ... (The rest of the file remains the same)
    const handleSubmitTeamBuilder = async (userInput: string) => {
        if (!userInput) return;
        const userMessage = { role: 'user', content: userInput };
        dispatch({ type: 'OPTIMISTIC_UPDATE_DESIGN_SESSION', payload: { userMessage } });
        const messagesForApi = [...(state.activeDesignSession?.messages || []), userMessage];
        const designSessionId = state.activeDesignSession?.designSessionId;
        const body = JSON.stringify({ messages: messagesForApi, designSessionId });
        const result = await safeFetch(`${backendApiUrl}/team-builder/chat`, { method: 'POST', body });
        
        if (result && result.body) {
            const updatedSession = result.body;
            const lastMessageContent = updatedSession.messages[updatedSession.messages.length - 1]?.content || '';
            const jsonMatch = lastMessageContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                 try {
                    const parsedJson = JSON.parse(jsonMatch[1]);
                    if (parsedJson.team_name && Array.isArray(parsedJson.agents)) {
                        dispatch({ type: 'ADD_CREATION_MESSAGE', payload: { designSessionId: updatedSession.designSessionId } });
                        const createBody = JSON.stringify({ ...parsedJson, designSessionId: updatedSession.designSessionId });
                        const newTeamResponse = await safeFetch(`${backendApiUrl}/team-builder/create`, { method: 'POST', body: createBody });
                        
                        if (newTeamResponse && newTeamResponse.body.teamId) {
                            const [latestTeams, latestDesignSessions] = await Promise.all([
                                safeFetch(`${backendApiUrl}/teams`),
                                safeFetch(`${backendApiUrl}/team-builder/sessions`)
                            ]);
                            if (latestTeams?.body && latestDesignSessions?.body) {
                                const newTeam = latestTeams.body.find((t: Team) => t.teamId === newTeamResponse.body.teamId);
                                if (newTeam) {
                                    dispatch({ type: 'FINISH_TEAM_BUILDER', payload: { newTeam, teams: latestTeams.body, designSessions: latestDesignSessions.body } });
                                }
                            }
                        } else {
                            dispatch({ type: 'SET_ERROR', payload: `Failed to create team: ${newTeamResponse?.body?.error || 'Unknown error'}`});
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
            const result = await safeFetch(`${backendApiUrl}/team-builder/chat`, { method: 'POST', body: redirectBody });
            if (result && result.body) dispatch({ type: 'UPDATE_DESIGN_SESSION_SUCCESS', payload: result.body });
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
        const result = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}`, { method: 'PUT', body });
        if (result && result.success) {
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
        const result = await safeFetch(`${backendApiUrl}/chats/${chatId}/rename`, { method: 'POST', body: JSON.stringify({ new_title: newTitle }) });
        if (result && result.success) {
            const newHistory = state.chatHistory.map(c => c.chatId === chatId ? { ...c, title: newTitle } : c);
            dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: newHistory });
            handleDialogClose();
        }
    };
    const handleDeleteChat = async () => {
        if (!state.chatToEdit || !state.activeTeam) return;
        const { chatId } = state.chatToEdit;
        const result = await safeFetch(`${backendApiUrl}/chats/${chatId}`, { method: 'DELETE' });
        if (result && result.success) {
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
        const result = await safeFetch(url, { method, body: JSON.stringify(agentData) });
        if (result && result.success) {
            const updatedAgentsResult = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/agents`);
            if (updatedAgentsResult && updatedAgentsResult.body) dispatch({ type: 'UPDATE_AGENTS', payload: updatedAgentsResult.body });
        }
         dispatch({ type: 'SET_STATUS', payload: 'idle' });
    };
    const handleConfirmDeleteAgent = async () => {
        if (!state.activeTeam || !state.agentToDelete) return;
        const { agentId } = state.agentToDelete;
        const result = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/agents/${agentId}`, { method: 'DELETE' });
        if (result && result.success) {
             const updatedAgents = state.agents.filter(a => a.agentId !== agentId);
             dispatch({ type: 'UPDATE_AGENTS', payload: updatedAgents });
             handleDialogClose();
        }
    };
    const handleConfirmDeleteDesignSession = async () => {
        if (!state.designSessionToDelete) return;
        const { designSessionId } = state.designSessionToDelete;
        const result = await safeFetch(`${backendApiUrl}/team-builder/sessions/${designSessionId}`, { method: 'DELETE' });
        if (result && result.success) {
            const updatedSessions = state.designSessions.filter((s: DesignSession) => s.designSessionId !== designSessionId);
            dispatch({ type: 'UPDATE_DESIGN_SESSIONS', payload: updatedSessions });
            if (state.activeDesignSession?.designSessionId === designSessionId) dispatch({ type: 'SWITCH_MODE', payload: 'team' });
            handleDialogClose();
        }
    };
    const handleRenameTeam = async (newName: string) => {
        if (!newName || !state.teamToEdit) return;
        const { teamId } = state.teamToEdit;
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
        const result = await safeFetch(`${backendApiUrl}/teams/${teamId}`, { method: 'DELETE' });
        if (result && result.success) {
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