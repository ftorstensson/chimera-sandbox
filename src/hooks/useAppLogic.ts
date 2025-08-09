// src/hooks/useAppLogic.ts
// VERIFIED-STABLE-V2
// v73.0 - STABILIZED: Aligned with the simplified appStore and removed invalid properties.

"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { appStore } from "@/store/appStore";
import type { Team } from "@/components/AppLayout";
import { parseAssistantResponse } from "@/lib/utils"; // Added for isDone check

export const useAppLogic = () => {
    const state = useSyncExternalStore(appStore.subscribe, appStore.getSnapshot);
    const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

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
        // The isDone check is now simple and uses only the new data.
        const isDone = lastMessage && lastMessage.role !== 'user' && parseAssistantResponse(lastMessage.content).action !== 'execute_task';
        
        if (isDone) {
            stopPolling();
            const newHistoryResult = await safeFetch(`${backendApiUrl}/teams/${teamId}/chats`);
            flushSync(() => {
                appStore.updateChatState({
                    chatId,
                    messages: messages,
                    newChatHistory: newHistoryResult?.body,
                    status: 'idle'
                });
            });
        } else {
            // Let the store derive the 'polling' status automatically
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

        if (!response?.body?.chatId) {
            appStore.setError("Backend did not return a valid chat ID.");
            return;
        }

        const chatId = response.body.chatId;
        const [latestChatState, newHistoryResult] = await Promise.all([
            safeFetch(`${backendApiUrl}/chats/${chatId}`),
            isNewChat ? safeFetch(`${backendApiUrl}/teams/${state.activeTeam.teamId}/chats`) : Promise.resolve(null)
        ]);
        
        if (!latestChatState?.body?.messages) {
            appStore.setError("Failed to fetch latest chat state.");
            return;

        }
        
        flushSync(() => {
            appStore.updateChatState({ 
                chatId, 
                messages: latestChatState.body.messages,
                newChatHistory: newHistoryResult?.body 
            });
        });
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

    return { 
        state, 
        handleSendMessage, 
        handleSetActiveTeam, 
        handleNewChat,
        handleLoadChat
    };
};