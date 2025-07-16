// src/app/page.tsx
// v12.3 - Wire Up Save Agent Functionality
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import UserMessage from "@/components/UserMessage";
import AssistantMessage from "@/components/AssistantMessage";
import ExpertOutputDisplay from "@/components/ExpertOutputDisplay";
import { Menu, Compass, Code, MessageSquare, Plus, MoreHorizontal, Edit, Trash2, Users, FilePenLine } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface ChatMessage { role: 'user' | 'assistant' | 'tool'; content: string | null; agent_used?: string; structured_data?: any; }
interface ChatHistoryItem { chatId: string; title: string; }
interface Agent { agentId: string; name: string; system_prompt: string; }
const agentList = ['concept_crafter', 'guide_agent', 'insight_agent'];

// ==============================================================================
//  WELCOME SCREEN COMPONENT
// ==============================================================================
const WelcomeScreen = () => (
  <div className="flex flex-col items-center justify-center h-full text-center pb-24">
    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Hello, I'm Vibe Designer</h1>
    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Your creative partner for designing new applications.</p>
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"><Compass className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Explore new app ideas</p></div>
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"><Code className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Design application architecture</p></div>
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"><MessageSquare className="h-6 w-6 mx-auto mb-2 text-indigo-500"/><p>Craft user-centric experiences</p></div>
    </div>
  </div>
);

