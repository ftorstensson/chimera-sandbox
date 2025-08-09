// src/store/appStore.ts
// VERIFIED-STABLE-V1
// v3.0 - STABILIZED: Removed all holding_message and diagnostic logic for a clean baseline.

import { parseAssistantResponse } from "@/lib/utils";
import type { Team, ChatHistoryItem, Agent, DesignSession } from "@/components/AppLayout";

// --- State Definitions ---
export interface RenderState {
  displayMessages: any[];
}

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
    renderState: RenderState;
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
    renderState: { displayMessages: [] },
    dialog: 'none',
    chatToEdit: null,
    agentToDelete: null,
    designSessionToDelete: null,
    teamToEdit: null,
    status: 'idle',
    error: null,
};

// --- The Store Class ---
class AppStore {
    private state: AppState = initialState;
    private listeners: Set<() => void> = new Set();

    public subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    public getSnapshot = (): AppState => this.state;

    private setState = (updater: (prevState: AppState) => AppState) => {
        this.state = updater(this.state);
        this.listeners.forEach(listener => listener());
    };

    private computeRenderState(messages: any[]): { renderState: RenderState, isPolling: boolean } {
        const lastMessage = messages[messages.length - 1];
        const parsedLastMessage = parseAssistantResponse(lastMessage?.content);
        const isPolling = parsedLastMessage.action === 'execute_task';

        let displayMessages = messages;

        if (isPolling) {
            // Filter out the task message, but no longer handle a holding message.
            displayMessages = messages.filter(m => parseAssistantResponse(m.content).action !== 'execute_task');
        }

        return { renderState: { displayMessages }, isPolling };
    }

    public initializeWithData(teams: Team[], designSessions: DesignSession[]) {
        this.setState(prev => ({ ...prev, teams, designSessions, status: 'idle', activeTeam: prev.activeTeam || teams[0] || null, view: prev.view === 'welcome' && teams.length > 0 ? 'chat' : prev.view }));
    }

    public async fetchTeamDependencies(teamId: string, safeFetch: Function) {
        this.setState(prev => ({ ...prev, status: 'loading' }));
        const [chatHistoryResult, agentsResult] = await Promise.all([
            safeFetch(`/teams/${teamId}/chats`),
            safeFetch(`/teams/${teamId}/agents`)
        ]);
        if (chatHistoryResult?.body && agentsResult?.body) {
            this.setState(prev => ({ ...prev, status: 'idle', chatHistory: chatHistoryResult.body, agents: agentsResult.body }));
        }
    }
    
    public setOptimisticMessage(userInput: string) {
        this.setState(prev => {
            const optimisticMessages = [...prev.messages, { role: 'user', content: userInput }];
            return {
                ...prev,
                status: 'loading',
                messages: optimisticMessages,
                renderState: { ...prev.renderState, displayMessages: optimisticMessages }
            };
        });
    }

    public updateChatState(payload: { chatId?: string; messages: any[], newChatHistory?: ChatHistoryItem[], status?: AppState['status'] }) {
        const { renderState, isPolling } = this.computeRenderState(payload.messages);
        this.setState(prev => ({
            ...prev,
            status: payload.status || (isPolling ? 'polling' : 'idle'),
            currentChatId: payload.chatId || prev.currentChatId,
            messages: payload.messages,
            chatHistory: payload.newChatHistory || prev.chatHistory,
            renderState: renderState,
            view: 'chat'
        }));
    }

    public startNewChat() {
        this.setState(prev => ({ ...prev, currentChatId: null, messages: [], renderState: { displayMessages: [] }, view: 'chat', status: 'idle' }));
    }

    public setActiveTeam(team: Team) {
        this.setState(prev => ({ ...prev, view: 'chat', activeTeam: team, currentChatId: null, messages: [], renderState: { displayMessages: [] }, chatHistory: [], agents: [], status: 'loading' }));
    }

    public setError(error: string) {
        this.setState(prev => ({ ...prev, status: 'error', error }));
    }

    public setStatus(status: AppState['status']) {
        this.setState(prev => ({ ...prev, status }));
    }
}

export const appStore = new AppStore();