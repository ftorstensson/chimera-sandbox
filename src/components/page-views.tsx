// src/components/page-views.tsx
// v6.6 - Correctly parses and hides the 'execute_task' signal.

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import { ActionMessage, ActionMessageProps } from "@/components/ActionMessage";
import ExpertOutputDisplay from "@/components/ExpertOutputDisplay";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, Compass, Code, MessageSquare, Edit, MoreHorizontal, Trash2, FileText, Send, Zap } from 'lucide-react';
import type { Agent, Team } from "@/components/AppLayout";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseAssistantResponse } from "@/lib/utils";

export const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl font-bold">The Everything Agency</h1>
      <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Your creative partner for designing new applications.</p>
    </div>
);

interface ChatViewProps {
    messages: any[];
    currentInput: string;
    setCurrentInput: (value: string) => void;
    isLoading: boolean;
    holdingMessage: string | null;
    handleSendMessage: (isMission: boolean) => void;
    onAction: (actionId: string) => void;
}
export const ChatView = ({ messages, currentInput, setCurrentInput, isLoading, holdingMessage, handleSendMessage, onAction }: ChatViewProps) => {
    const bottomOfChatRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        bottomOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, holdingMessage]);

    const isSendDisabled = isLoading || !currentInput.trim();

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
                <div className="w-full max-w-3xl mx-auto space-y-6">
                    {messages.map((msg, index) => {
                        if (msg.role === 'user' && msg.content) {
                            return <UserMessage key={index}>{msg.content}</UserMessage>;
                        }
                        
                        if (msg.role === 'assistant' && msg.content) {
                            const parsed = parseAssistantResponse(msg.content);
                            
                            // --- THIS IS THE FIX ---
                            // If the message is a task signal, we render nothing, because the global
                            // holdingMessage state will display the "working" indicator.
                            if (parsed.action === 'execute_task') {
                                return null;
                            }

                            if (parsed.action === 'redirect_to_team_builder' && parsed.text && parsed.actions) {
                                const messageProps: ActionMessageProps = {
                                    message: { text: parsed.text, actions: parsed.actions },
                                    onAction: onAction
                                };
                                return <ActionMessage key={index} {...messageProps} />;
                            }
                            
                            // Otherwise, it's a normal conversational message.
                            return (
                                <AssistantMessage key={index}>
                                    {parsed.text}
                                    {msg.agent_used && msg.structured_data && <ExpertOutputDisplay agentName={msg.agent_used} data={msg.structured_data} />}
                                </AssistantMessage>
                            );
                        }
                        return null;
                    })}

                    {holdingMessage && (
                         <AssistantMessage>
                            <div className="flex items-center space-x-2">
                                <Zap className="h-5 w-5 animate-pulse text-yellow-500" />
                                <span>{holdingMessage}</span>
                            </div>
                        </AssistantMessage>
                    )}

                    {isLoading && !holdingMessage && <div className="flex justify-start"><div className="prose dark:prose-invert max-w-none text-foreground/90"><span className="animate-pulse">...</span></div></div>}
                    <div ref={bottomOfChatRef}></div>
                </div>
            </div>
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-zinc-800">
                <div className="w-full max-w-3xl mx-auto">
                    <div className="flex items-end space-x-2">
                    <Textarea 
                        value={currentInput} 
                        onChange={(e) => setCurrentInput(e.target.value)} 
                        placeholder="Ask a question or describe a new task..." 
                        className="flex-grow rounded-lg px-4 py-2 resize-none bg-gray-100 dark:bg-zinc-800" 
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!isSendDisabled) {
                                   handleSendMessage(e.metaKey || e.ctrlKey);
                                }
                            }
                        }}
                    />
                    <div className="flex flex-col space-y-1">
                        <Button onClick={() => handleSendMessage(false)} className="rounded-lg h-10 w-24 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSendDisabled}>
                           <Send className="h-4 w-4 mr-2"/> Chat
                        </Button>
                        <Button onClick={() => handleSendMessage(true)} className="rounded-lg h-10 w-24 bg-yellow-500 hover:bg-yellow-600 text-white" disabled={isSendDisabled}>
                            <Zap className="h-4 w-4 mr-2"/> Mission
                        </Button>
                    </div>
                    </div>
                     <p className="text-xs text-gray-500 mt-2 text-center">
                        Use <span className="font-mono bg-gray-200 dark:bg-zinc-700 rounded px-1 py-0.5">Chat</span> for questions and <span className="font-mono bg-gray-200 dark:bg-zinc-700 rounded px-1 py-0.5">Mission</span> (or Cmd/Ctrl+Enter) for complex tasks.
                    </p>
                </div>
            </div>
        </div>
    );
};


