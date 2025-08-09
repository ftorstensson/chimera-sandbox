// src/components/page-views.tsx
// VERIFIED-STABLE-V1
// v2.4 - DEFINITIVE FIX: Corrected AssistantMessage to pass content as children.

"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Agent, Team } from './AppLayout';
import AssistantMessage from './AssistantMessage';
import UserMessage from './UserMessage';
import { WorkingIndicator } from './WorkingIndicator';

// --- WelcomeScreen ---
interface WelcomeScreenProps {
  onStartChat: () => void;
  activeTeam: Team | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartChat, activeTeam }) => (
  <div className="flex flex-col items-center justify-center h-full text-center bg-gray-50 dark:bg-zinc-900 p-8">
    <div className="max-w-md">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Welcome to The Everything Agency</h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        This is your collaborative space to create, manage, and deploy teams of specialized AI agents.
      </p>
      {activeTeam && (
        <p className="mt-2 text-md text-gray-500 dark:text-gray-500">
          You have the <span className="font-semibold text-gray-700 dark:text-gray-300">{activeTeam.name}</span> selected.
        </p>
      )}
      <Button onClick={onStartChat} className="mt-6">Start a New Chat</Button>
    </div>
  </div>
);

// --- ChatView ---
interface ChatViewProps {
  messages: any[];
  currentInput: string;
  setCurrentInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  handleSendMessage: () => void;
  onAction: (action: string, data: any) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  currentInput,
  setCurrentInput,
  isLoading,
  handleSendMessage,
  onAction,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) =>
          msg.role === 'user' ? (
            <UserMessage key={index}>{msg.content}</UserMessage>
          ) : (
            // DEFINITIVE FIX: Pass content as children and remove invalid onAction prop.
            <AssistantMessage key={index}>
              {msg.content}
            </AssistantMessage>
          )
        )}
        {isLoading && <WorkingIndicator />}
      </div>
      <div className="p-4 border-t bg-white dark:bg-zinc-800">
        <div className="relative">
          <Textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="pr-20"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            disabled={isLoading || !currentInput.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- TeamManagementView ---
// ... (rest of the file is unchanged)
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

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  team,
  agents,
  isLoading,
  onCreateAgent,
  onEditAgent,
  onUpdateMission,
  onRenameTeam,
  onDeleteTeam,
}) => (
  <div className="p-8">
    <Card>
      <CardHeader>
        <CardTitle>{team.name}</CardTitle>
        <CardDescription>Mission: {team.mission}</CardDescription>
      </CardHeader>
      <CardContent>
        <h3 className="font-bold mb-4">Agents</h3>
        {isLoading ? (
          <p>Loading agents...</p>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <Card key={agent.agentId}>
                <CardHeader>
                  <CardTitle>{agent.name}</CardTitle>
                  <Button size="sm" onClick={() => onEditAgent(agent)}>Edit</Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{agent.system_prompt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Button onClick={onCreateAgent} className="mt-4">Create New Agent</Button>
      </CardContent>
    </Card>
  </div>
);