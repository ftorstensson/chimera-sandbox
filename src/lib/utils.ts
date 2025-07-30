// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ParsedAssistantResponse {
  action: 'execute_task' | 'redirect_to_team_builder' | 'conversational' | 'unknown';
  holding_message: string | null;
  task_for_team: string | null;
  text: string | null;
  actions: { id: string; text: string; isPrimary?: boolean }[] | null;
}

export function parseAssistantResponse(content: string): ParsedAssistantResponse {
    const defaultResponse: ParsedAssistantResponse = {
        action: 'conversational',
        holding_message: null,
        task_for_team: null,
        text: content,
        actions: null,
    };

    if (!content) {
        return { ...defaultResponse, action: 'unknown' };
    }

    // Attempt to find a JSON block first
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;

    try {
        const parsed = JSON.parse(jsonString);

        if (typeof parsed !== 'object' || parsed === null) {
            return defaultResponse;
        }

        if (parsed.action === 'execute_task' && parsed.holding_message && parsed.task_for_team) {
            return {
                action: 'execute_task',
                holding_message: parsed.holding_message,
                task_for_team: parsed.task_for_team,
                text: null,
                actions: null,
            };
        }
        
        if (parsed.action === 'redirect_to_team_builder' && parsed.message && Array.isArray(parsed.actions)) {
             return {
                action: 'redirect_to_team_builder',
                holding_message: null,
                task_for_team: null,
                text: parsed.message,
                actions: parsed.actions,
            };
        }
        
         if (parsed.text && Array.isArray(parsed.actions)) {
            return {
                action: 'redirect_to_team_builder', // Treat this as a generic action as well
                holding_message: null,
                task_for_team: null,
                text: parsed.text,
                actions: parsed.actions,
            };
        }

        // If it's valid JSON but doesn't match a known action structure, return as conversational
        return defaultResponse;

    } catch (e) {
        // If parsing fails, it's just a regular string message
        return defaultResponse;
    }
}