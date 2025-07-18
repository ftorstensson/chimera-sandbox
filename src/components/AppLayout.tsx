// src/components/AppLayout.tsx
// v1.1 - Fix: Correctly pass event handler props to sidebar components

"use client"; 

import React from "react";
import { useTheme } from "next-themes";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Users, Plus, Settings, Sun, Moon, Menu } from 'lucide-react';

// --- TYPE DEFINITIONS ---
export interface Team { teamId: string; name: string; }
export interface ChatHistoryItem { chatId: string; title: string; }

// --- Shared ClassNames ---
const sidebarHoverStyle = "hover:bg-gray-200 dark:hover:bg-zinc-800";
const sidebarSelectedStyle = "!bg-gray-300 text-gray-900 dark:!bg-zinc-700 dark:text-gray-100";

// ==============================================================================
//  Sidebar Components
// ==============================================================================
const ChatModeSidebar = ({ teams, selectedTeam, onSelectTeam, chatHistory, onNewChat, onLoadChat, currentChatId }: { teams: Team[], selectedTeam: Team | null, onSelectTeam: (teamId: string) => void, chatHistory: ChatHistoryItem[], onNewChat: () => void, onLoadChat: (chatId: string) => void, currentChatId: string | null }) => ( <div className="flex flex-col h-full"> <div className="p-2 flex-shrink-0"> <div className="text-center mb-4"> <MessageSquare className="mx-auto h-8 w-8 mb-2" /> <h2 className="text-xl font-semibold">Designer Chat</h2> <p className="text-sm text-gray-500 dark:text-gray-400">Pick the multi-agent team that you want to work with</p> </div> <Select value={selectedTeam?.teamId || ''} onValueChange={onSelectTeam}> <SelectTrigger className={`w-full focus:ring-indigo-500 ${sidebarSelectedStyle}`}> <SelectValue placeholder="Select a team..." /> </SelectTrigger> <SelectContent className="bg-white text-gray-900 dark:bg-zinc-800 dark:text-white"> {teams.map(team => ( <SelectItem key={team.teamId} value={team.teamId}>{team.name}</SelectItem> ))} </SelectContent> </Select> <Button variant="ghost" className={`w-full justify-start mt-2 ${sidebarHoverStyle}`} onClick={onNewChat}> <Plus className="mr-2 h-4 w-4" /> New Design Chat </Button> </div> <div className="flex-grow overflow-y-auto mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800"> <p className="px-3 text-xs uppercase text-gray-500 tracking-wider">Recent Design Chats</p> <nav className="mt-2 space-y-1 px-2"> {chatHistory.length > 0 ? ( chatHistory.map(chat => ( <Button key={chat.chatId} variant="ghost" className={`w-full justify-start truncate ${sidebarHoverStyle} ${currentChatId === chat.chatId ? sidebarSelectedStyle : ''}`} onClick={() => onLoadChat(chat.chatId)}>{chat.title}</Button> )) ) : ( <p className="px-3 py-2 text-sm text-gray-500">No chats for this team yet.</p> )} </nav> </div> </div> );
const TeamModeSidebar = ({ teams, onTeamClick, activeTeam, onCreateTeamClick }: { teams: Team[], onTeamClick: (team: Team) => void, activeTeam: Team | null, onCreateTeamClick: () => void }) => ( <div className="flex flex-col h-full"> <div className="p-2 flex-shrink-0"> <div className="text-center mb-4"> <Users className="mx-auto h-8 w-8 mb-2" /> <h2 className="text-xl font-semibold">Team Building</h2> <p className="text-sm text-gray-500 dark:text-gray-400">Build and manage your multi-agent teams and agents.</p> </div> <Button variant="ghost" className={`w-full justify-start ${sidebarHoverStyle}`} onClick={onCreateTeamClick}> <Plus className="mr-2 h-4 w-4" /> New Team </Button> </div> <div className="flex-grow overflow-y-auto mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800"> <p className="px-3 text-xs uppercase text-gray-500 tracking-wider">Manage Teams & Agents</p> <nav className="mt-2 space-y-1 px-2"> {teams.map(team => ( <Button key={team.teamId} variant="ghost" className={`w-full justify-start ${sidebarHoverStyle} ${activeTeam?.teamId === team.teamId ? sidebarSelectedStyle : ''}`} onClick={() => onTeamClick(team)} > {team.name} </Button> ))} </nav> </div> </div> );