// TeamManagementView remains unchanged
interface TeamManagementViewProps { 
    team: Team; 
    agents: Agent[]; 
    isLoading: boolean;
    onCreateAgent: () => void;
    onEditAgent: (agent: Agent) => void;
    onUpdateMission: (mission: string) => void;
    onRenameTeam: () => void;
    onDeleteTeam: () => void;
}
export const TeamManagementView = ({ team, agents, isLoading, onCreateAgent, onEditAgent, onUpdateMission, onRenameTeam, onDeleteTeam }: TeamManagementViewProps) => {
    const [missionText, setMissionText] = useState(team.mission);
    const [isEditingMission, setIsEditingMission] = useState(false);

    useEffect(() => {
        setMissionText(team.mission);
        setIsEditingMission(false);
    }, [team]);
    
    const handleSaveMission = () => {
        onUpdateMission(missionText);
        setIsEditingMission(false);
    };

    const handleCancelEdit = () => {
        setMissionText(team.mission);
        setIsEditingMission(false);
    };

    return ( 
    <div className="p-8 max-w-4xl mx-auto"> 
        <header className="pb-4 border-b border-gray-200 dark:border-zinc-800"> 
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{team.name}</h1>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <MoreHorizontal className="mr-2 h-4 w-4" /> Team Actions
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={onCreateAgent}><Plus className="mr-2 h-4 w-4"/>New Agent</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsEditingMission(true)} disabled={isEditingMission}><Edit className="mr-2 h-4 w-4"/>Edit Mission</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onRenameTeam}><FileText className="mr-2 h-4 w-4"/>Rename Team</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={onDeleteTeam}><Trash2 className="mr-2 h-4 w-4"/>Delete Team</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="mt-6">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Team Mission (Source of Truth)</p>
                
                {isEditingMission ? (
                    <>
                        <Textarea value={missionText} onChange={(e) => setMissionText(e.target.value)} placeholder="Define the core purpose of this team..." className="w-full text-base" rows={4}/>
                        <div className="mt-2 flex space-x-2">
                            <Button size="sm" onClick={handleSaveMission} disabled={missionText === team.mission}>Save Mission</Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                        </div>
                    </>
                ) : (
                    <p className="text-base text-foreground/80 flex-grow whitespace-pre-wrap min-h-[60px]">
                        {team.mission || "No mission defined yet."}
                    </p>
                )}
            </div>
        </header> 
        <div className="mt-6"> 
            <h2 className="text-xl font-semibold mb-4">Team Agents</h2>
            {isLoading ? <p>Loading agents...</p> : ( 
                <div className="space-y-4"> 
                    {agents.map(agent => ( 
                        <div key={agent.agentId} className="p-4 border dark:border-zinc-800 rounded-lg flex justify-between items-start hover:bg-gray-50 dark:hover:bg-zinc-800/50"> 
                            <div className="flex-grow mr-4 overflow-hidden"> 
                                <h3 className="font-semibold">{agent.name}</h3>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-500 dark:text-gray-400 line-clamp-2">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {agent.system_prompt}
                                    </ReactMarkdown>
                                </div>
                            </div> 
                            <Button variant="outline" size="sm" onClick={() => onEditAgent(agent)} className="flex-shrink-0">
                                Edit
                            </Button>
                        </div> 
                    ))} 
                </div> 
            )} 
        </div> 
    </div> 
)};