// ==============================================================================
//  MAIN HOME PAGE COMPONENT
// ==============================================================================
export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [forcedAgent, setForcedAgent] = useState<string | "none">("none");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToEdit, setChatToEdit] = useState<ChatHistoryItem | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isAgentManagerOpen, setIsAgentManagerOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isEditAgentOpen, setIsEditAgentOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [editedPrompt, setEditedPrompt] = useState("");

  const bottomOfChatRef = useRef<HTMLDivElement>(null);
  const backendApiUrl = 'https://idx-ai-designer-backend-82522688-534939227554.australia-southeast1.run.app';

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await fetch(`${backendApiUrl}/chats`);
      if (!response.ok) throw new Error("Failed to fetch chat history");
      const data: ChatHistoryItem[] = await response.json();
      setChatHistory(data);
    } catch (error) { console.error("Failed to fetch chat history:", error); }
  }, [backendApiUrl]);

  useEffect(() => { fetchChatHistory(); }, [fetchChatHistory]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setCurrentInput("");
  };

  const loadChatHistory = useCallback(async (chatId: string) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${backendApiUrl}/chats/${chatId}`);
        if (!response.ok) throw new Error(`Failed to fetch chat: ${response.statusText}`);
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentChatId(chatId);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setMessages([{ role: 'assistant', content: `Error loading chat: ${errorMessage}` }]);
        setCurrentChatId(null);
    } finally {
        setIsLoading(false);
    }
  }, [backendApiUrl]);

  const handleSubmit = async (input: string) => {
    const effectiveInput = input.trim();
    if (!effectiveInput || isLoading) return;
    setIsLoading(true);
    const currentMessages = messages.length === 0 && !currentChatId ? [] : [...messages];
    const optimisticMessages: ChatMessage[] = [...currentMessages, { role: 'user', content: effectiveInput }];
    setMessages(optimisticMessages);
    setCurrentInput("");
    try {
      const response = await fetch(`${backendApiUrl}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: currentChatId, message: effectiveInput, force_tool_name: forcedAgent }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setMessages(data.messages);
      if (!currentChatId && data.chatId) {
        setCurrentChatId(data.chatId);
        await fetchChatHistory();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
      setForcedAgent("none");
    }
  };

  const handleRename = async () => {
    if (!chatToEdit || !newTitle.trim()) return;
    try {
      await fetch(`${backendApiUrl}/chats/${chatToEdit.chatId}/rename`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_title: newTitle }),
      });
      await fetchChatHistory();
      setIsRenameDialogOpen(false);
      setNewTitle("");
    } catch (error) { console.error("Failed to rename chat:", error); }
  };

  const handleDelete = async () => {
    if (!chatToEdit) return;
    try {
      await fetch(`${backendApiUrl}/chats/${chatToEdit.chatId}`, { method: "DELETE" });
      await fetchChatHistory();
      if (currentChatId === chatToEdit.chatId) { handleNewChat(); }
      setIsDeleteDialogOpen(false);
    } catch (error) { console.error("Failed to delete chat:", error); }
  };
  
  const fetchAgents = async () => {
    try {
      const response = await fetch(`${backendApiUrl}/agents`);
      if (!response.ok) throw new Error("Failed to fetch agents");
      const agentData: Agent[] = await response.json();
      setAgents(agentData);
      return agentData;
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  };

  const handleManageAgents = async () => {
    await fetchAgents();
    setIsAgentManagerOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setCurrentAgent(agent);
    setEditedPrompt(agent.system_prompt);
    setIsEditAgentOpen(true);
  };
  
  const handleSaveAgent = async () => {
    if (!currentAgent) return;
    try {
        await fetch(`${backendApiUrl}/agents/${currentAgent.agentId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ system_prompt: editedPrompt }),
        });
        setIsEditAgentOpen(false);
        // Refresh the agent list to show the updated prompt
        await fetchAgents(); 
    } catch (error) {
        console.error("Failed to save agent:", error);
        // Optionally, show an error to the user
    }
  };
  
  useEffect(() => { bottomOfChatRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-[#131314] text-gray-900 dark:text-gray-100">
      
      <aside className={`flex flex-col flex-shrink-0 bg-[#1e1f20] text-white transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-0'}`}>
        <div className="p-2 flex-shrink-0 border-b border-gray-700/50 pb-2 mb-2">
            <Button variant="ghost" className="w-full justify-start gap-2 text-lg" onClick={handleNewChat}><Plus /> New Chat</Button>
            <Button variant="ghost" className="w-full justify-start gap-2 text-lg" onClick={handleManageAgents}><Users /> Manage Agents</Button>
        </div>
        <div className="flex-grow overflow-y-auto px-2">
          <p className="px-3 py-2 text-sm font-medium text-gray-400">Recent</p>
          <nav className="space-y-1">
            {chatHistory.map(chat => (
              <div key={chat.chatId} className="group flex items-center justify-between rounded-md hover:bg-[#2d2e30]">
                <a href="#" onClick={(e) => { e.preventDefault(); loadChatHistory(chat.chatId); }}
                   className={`flex-grow flex items-center gap-2 px-3 py-2 text-sm font-medium truncate ${currentChatId === chat.chatId ? 'text-white' : 'text-gray-300'}`}>
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />{chat.title}
                </a>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100"><MoreHorizontal size={16}/></Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => { setChatToEdit(chat); setNewTitle(chat.title); setIsRenameDialogOpen(true); }}><Edit className="mr-2 h-4 w-4"/>Rename</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setChatToEdit(chat); setIsDeleteDialogOpen(true); }} className="text-red-500"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex flex-1 flex-col h-full bg-white dark:bg-[#131314]">
        <header className="flex items-center p-2 flex-shrink-0 border-b dark:border-gray-700">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-2 text-gray-500"><Menu size={24} /></Button>
          <h1 className="text-xl font-semibold">Vibe Designer AI</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="w-full max-w-3xl mx-auto">
                {messages.length === 0 && !isLoading ? (
                    <WelcomeScreen />
                ) : (
                    messages.map((msg, index) => {
                        if (msg.role === 'user' && msg.content) return <UserMessage key={index}>{msg.content}</UserMessage>;
                        if (msg.role === 'assistant' && msg.content) {
                            return (
                            <AssistantMessage key={index}>{msg.content}
                                {msg.agent_used && msg.structured_data && <ExpertOutputDisplay agentName={msg.agent_used} data={msg.structured_data} />}
                            </AssistantMessage>
                            );
                        }
                        return null;
                    })
                )}
                {isLoading && messages.length > 0 && <div className="flex justify-start"><div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-2xl rounded-bl-none shadow-sm animate-pulse">...thinking</div></div>}
                <div ref={bottomOfChatRef}></div>
            </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="w-full max-w-3xl mx-auto">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(currentInput); }}>
                    <div className="flex items-end space-x-2">
                    <Textarea value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} placeholder="Describe your app idea..." className="flex-grow rounded-lg px-4 py-2 resize-none bg-gray-100 dark:bg-gray-700" rows={1}/>
                    <div className="flex flex-col space-y-1"><label className="text-xs text-gray-500 dark:text-gray-400">Debug:</label><Select onValueChange={(value) => setForcedAgent(value as string)} value={forcedAgent || "none"}><SelectTrigger className="w-[180px] h-10 bg-white dark:bg-gray-700"><SelectValue placeholder="Auto" /></SelectTrigger><SelectContent className="bg-white dark:bg-gray-700"><SelectItem value="none">Auto</SelectItem>{agentList.map(agent => <SelectItem key={agent} value={agent}>{agent}</SelectItem>)}</SelectContent></Select></div>
                    <Button type="submit" className="rounded-lg h-10 w-16 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>Send</Button>
                    </div>
                </form>
            </div>
        </div>
      </main>

      {/* --- DIALOGS --- */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}><DialogContent><DialogHeader><DialogTitle>Rename Chat</DialogTitle></DialogHeader><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Enter new title..." /><DialogFooter><Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button><Button onClick={handleRename}>Rename</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><DialogContent><DialogHeader><DialogTitle>Are you sure?</DialogTitle></DialogHeader><p>This action cannot be undone. This will permanently delete this chat.</p><DialogFooter><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={isAgentManagerOpen} onOpenChange={setIsAgentManagerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agent Manager</DialogTitle>
            <DialogDescription>
              Here you can view and edit the system prompts for your team of AI agents.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto p-2">
            {agents.map((agent) => (
              <div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold">{agent.name !== "Unnamed Agent" ? agent.name : agent.agentId}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 truncate">{agent.system_prompt}</p>
                </div>
                <Button variant="outline" size="icon" className="ml-4 flex-shrink-0" onClick={() => handleEditAgent(agent)}>
                  <FilePenLine className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAgentManagerOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditAgentOpen} onOpenChange={setIsEditAgentOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Agent: {currentAgent?.name !== "Unnamed Agent" ? currentAgent?.name : currentAgent?.agentId}</DialogTitle>
            <DialogDescription>
              Modify the system prompt below. This will change the agent's core behavior.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="h-96 text-sm font-mono bg-gray-50 dark:bg-gray-900"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAgentOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAgent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}