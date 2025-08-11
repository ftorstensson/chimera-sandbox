// src/components/ClientHomePage.tsx
// v2.2 - FEATURE: Fully wired up the team builder view.

"use client";

import { useState } from "react";
import { AppLayout, DesignSession } from "@/components/AppLayout";
import { WelcomeScreen, ChatView, TeamManagementView } from "@/components/page-views";
import { useAppLogic } from "@/hooks/useAppLogic";

const TeamWelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="text-gray-400 mb-4 h-12 w-12" />
      <h1 className="text-2xl font-bold">Team Management</h1>
      <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Select a team from the sidebar to view and manage its agents.</p>
    </div>
);

export default function ClientHomePage() {
    const {
        state,
        handleSendMessage,
        handleSetActiveTeam,
        handleNewChat,
        handleLoadChat,
        handleSetView,
        handleSendTeamBuilderMessage,
        handleCreateTeamWithAI,
        handleLoadDesignSession,
    } = useAppLogic();

    const [currentInput, setCurrentInput] = useState("");

    const onSendMessage = () => {
        if (!currentInput.trim()) return;
        handleSendMessage(currentInput);
        setCurrentInput("");
    };
    
    const onSendTeamBuilderMessage = () => {
        if (!currentInput.trim()) return;
        handleSendTeamBuilderMessage(currentInput);
        setCurrentInput("");
    };

    const renderMainContent = () => {
        if (state.status === 'error') return <div className="p-8 text-red-500">Error: {state.error}</div>;

        const isLoading = state.status === 'loading' || state.status === 'polling';
        
        switch (state.view) {
            case 'welcome': return <WelcomeScreen onStartChat={handleNewChat} activeTeam={state.activeTeam} />;
            
            case 'chat':
                if (!state.activeTeam) return <WelcomeScreen onStartChat={handleNewChat} activeTeam={state.activeTeam} />;
                return <ChatView 
                    messages={state.renderState.displayMessages} 
                    currentInput={currentInput} 
                    setCurrentInput={setCurrentInput} 
                    isLoading={isLoading}
                    handleSendMessage={onSendMessage}
                    onAction={() => console.log("onAction placeholder")} 
                />;
            
            case 'team_management':
                if (!state.activeTeam) return <TeamWelcomeScreen />;
                return <TeamManagementView 
                    team={state.activeTeam} 
                    agents={state.agents} 
                    isLoading={isLoading}
                    onCreateAgent={() => alert("Create Agent functionality is pending.")}
                    onEditAgent={() => alert("Edit Agent functionality is pending.")}
                    onUpdateMission={() => alert("Update Mission functionality is pending.")}
                    onRenameTeam={() => alert("Rename Team functionality is pending.")}
                    onDeleteTeam={() => alert("Delete Team functionality is pending.")}
                />;

            case 'team_builder':
                 return <ChatView 
                    messages={state.activeDesignSession?.messages || []} 
                    currentInput={currentInput} 
                    setCurrentInput={setCurrentInput} 
                    isLoading={isLoading} 
                    handleSendMessage={onSendTeamBuilderMessage}
                    onAction={() => console.log("onAction placeholder")} 
                />;

            default: return <WelcomeScreen onStartChat={handleNewChat} activeTeam={state.activeTeam} />;
        }
    };
    
    const activeMode = (state.view === 'team_management' || state.view === 'team_builder') ? 'team' : 'chat';
    
    return (
        <AppLayout
            activeMode={activeMode}
            setActiveMode={(mode) => handleSetView(mode === 'team' ? 'team_management' : 'chat')}
            teams={state.teams}
            designSessions={state.designSessions}
            activeTeam={state.activeTeam}
            activeDesignSession={state.activeDesignSession}
            chatHistory={state.chatHistory}
            currentChatId={state.currentChatId}
            onSetActiveTeam={handleSetActiveTeam}
            onNewChat={handleNewChat}
            onLoadChat={handleLoadChat}
            onCreateTeamWithAIClick={handleCreateTeamWithAI}
            onLoadDesignSession={handleLoadDesignSession}
            onDeleteDesignSession={(session: DesignSession) => alert(`Deleting ${session.name} is pending.`)}
            onRenameChat={(chat) => alert(`Renaming ${chat.title} is pending.`)}
            onDeleteChat={(chat) => alert(`Deleting ${chat.title} is pending.`)}
            onUpdateMission={(mission) => alert(`Updating mission is pending.`)}
        >
            {renderMainContent()}
        </AppLayout>
    );
}