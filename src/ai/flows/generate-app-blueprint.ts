'use server';

/**
 * @fileOverview An AI agent that generates an app blueprint from an app idea.
 *
 * - generateAppBlueprint - A function that handles the app blueprint generation process.
 * - GenerateAppBlueprintInput - The input type for the generateAppBlueprint function.
 * - GenerateAppBlueprintOutput - The return type for the generateAppBlueprint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAppBlueprintInputSchema = z.object({
  appIdea: z.string().describe('The user inputted idea for an app.'),
});
export type GenerateAppBlueprintInput = z.infer<typeof GenerateAppBlueprintInputSchema>;

const GenerateAppBlueprintOutputSchema = z.object({
  coreProblem: z.string().describe('The core problem that the app solves.'),
  keyFeatures: z.string().describe('The key features of the app.'),
  targetUser: z.string().describe('The target user for the app.'),
});
export type GenerateAppBlueprintOutput = z.infer<typeof GenerateAppBlueprintOutputSchema>;

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
