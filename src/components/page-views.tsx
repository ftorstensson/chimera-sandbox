// src/components/page-views.tsx
// v5.4 - DEFINITIVE and VALIDATED fix for raw JSON display bug (P0)

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import { ActionMessage } from "@/components/ActionMessage";
import ExpertOutputDisplay from "@/components/ExpertOutputDisplay";
import { Plus, Compass, Code, MessageSquare } from 'lucide-react';
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
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="w-full max-w-3xl mx-auto">
                    {messages.length === 0 && !isLoading ? <WelcomeScreen /> : messages.map((msg, index) => {
                        if (msg.role === 'user' && msg.content) return <UserMessage key={index}>{msg.content}</UserMessage>;
                        
                        if (msg.role === 'assistant' && msg.content) {
                            let parsedContent = null;
                            try {
                                // With the backend now sending clean JSON, we can trust a direct parse.
                                parsedContent = JSON.parse(msg.content);
                            } catch (error) {
                                // If parsing fails, it's a normal text message.
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
                    {isLoading && <div className="flex justify-start"><div className="bg-gray-200 dark:bg-zinc-700 p-4 rounded-2xl rounded-bl-none shadow-sm"><span className="animate-pulse">...</span></div></div>}
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
}
export const TeamManagementView = ({ team, agents, isLoading, onCreateAgent, onEditAgent, onUpdateMission }: TeamManagementViewProps) => {
    const [missionText, setMissionText] = React.useState(team.mission);

    React.useEffect(() => {
        setMissionText(team.mission);
    }, [team.mission]);
    
    return ( 
    <div className="p-8 max-w-4xl mx-auto"> 
        <header className="pb-4 border-b border-gray-200 dark:border-zinc-800"> 
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{team.name}</h1> 
                <Button onClick={onCreateAgent}> 
                    <Plus className="mr-2 h-4 w-4" /> New Agent 
                </Button> 
            </div>
            <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Team Mission (Source of Truth)</p>
                <Textarea
                    value={missionText}
                    onChange={(e) => setMissionText(e.target.value)}
                    placeholder="Define the core purpose of this team..."
                    className="w-full"
                />
                <Button 
                    size="sm" 
                    className="mt-2" 
                    onClick={() => onUpdateMission(missionText)}
                    disabled={missionText === team.mission}
                >
                    Save Mission
                </Button>
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