// ==============================================================================
//  The Main App Layout Component
// ==============================================================================
export interface AppLayoutProps {
    children: React.ReactNode;
    activeMode: 'chat' | 'team';
    setActiveMode: (mode: 'chat' | 'team') => void;
    teams: Team[];
    selectedTeam: Team | null;
    chatHistory: ChatHistoryItem[];
    activeTeam: Team | null;
    currentChatId: string | null;
    onSelectTeamForChat: (teamId: string) => void;
    onNewChat: () => void;
    onLoadChat: (chatId: string) => void;
    onSetActiveTeam: (team: Team) => void;
    onCreateTeamClick: () => void;
}

const AppLayoutContent = (props: AppLayoutProps) => {
  const { theme, setTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  
  return (
    <div className="flex h-screen bg-white dark:bg-[#171719] text-gray-900 dark:text-gray-100">
      <aside className={`flex flex-col flex-shrink-0 bg-gray-100 dark:bg-[#141415] transition-all duration-300 ${isSidebarOpen ? 'w-72 p-2' : 'w-0 border-0 p-0'}`}>
        <div className="flex flex-col flex-grow overflow-hidden">
            <div className={`flex-shrink-0 p-2 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                <ToggleGroup type="single" value={props.activeMode} onValueChange={(value: 'chat' | 'team') => { if (value) props.setActiveMode(value); }} className="w-full grid grid-cols-2"> 
                    <ToggleGroupItem value="chat" aria-label="Toggle chat mode" className={props.activeMode === 'chat' ? sidebarSelectedStyle : sidebarHoverStyle}>CHAT</ToggleGroupItem> 
                    <ToggleGroupItem value="team" aria-label="Toggle team mode" className={props.activeMode === 'team' ? sidebarSelectedStyle : sidebarHoverStyle}>TEAM</ToggleGroupItem> 
                </ToggleGroup> 
            </div>
            <div className={`flex-grow mt-2 overflow-y-auto transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              {props.activeMode === 'chat' ? ( 
                <ChatModeSidebar 
                    teams={props.teams} 
                    selectedTeam={props.selectedTeam} 
                    onSelectTeam={props.onSelectTeamForChat} // <-- THIS WAS THE FIX
                    chatHistory={props.chatHistory}
                    onNewChat={props.onNewChat}
                    onLoadChat={props.onLoadChat}
                    currentChatId={props.currentChatId}
                /> 
               ) : ( 
                <TeamModeSidebar 
                    teams={props.teams} 
                    onTeamClick={props.onSetActiveTeam} // <-- THIS WAS THE FIX
                    activeTeam={props.activeTeam} 
                    onCreateTeamClick={props.onCreateTeamClick}
                /> 
               )}
            </div>
            <div className={`flex-shrink-0 border-t border-gray-200 dark:border-zinc-800 mt-2 pt-2 flex items-center justify-between transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}> 
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={sidebarHoverStyle}> 
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /> 
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /> 
                </Button> 
                <Button variant="ghost" className={`text-sm ${sidebarHoverStyle}`}> <Settings className="mr-2 h-4 w-4" /> Settings </Button> 
            </div>
        </div>
      </aside>
      <div className="flex flex-col flex-1 h-full min-w-0">
        <header className="flex items-center p-2 flex-shrink-0 border-b border-gray-200 dark:border-zinc-800">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-2 text-gray-500">
            <Menu size={24} />
          </Button>
          <h1 className="text-xl font-semibold">Vibe Designer AI</h1>
        </header>
        <main className="flex-1 overflow-y-auto">
            {props.children}
        </main>
      </div>
    </div>
  );
}

export function AppLayout(props: AppLayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <AppLayoutContent {...props} />
    </ThemeProvider>
  );
}