// src/app/page.tsx
// v63.1 - FIX: Correctly parses and displays the holding message from JSON.

"use client";

import { useState } from "react";
import { AppLayout, Agent, DesignSession } from "@/components/AppLayout";
import { WelcomeScreen, ChatView, TeamManagementView } from "@/components/page-views";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import { useAppLogic } from "@/hooks/useAppLogic";
import { parseAssistantResponse } from "@/lib/utils";

const TeamWelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="text-gray-400 mb-4 h-12 w-12" />
      <h1 className="text-2xl font-bold">Team Management</h1>
      <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Select a team from the sidebar to view and manage its agents.</p>
    </div>
);

export default function HomePage() {
    const {
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
    } = useAppLogic();

    const [currentInput, setCurrentInput] = useState("");
    const [dialogInput, setDialogInput] = useState("");
    const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);

    const onSendMessage = () => {
        handleSendMessage(currentInput);
        setCurrentInput("");
    };

    const onSubmitTeamBuilder = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmitTeamBuilder(currentInput);
        setCurrentInput("");
    };
    
    const onRenameChat = () => {
        handleRenameChat(dialogInput);
        setDialogInput("");
    };

    const onRenameTeam = () => {
        handleRenameTeam(dialogInput);
        setDialogInput("");
    }
    
    const onSaveAgent = async (agentData: { name: string, system_prompt: string }) => {
        await handleSaveAgent(agentData, agentToEdit?.agentId);
        setAgentToEdit(null);
    }
    
    const onDeleteAgent = (agent: Agent) => {
        handleDialogOpen('delete_agent', { agent });
    }

    const renderMainContent = () => {
        if (state.status === 'error') return <div className="p-8 text-red-500">Error: {state.error}</div>;
        if (state.status === 'loading' && !state.activeTeam && !state.activeDesignSession && state.view !== 'chat') return <div className="p-8">Loading...</div>;

        const isLoading = state.status === 'loading' || state.status === 'polling';
        
        // UPDATED LOGIC:
        // 1. Find the raw message content that represents a task.
        const rawHoldingMessageContent = state.status === 'polling' 
            ? state.messages.find(m => parseAssistantResponse(m.content)?.action === 'execute_task')?.content
            : null;
        // 2. Parse it to extract the user-facing holding message text.
        const parsedHoldingMessage = parseAssistantResponse(rawHoldingMessageContent)?.holding_message;
        
        // 3. Ensure we only display conversational messages in the main chat view.
        const displayMessages = state.messages.filter(m => parseAssistantResponse(m.content)?.action !== 'execute_task');


        switch (state.view) {
            case 'welcome': return <WelcomeScreen />;
            case 'chat':
                if (!state.activeTeam) return <WelcomeScreen />;
                return <ChatView 
                    messages={displayMessages} 
                    currentInput={currentInput} 
                    setCurrentInput={setCurrentInput} 
                    isLoading={isLoading}
                    holdingMessage={parsedHoldingMessage} // Pass the correctly parsed text
                    handleSendMessage={onSendMessage}
                    onAction={handleChatAction} 
                />;
            case 'team_management':
                // ... (omitted for brevity, no changes)
                if (!state.activeTeam) return <TeamWelcomeScreen />;
                return <TeamManagementView 
                    team={state.activeTeam} 
                    agents={state.agents} 
                    isLoading={isLoading}
                    onCreateAgent={() => setAgentToEdit({ agentId: '', name: '', system_prompt: '' })} 
                    onEditAgent={setAgentToEdit}
                    onUpdateMission={handleUpdateMission}
                    onRenameTeam={() => { if (state.activeTeam) handleDialogOpen('rename_team', { team: state.activeTeam })}}
                    onDeleteTeam={() => { if (state.activeTeam) handleDialogOpen('delete_team', { team: state.activeTeam })}}
                />;
            case 'team_builder':
                // ... (omitted for brevity, no changes)
                const builderMessages = state.activeDesignSession ? state.activeDesignSession.messages : [];
                 return <ChatView 
                    messages={builderMessages} 
                    currentInput={currentInput} 
                    setCurrentInput={setCurrentInput} 
                    isLoading={isLoading} 
                    holdingMessage={null}
                    handleSendMessage={() => onSubmitTeamBuilder(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>)}
                    onAction={handleChatAction} 
                />;
            default: return <WelcomeScreen />;
        }
    };
    
    const activeMode = (state.view === 'team_management' || state.view === 'team_builder') ? 'team' : 'chat';
    
    return (
        <>
            <AppLayout
                // ... (omitted for brevity, no changes)
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
                onDeleteDesignSession={(session: DesignSession) => handleDialogOpen('delete_design_session', { designSession: session })}
                onRenameChat={(chat) => {
                    handleDialogOpen('rename_chat', { chat });
                    setDialogInput(chat.title);
                }}
                onDeleteChat={(chat) => handleDialogOpen('delete_chat', { chat })}
                onUpdateMission={handleUpdateMission}
            >
                {renderMainContent()}
            </AppLayout>

            {/* DIALOGS (omitted for brevity, no changes) */}
            <Dialog open={state.dialog === 'rename_chat'} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Rename Chat</DialogTitle></DialogHeader>
                    <Input value={dialogInput} onChange={(e) => setDialogInput(e.target.value)} placeholder="Enter new title..." />
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button onClick={onRenameChat}>Rename</Button>
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
                        <Button onClick={onRenameTeam}>Rename</Button>
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
            
            <AgentEditDialog isOpen={!!agentToEdit} onOpenChange={(isOpen) => { if (!isOpen) setAgentToEdit(null); }} agentToEdit={agentToEdit} onSave={onSaveAgent} onDelete={onDeleteAgent} />
        </>
    );
}