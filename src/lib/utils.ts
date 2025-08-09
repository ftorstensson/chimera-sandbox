// src/lib/utils.ts
// v3.1 - ROBUST: Guarantees all text properties are strings to prevent [object Object] bug.

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

// Helper to ensure a value is a string, converting objects to JSON string.
function safeStringify(value: any): string | null {
    if (value === null || typeof value === 'undefined') {
        return null;
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
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

    try {
        const parsed = JSON.parse(content);

        if (typeof parsed !== 'object' || parsed === null) {
            return defaultResponse;
        }

        if (parsed.action === 'execute_task' && parsed.holding_message) {
            return {
                action: 'execute_task',
                holding_message: safeStringify(parsed.holding_message),
                task_for_team: safeStringify(parsed.task_for_team),
                text: null,
                actions: null,
            };
        }
        
        if ((parsed.action === 'redirect_to_team_builder' || Array.isArray(parsed.actions)) && (parsed.message || parsed.text)) {
             return {
                action: 'redirect_to_team_builder',
                holding_message: null,
                task_for_team: null,
                text: safeStringify(parsed.message || parsed.text),
                actions: parsed.actions,
            };
        }
        
        return defaultResponse;

    } catch (e) {
        return defaultResponse;
    }
}