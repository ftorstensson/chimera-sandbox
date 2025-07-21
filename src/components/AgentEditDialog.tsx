// src/components/AgentEditDialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Agent } from "@/components/AppLayout";

// Define the props that this component will accept
export interface AgentEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  agentToEdit: Agent | null;
  onSave: (name: string, prompt: string) => Promise<void>;
  onDelete: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
  agentName: string;
  setAgentName: (name: string) => void;
  agentPrompt: string;
  setAgentPrompt: (prompt: string) => void;
}

export function AgentEditDialog({
  isOpen,
  onOpenChange,
  agentToEdit,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  agentName,
  setAgentName,
  agentPrompt,
  setAgentPrompt
}: AgentEditDialogProps) {
  
  const handleSaveClick = () => {
    onSave(agentName, agentPrompt);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{agentToEdit ? 'Edit Agent' : 'Create New Agent'}</DialogTitle>
          <DialogDescription>
            {agentToEdit ? 'Update the details for this agent.' : 'Define the name and core instructions for your new AI agent.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input 
              id="name" 
              value={agentName} 
              onChange={(e) => setAgentName(e.target.value)} 
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="prompt" className="text-right pt-2">System Prompt</Label>
            <Textarea 
              id="prompt" 
              value={agentPrompt} 
              onChange={(e) => setAgentPrompt(e.target.value)} 
              className="col-span-3" 
              rows={8}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <div>
            {agentToEdit && (
              <Button variant="destructive" onClick={onDelete} disabled={isDeleting || isSaving}>
                {isDeleting ? 'Deleting...' : 'Delete Agent'}
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving || isDeleting}>Cancel</Button>
            <Button onClick={handleSaveClick} disabled={isSaving || isDeleting}>
              {isSaving ? 'Saving...' : 'Save Agent'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}