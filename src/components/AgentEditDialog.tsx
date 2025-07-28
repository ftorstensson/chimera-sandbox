// src/components/AgentEditDialog.tsx
// v4.0 - Implements rendered markdown preview for System Prompt

"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Agent } from "@/components/AppLayout";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Edit } from 'lucide-react';

export interface AgentEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  agentToEdit: Agent | null;
  onSave: (agentData: { name: string; system_prompt: string }) => Promise<void>;
  onDelete: (agent: Agent) => void;
}

export function AgentEditDialog({ isOpen, onOpenChange, agentToEdit, onSave, onDelete }: AgentEditDialogProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  const isNewAgent = !agentToEdit?.agentId;

  useEffect(() => {
    if (agentToEdit) {
      setName(agentToEdit.name);
      setPrompt(agentToEdit.system_prompt);
      // For new agents, start in edit mode. For existing, start in view mode.
      setIsEditingPrompt(isNewAgent);
    } else {
      setName("");
      setPrompt("");
      setIsEditingPrompt(true);
    }
  }, [agentToEdit, isNewAgent]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ name, system_prompt: prompt });
    setIsSaving(false);
  };

  const handleDelete = () => {
    if (agentToEdit) {
        onDelete(agentToEdit);
    }
  };

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
            <label className="text-right pt-2">System Prompt</label>
            <div className="col-span-3 border rounded-md p-3 min-h-[200px] bg-background">
              {isEditingPrompt || isNewAgent ? (
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full !p-0 !border-0 !ring-0 !outline-none resize-none"
                  placeholder="Enter system prompt (supports Markdown)..."
                />
              ) : (
                <div className="relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={() => setIsEditingPrompt(true)}
                  >
                    <Edit size={14} />
                  </Button>
                  <div className="prose dark:prose-invert max-w-none text-sm text-foreground/90">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {prompt}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
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