// src/components/AgentEditDialog.tsx
// v3.1 - Modified to trigger confirmation dialog on delete

"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Agent } from "@/components/AppLayout";

export interface AgentEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  agentToEdit: Agent | null;
  onSave: (agentData: { name: string; system_prompt: string }) => Promise<void>;
  onDelete: (agent: Agent) => void; // MODIFIED: This now passes the full agent object
}

export function AgentEditDialog({ isOpen, onOpenChange, agentToEdit, onSave, onDelete }: AgentEditDialogProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (agentToEdit) {
      setName(agentToEdit.name);
      setPrompt(agentToEdit.system_prompt);
    } else {
      setName("");
      setPrompt("");
    }
  }, [agentToEdit]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ name, system_prompt: prompt });
    setIsSaving(false);
  };

  // MODIFIED: This function now just calls the parent onDelete with the agent object
  const handleDelete = () => {
    if (agentToEdit) {
        onDelete(agentToEdit);
    }
  };
  
  const isNewAgent = !agentToEdit?.agentId;

  return (
    <Dialog open={isOpen} onOpen-change={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isNewAgent ? "Create New Agent" : "Edit Agent"}</DialogTitle>
          <DialogDescription>
            Define the agent's name and its core instructions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">Name</label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <label htmlFor="prompt" className="text-right pt-2">System Prompt</label>
            <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="col-span-3 min-h-[200px]" />
          </div>
        </div>
        <DialogFooter className="flex justify-between w-full">
            <div>
                {!isNewAgent && (
                    <Button variant="destructive" onClick={handleDelete}>
                        Delete
                    </Button>
                )}
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}