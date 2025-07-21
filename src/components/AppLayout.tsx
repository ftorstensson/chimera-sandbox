// src/components/AppLayout.tsx
// v2.10 - Definitive Fix for Rollover UI Bug

"use client"; 

import React from "react";
import { useTheme } from "next-themes";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquare, Users, Plus, Settings, Sun, Moon, Menu, Sparkles, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

export interface Team { teamId: string; name: string; }
export interface ChatHistoryItem { chatId: string; title: string; }
export interface Agent { agentId: string; name: string; system_prompt: string; }

const sidebarHoverStyle = "hover:bg-gray-200 dark:hover:bg-zinc-800";
const sidebarSelectedStyle = "!bg-gray-300 text-gray-900 dark:!bg-zinc-700 dark:text-gray-100";

const ChatModeSidebar = (props: { teams: Team[]; activeTeam: Team | null; onTeamSelect: (teamId: string) => void; chatHistory: ChatHistoryItem[]; onNewChat: () => void; onLoadChat: (chatId: string) => void; currentChatId: string | null; onRenameChat: (chat: ChatHistoryItem) => void; onDeleteChat: (chat: ChatHistoryItem) => void; }) => (
    <div className="flex flex-col h-full">
        <div className="p-2 flex-shrink-0">
            <div className="text-center mb-4"><MessageSquare className="mx-auto h-8 w-8 mb-2" /><h2 className="text-xl font-semibold">Designer Chat</h2><p className="text-sm text-gray-500 dark:text-gray-400">Pick the multi-agent team that you want to work with</p></div>
            <Select value={props.activeTeam?.teamId || ''} onValueChange={props.onTeamSelect}>
                <SelectTrigger className={`w-full focus:ring-indigo-500 ${sidebarSelectedStyle}`}><SelectValue placeholder="Select a team..." /></SelectTrigger>
                <SelectContent className="bg-white text-gray-900 dark:bg-zinc-800 dark:text-white">{props.teams.map(team => (<SelectItem key={team.teamId} value={team.teamId}>{team.name}</SelectItem>))}</SelectContent>
            </Select>
            <Button variant="ghost" className={`w-full justify-start mt-2 ${sidebarHoverStyle}`} onClick={props.onNewChat}><Plus className="mr-2 h-4 w-4" /> New Design Chat</Button>
        </div>
        <div className="flex-grow overflow-y-auto mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
            <p className="px-3 text-xs uppercase text-gray-500 tracking-wider">Recent Design Chats</p>
            <nav className="mt-2 space-y-1 px-2">{props.chatHistory.length > 0 ? (props.chatHistory.map(chat => (
                <div 
                    key={chat.chatId} 
                    className={`group flex items-center rounded-md cursor-pointer ${sidebarHoverStyle} ${props.currentChatId === chat.chatId ? sidebarSelectedStyle : ''}`}
                    onClick={() => props.onLoadChat(chat.chatId)}
                >
                    <span className="flex-grow truncate px-2 py-2">{chat.title}</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal size={16}/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); props.onRenameChat(chat); }}>
                                <Edit className="mr-2 h-4 w-4"/>Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={(e) => { e.stopPropagation(); props.onDeleteChat(chat); }}>
                                <Trash2 className="mr-2 h-4 w-4"/>Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ))) : (<p className="px-3 py-2 text-sm text-gray-500">No chats for this team yet.</p>)}
            </nav>
        </div>
    </div>
);

const TeamModeSidebar = (props: { teams: Team[]; onTeamSelect: (team: Team | string) => void; activeTeam: Team | null; onCreateTeamClick: () => void; onCreateTeamWithAIClick: () => void; }) => ( 
    <div className="flex flex-col h-full"> 
        <div className="p-2 flex-shrink-0">
            <div className="text-center mb-4"><Users className="mx-auto h-8 w-8 mb-2" /><h2 className="text-xl font-semibold">Team Building</h2><p className="text-sm text-gray-500 dark:text-gray-400">Build and manage your multi-agent teams and agents.</p></div>
            <Button variant="outline" className={`w-full justify-start ${sidebarHoverStyle} text-indigo-500 border-indigo-500/50 hover:text-indigo-400`} onClick={props.onCreateTeamWithAIClick}><Sparkles className="mr-2 h-4 w-4" /> New Team with AI</Button>
            <Button variant="ghost" className={`w-full justify-start mt-1 ${sidebarHoverStyle}`} onClick={props.onCreateTeamClick}><Plus className="mr-2 h-4 w-4" /> New Team (Manual)</Button>
        </div> 
        <div className="flex-grow overflow-y-auto mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
            <p className="px-3 text-xs uppercase text-gray-500 tracking-wider">Manage Teams & Agents</p>
            <nav className="mt-2 space-y-1 px-2">
                {props.teams.map(team => (<Button key={team.teamId} variant="ghost" className={`w-full justify-start ${sidebarHoverStyle} ${props.activeTeam?.teamId === team.teamId ? sidebarSelectedStyle : ''}`} onClick={() => props.onTeamSelect(team)} >{team.name}</Button>))}
            </nav>
        </div> 
    </div> 
);

