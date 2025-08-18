// src/hooks/useAppLogic.ts
// v73.4 - FIX: Correctly create new design session via backend API call.

"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { appStore, AppState } from "@/store/appStore";
import type { Team, DesignSession } from "@/components/AppLayout";
import { parseAssistantResponse } from "@/lib/utils";

export const useAppLogic = () => {
    const state = useSyncExternalStore(appStore.subscribe, appStore.getSnapshot);
    const backendApiUrl = '/api'; // Using the rewrite proxy

    const safeFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<{ success: boolean; status: number; body: any } | null> => {
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
            appStore.setError(error.message || 'A network error occurred.');
            return null;
        }
    }, []);
    
    useEffect(() => { 
        const loadInitialData = async () => {
            appStore.setStatus('loading');
            const [teamsResult, designSessionsResult] = await Promise.all([
                safeFetch(`${backendApiUrl}/teams`),
                safeFetch(`${backendApiUrl}/team-builder/sessions`)
            ]);
            if (teamsResult?.body && designSessionsResult?.body) {
                appStore.initializeWithData(teamsResult.body, designSessionsResult.body);
            }
        };
        loadInitialData();
    }, [safeFetch]);
    
    useEffect(() => { 
        if (state.activeTeam && state.view !== 'team_builder' && state.status === 'loading') {
             appStore.fetchTeamDependencies(state.activeTeam.teamId, (url: string) => safeFetch(`${backendApiUrl}${url}`));
        }
    }, [state.activeTeam, state.view, state.status, safeFetch]);

    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    const pollChat = useCallback(async (chatId: string, teamId: string) => {
        if (!chatId || !teamId) return;
        const result = await safeFetch(`${backendApiUrl}/chats/${chatId}`);
        if (!result?.body?.messages) return;
        const messages = result.body.messages;
        const lastMessage = messages[messages.length - 1];
        const isDone = lastMessage && lastMessage.role !== 'user' && parseAssistantResponse(lastMessage.content).action !== 'execute_task';
        if (isDone) {
            stopPolling();
            const newHistoryResult = await safeFetch(`${backendApiUrl}/teams/${teamId}/chats`);
            flushSync(() => { appStore.updateChatState({ chatId, messages: messages, newChatHistory: newHistoryResult?.body, status: 'idle' }); });
        } else {
            appStore.updateChatState({ messages: messages });
        }
    }, [safeFetch, stopPolling]);

    useEffect(() => {
        const isPolling = state.status === 'polling';
        const chatId = state.currentChatId;
        const teamId = state.activeTeam?.teamId;
        if (isPolling && chatId && teamId) {
            stopPolling(); 
            pollingIntervalRef.current = setInterval(() => pollChat(chatId, teamId), 3000);
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [state.status, state.currentChatId, state.activeTeam?.teamId, pollChat, stopPolling]);

    const handleSendMessage = async (userInput: string) => {
        if (!userInput || !state.activeTeam) return;
        const isNewChat = !state.currentChatId;
        appStore.setOptimisticMessage(userInput);

        const response = await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`, { 
            method: 'POST', 
            body: JSON.stringify({ message: userInput, chatId: state.currentChatId }) 
        });

        if (!response || !response.body) {
            return appStore.setError("An unknown error occurred while sending the message.");
        }
        
        if (response.status === 200 && response.body.messages) {
            const newHistoryResult = isNewChat ? await safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`) : null;
            flushSync(() => { 
                appStore.updateChatState({ 
                    chatId: response.body.chatId, 
                    messages: response.body.messages, 
                    newChatHistory: newHistoryResult?.body 
                }); 
            });
        } else if (response.status === 202 && response.body.success) {
            const chatId = response.body.chatId;
            const latestChatState = await safeFetch(`${backendApiUrl}/chats/${chatId}`);
            if (latestChatState?.body?.messages) {
                flushSync(() => {
                    appStore.updateChatState({
                        chatId,
                        messages: latestChatState.body.messages
                    });
                });
            }
        } else {
            appStore.setError(response.body.error || "Failed to process message.");
        }
    };

    const handleCreateTeam = async (submissionPayload: any, designSessionId: string) => {
        appStore.setStatus('loading');
        const response = await safeFetch(`${backendApiUrl}/team-builder/create`, {
            method: 'POST',
            body: JSON.stringify({ ...submissionPayload, designSessionId }),
        });
        if (response?.body?.success) {
            const newTeam = { teamId: response.body.teamId, name: response.body.name, mission: response.body.mission };
            flushSync(() => { appStore.finalizeTeamCreation(newTeam, designSessionId); });
        } else {
            appStore.setError("Failed to create the new team.");
        }
    };

    const handleSendTeamBuilderMessage = async (userInput: string) => {
        if (!userInput) return;
        appStore.setOptimisticMessage(userInput);
        const optimisticState = appStore.getSnapshot();
        const sessionToSend = optimisticState.activeDesignSession;
        if (!sessionToSend) return appStore.setError("No active design session found for optimistic update.");

        const response = await safeFetch(`${backendApiUrl}/team-builder/chat`, {
            method: 'POST',
            body: JSON.stringify({ designSessionId: sessionToSend.designSessionId, messages: sessionToSend.messages }),
        });
        
        if (response?.body?.response_type === 'FINAL_SUBMISSION') {
            await handleCreateTeam(response.body.submission_payload, response.body.designSessionId);
        } else if (response?.body) {
            flushSync(() => appStore.updateTeamBuilderState(response.body));
        }
    };

    const handleSetActiveTeam = (teamOrId: Team | string) => {
        const team = typeof teamOrId === 'string' ? state.teams.find(t => t.teamId === teamOrId) : teamOrId;
        if (!team) return;
        stopPolling();
        appStore.setActiveTeam(team);
    };

    const handleNewChat = () => {
        stopPolling();
        appStore.startNewChat();
    };
    
    const handleLoadChat = useCallback(async (chatId: string) => {
        stopPolling();
        appStore.setStatus('loading');
        const result = await safeFetch(`${backendApiUrl}/chats/${chatId}`);
        if (result?.body?.messages) {
            appStore.updateChatState({ chatId, messages: result.body.messages });
        }
    }, [safeFetch, stopPolling]);
    
    const handleSetView = (view: AppState['view'], session?: DesignSession) => {
        appStore.setView(view, session);
    };
    
    // --- REFACTORED METHOD ---
    const handleCreateTeamWithAI = async () => {
        appStore.setStatus('loading');
        const response = await safeFetch(`${backendApiUrl}/team-builder/chat`, {
            method: 'POST',
            body: JSON.stringify({ messages: [] }), // Send empty messages to create a new session
        });

        if (response?.body?.designSessionId) {
            // The backend returns the new session object
            flushSync(() => appStore.initializeNewDesignSession(response.body));
        } else {
            appStore.setError("Failed to create a new design session on the backend.");
        }
    };

    const handleLoadDesignSession = (session: DesignSession) => {
        appStore.setView('team_builder', session);
    };

    return { 
        state, 
        handleSendMessage, 
        handleSetActiveTeam, 
        handleNewChat,
        handleLoadChat,
        handleSetView,
        handleSendTeamBuilderMessage,
        handleCreateTeamWithAI,
        handleLoadDesignSession,
    };
};