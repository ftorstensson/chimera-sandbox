// src/components/page-views.tsx
// v6.2 - Consolidates all team actions into a single dropdown menu

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import { ActionMessage } from "@/components/ActionMessage";
import ExpertOutputDisplay from "@/components/ExpertOutputDisplay";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, Compass, Code, MessageSquare, Edit, MoreHorizontal, Trash2, FileText } from 'lucide-react';
import type { Agent, Team } from "@/components/AppLayout";

export const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl font-bold">The Everything Agency</h1>
      <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Your creative partner for designing new applications.</p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-zinc-800/50 dark:border-zinc-800"><Compass className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Explore new app ideas</p></div>
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-zinc-800/50 dark:border-zinc-800"><Code className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Design application architecture</p></div>
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-zinc-800/50 dark:border-zinc-800"><MessageSquare className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Craft user-centric experiences</p></div>
      </div>
    </div>
);

interface ChatViewProps {
    messages: any[];
    currentInput: string;
    setCurrentInput: (value: string) => void;
    isLoading: boolean;
    handleSubmit: (e: React.FormEvent) => void;
    onAction: (actionId: string) => void;
}
export const ChatView = ({ messages, currentInput, setCurrentInput, isLoading, handleSubmit, onAction }: ChatViewProps) => {
    const bottomOfChatRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        bottomOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
                <div className="w-full max-w-3xl mx-auto space-y-6">
                    {messages.length === 0 && !isLoading ? <WelcomeScreen /> : messages.map((msg, index) => {
                        if (msg.role === 'user' && msg.content) return <UserMessage key={index}>{msg.content}</UserMessage>;
                        
                        if (msg.role === 'assistant' && msg.content) {
                            let parsedContent = null;
                            try {
                                parsedContent = JSON.parse(msg.content);
                            } catch (error) {
                                parsedContent = null;
                            }
                            
                            if (parsedContent && parsedContent.text && Array.isArray(parsedContent.actions)) {
                                return <ActionMessage key={index} message={parsedContent} onAction={onAction} />;
                            }

                            return (
                                <AssistantMessage key={index}>{msg.content}
                                    {msg.agent_used && msg.structured_data && <ExpertOutputDisplay agentName={msg.agent_used} data={msg.structured_data} />}
                                </AssistantMessage>
                            );
                        }
                        return null;
                    })}
                    {isLoading && <div className="flex justify-start"><div className="prose dark:prose-invert max-w-none text-foreground/90"><span className="animate-pulse">...</span></div></div>}
                    <div ref={bottomOfChatRef}></div>
                </div>
            </div>
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-zinc-800">
                <div className="w-full max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="flex items-end space-x-2">
                        <Textarea value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} placeholder="Describe your app idea..." className="flex-grow rounded-lg px-4 py-2 resize-none bg-gray-100 dark:bg-zinc-800" rows={1}/>
                        <Button type="submit" className="rounded-lg h-10 w-16 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>Send</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

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
                        <DropdownMenuItem onClick={() => setIsEditingMission(true)}><Edit className="mr-2 h-4 w-4"/>Edit Mission</DropdownMenuItem>
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
                        <Textarea value={missionText} onChange={(e) => setMissionText(e.target.value)} placeholder="Define the core purpose of this team..." className="w-full text-base"/>
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
                        <div key={agent.agentId} className="p-4 border dark:border-zinc-800 rounded-lg flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50"> 
                            <div> 
                                <h3 className="font-semibold">{agent.name}</h3> 
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-lg">{agent.system_prompt}</p> 
                            </div> 
                            <Button variant="outline" onClick={() => onEditAgent(agent)}>
                                Edit
                            </Button>
                        </div> 
                    ))} 
                </div> 
            )} 
        </div> 
    </div> 
)};