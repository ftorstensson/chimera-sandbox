// src/components/ClientHomePage.tsx
// v2.0 - STABILIZED: Removed holdingMessage prop to align with the simplified store.

"use client";

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
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
    } = useAppLogic();

    const [currentInput, setCurrentInput] = useState("");

    const onSendMessage = () => {
        if (!currentInput.trim()) return;
        handleSendMessage(currentInput);
        setCurrentInput("");
    };

    const onSubmitTeamBuilder = () => {
        console.log("Team Builder submission is not yet implemented with the new store.");
    };
    
    const renderMainContent = () => {
        if (state.status === 'error') return <div className="p-8 text-red-500">Error: {state.error}</div>;

        // STABILIZATION CHANGE: Destructure only displayMessages. holdingMessage is gone.
        const { displayMessages } = state.renderState;
        const isLoading = state.status === 'loading' || state.status === 'polling';
        
        switch (state.view) {
            case 'welcome': return <WelcomeScreen onStartChat={handleNewChat} activeTeam={state.activeTeam} />;
            case 'chat':
                if (!state.activeTeam) return <WelcomeScreen onStartChat={handleNewChat} activeTeam={state.activeTeam} />;
                return <ChatView 
                    messages={displayMessages} 
                    currentInput={currentInput} 
                    setCurrentInput={setCurrentInput} 
                    isLoading={isLoading}
                    // STABILIZATION CHANGE: holdingMessage prop is removed.
                    // The ChatView will now rely solely on isLoading for its indicator.
                    handleSendMessage={onSendMessage}
                    onAction={() => console.log("onAction placeholder")} 
                />;
            case 'team_management':
                if (!state.activeTeam) return <TeamWelcomeScreen />;
                return <TeamManagementView 
                    team={state.activeTeam} 
                    agents={state.agents} 
                    isLoading={state.status === 'loading'}
                    onCreateAgent={() => alert("Create Agent functionality is pending.")}
                    onEditAgent={() => alert("Edit Agent functionality is pending.")}
                    onUpdateMission={() => alert("Update Mission functionality is pending.")}
                    onRenameTeam={() => alert("Rename Team functionality is pending.")}
                    onDeleteTeam={() => alert("Delete Team functionality is pending.")}
                />;
            case 'team_builder':
                 return <ChatView 
                    messages={state.messages} 
                    currentInput={currentInput} 
                    setCurrentInput={setCurrentInput} 
                    isLoading={isLoading} 
                    // STABILIZATION CHANGE: holdingMessage prop is removed.
                    handleSendMessage={onSubmitTeamBuilder}
                    onAction={() => console.log("onAction placeholder")} 
                />;
            default: return <WelcomeScreen onStartChat={handleNewChat} activeTeam={state.activeTeam} />;
        }
    };
    
    const activeMode = (state.view === 'team_management' || state.view === 'team_builder') ? 'team' : 'chat';
    
    return (
        <AppLayout
            activeMode={activeMode}
            setActiveMode={() => console.log("setActiveMode is pending implementation")}
            teams={state.teams}
            designSessions={state.designSessions}
            activeTeam={state.activeTeam}
            activeDesignSession={state.activeDesignSession}
            chatHistory={state.chatHistory}
            currentChatId={state.currentChatId}
            onSetActiveTeam={handleSetActiveTeam}
            onNewChat={handleNewChat}
            onLoadChat={handleLoadChat}
            onCreateTeamWithAIClick={() => console.log("onCreateTeamWithAIClick is pending implementation")}
            onLoadDesignSession={() => console.log("onLoadDesignSession is pending implementation")}
            onDeleteDesignSession={() => alert("Delete Design Session functionality is pending.")}
            onRenameChat={() => alert("Rename Chat functionality is pending.")}
            onDeleteChat={() => alert("Delete Chat functionality is pending.")}
            onUpdateMission={() => alert("Update Mission functionality is pending.")}
        >
            {renderMainContent()}
        </AppLayout>
    );
}