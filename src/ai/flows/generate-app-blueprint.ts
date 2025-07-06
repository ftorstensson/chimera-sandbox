'use server';

/**
 * @fileOverview An AI agent that generates an app blueprint from an app idea.
 *
 * - generateAppBlueprint - A function that handles the app blueprint generation process.
 * - GenerateAppBlueprintInput - The input type for the generateAppBlueprint function.
 * - GenerateAppBlueprintOutput - The return type for the generateAppBlueprint function.
 */

import {ai} from '@/ai/genkit';
import { GenerateAppBlueprintInputSchema, GenerateAppBlueprintOutputSchema } from '@/ai/schemas';
import type { GenerateAppBlueprintInput, GenerateAppBlueprintOutput } from '@/ai/schemas';

export type { GenerateAppBlueprintInput, GenerateAppBlueprintOutput };

export async function generateAppBlueprint(input: GenerateAppBlueprintInput): Promise<GenerateAppBlueprintOutput> {
  return generateAppBlueprintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAppBlueprintPrompt',
  input: {schema: GenerateAppBlueprintInputSchema},
  output: {schema: GenerateAppBlueprintOutputSchema},
  prompt: `You are an AI assistant that helps brainstorm app ideas. The user will provide an app idea, and you will generate a structured app blueprint with Core Problem, Key Features, and Target User.

App Idea: {{{appIdea}}}

Here is the App Blueprint:
Core Problem:
Key Features:
Target User:`,
});

const generateAppBlueprintFlow = ai.defineFlow(
  {
    name: 'generateAppBlueprintFlow',
    inputSchema: GenerateAppBlueprintInputSchema,
    outputSchema: GenerateAppBlueprintOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