export interface AppLayoutProps { children: React.ReactNode; activeMode: 'chat' | 'team'; setActiveMode: (mode: 'chat' | 'team') => void; teams: Team[]; chatHistory: ChatHistoryItem[]; activeTeam: Team | null; currentChatId: string | null; onSetActiveTeam: (team: Team | string) => void; onNewChat: () => void; onLoadChat: (chatId: string) => void; onCreateTeamClick: () => void; onCreateTeamWithAIClick: () => void; onRenameChat: (chat: ChatHistoryItem) => void; onDeleteChat: (chat: ChatHistoryItem) => void; }

const AppLayoutContent = (props: AppLayoutProps) => {
  const { theme, setTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  
  return (
    <div className="flex h-screen bg-white dark:bg-[#171719] text-gray-900 dark:text-gray-100">
      <aside className={`flex flex-col flex-shrink-0 bg-gray-100 dark:bg-[#141415] transition-all duration-300 ${isSidebarOpen ? 'w-72 p-2' : 'w-0 border-0 p-0'}`}>
        <div className="flex flex-col flex-grow overflow-hidden">
            <div className={`flex-shrink-0 p-2 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                <ToggleGroup type="single" value={props.activeMode} onValueChange={(value) => { if (value) props.setActiveMode(value as 'chat' | 'team'); }} className="w-full grid grid-cols-2"> <ToggleGroupItem value="chat" aria-label="Toggle chat mode" className={props.activeMode === 'chat' ? sidebarSelectedStyle : sidebarHoverStyle}>CHAT</ToggleGroupItem> <ToggleGroupItem value="team" aria-label="Toggle team mode" className={props.activeMode === 'team' ? sidebarSelectedStyle : sidebarHoverStyle}>TEAM</ToggleGroupItem> </ToggleGroup> 
            </div>
            <div className={`flex-grow mt-2 overflow-y-auto transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              {props.activeMode === 'chat' ? ( 
                  <ChatModeSidebar 
                      teams={props.teams}
                      activeTeam={props.activeTeam}
                      onTeamSelect={props.onSetActiveTeam}
                      chatHistory={props.chatHistory}
                      onNewChat={props.onNewChat}
                      onLoadChat={props.onLoadChat}
                      currentChatId={props.currentChatId}
                      onRenameChat={props.onRenameChat}
                      onDeleteChat={props.onDeleteChat}
                  /> 
                ) : ( 
                  <TeamModeSidebar 
                      teams={props.teams}
                      activeTeam={props.activeTeam}
                      onTeamSelect={props.onSetActiveTeam}
                      onCreateTeamClick={props.onCreateTeamClick}
                      onCreateTeamWithAIClick={props.onCreateTeamWithAIClick}
                  /> 
                )}
            </div>
            <div className={`flex-shrink-0 border-t border-gray-200 dark:border-zinc-800 mt-2 pt-2 flex items-center justify-between transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}> <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={sidebarHoverStyle}> <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /> <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /> </Button> <Button variant="ghost" className={`text-sm ${sidebarHoverStyle}`}> <Settings className="mr-2 h-4 w-4" /> Settings </Button> </div>
        </div>
      </aside>
      <div className="flex flex-col flex-1 h-full min-w-0"> <header className="flex items-center p-2 flex-shrink-0 border-b border-gray-200 dark:border-zinc-800"> <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-2 text-gray-500"> <Menu size={24} /> </Button> <h1 className="text-xl font-semibold">Vibe Designer AI</h1> </header> <main className="flex-1 overflow-y-auto"> {props.children} </main> </div>
    </div>
  );
}

export function AppLayout(props: AppLayoutProps) { return ( <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange> <AppLayoutContent {...props} /> </ThemeProvider> ); }