// src/components/AgentEditDialog.tsx
// v3.0 - Synchronized with page.tsx controller logic and self-contained state

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
  onDelete: (agentId: string) => Promise<void>;
}

export function AgentEditDialog({ isOpen, onOpenChange, agentToEdit, onSave, onDelete }: AgentEditDialogProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // This effect runs when the dialog is opened, populating the form
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
    // Calls the parent `onSave` with the correctly shaped object
    await onSave({ name, system_prompt: prompt });
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (agentToEdit && agentToEdit.agentId) {
        setIsDeleting(true);
        // Calls the parent `onDelete` with the required agentId
        await onDelete(agentToEdit.agentId);
        setIsDeleting(false);
    }
  };
  
  const isNewAgent = !agentToEdit?.agentId;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
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