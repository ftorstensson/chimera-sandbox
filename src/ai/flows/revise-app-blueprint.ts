'use server';

/**
 * @fileOverview A flow that revises an app blueprint based on user feedback.
 *
 * - reviseAppBlueprint - A function that revises the app blueprint based on user feedback.
 * - ReviseAppBlueprintInput - The input type for the reviseAppBlueprint function.
 * - ReviseAppBlueprintOutput - The return type for the reviseAppBlueprint function.
 */

import {ai} from '@/ai/genkit';
import { ReviseAppBlueprintInputSchema, ReviseAppBlueprintOutputSchema } from '@/ai/schemas';
import type { ReviseAppBlueprintInput, ReviseAppBlueprintOutput } from '@/ai/schemas';

export type { ReviseAppBlueprintInput, ReviseAppBlueprintOutput };

export async function reviseAppBlueprint(
  input: ReviseAppBlueprintInput
): Promise<ReviseAppBlueprintOutput> {
  return reviseAppBlueprintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviseAppBlueprintPrompt',
  input: {schema: ReviseAppBlueprintInputSchema},
  output: {schema: ReviseAppBlueprintOutputSchema},
  prompt: `You are an AI app design assistant. A user has provided an initial app idea, 
you generated an app blueprint, and now the user has provided feedback on that blueprint.
Your job is to revise the entire app blueprint based on the user's feedback, taking the initial app idea and the current blueprint into account.
You MUST return the complete, revised blueprint in the same JSON format as the original.

Initial App Idea: {{{initialAppIdea}}}

Current App Blueprint (JSON):
{{{currentBlueprint}}}

User Feedback: {{{userFeedback}}}

Here is the Revised App Blueprint (JSON):
`,
});

const reviseAppBlueprintFlow = ai.defineFlow(
  {
    name: 'reviseAppBlueprintFlow',
    inputSchema: ReviseAppBlueprintInputSchema,
    outputSchema: ReviseAppBlueprintOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
