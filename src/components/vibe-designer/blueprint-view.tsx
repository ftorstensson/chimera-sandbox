"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GenerateAppBlueprintOutput } from "@/ai/flows/generate-app-blueprint";
import { Lightbulb, Users, Target } from "lucide-react";

const FeedbackSchema = z.object({
  feedback: z.string().min(10, {
    message: "Please provide at least 10 characters of feedback.",
  }),
});

type BlueprintViewProps = {
  blueprint: GenerateAppBlueprintOutput;
  appIdea: string;
  onRevise: (data: z.infer<typeof FeedbackSchema>) => void;
  onStartOver: () => void;
};

export function BlueprintView({ blueprint, appIdea, onRevise, onStartOver }: BlueprintViewProps) {
  const form = useForm<z.infer<typeof FeedbackSchema>>({
    resolver: zodResolver(FeedbackSchema),
    defaultValues: {
      feedback: "",
    },
  });

  const { isSubmitting } = form.formState;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="text-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">App Blueprint</h1>
        <p className="mt-2 text-muted-foreground">Based on your idea: "{appIdea}"</p>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><Target className="text-primary"/> Core Problem</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">{blueprint.coreProblem}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><Lightbulb className="text-primary"/> Key Features</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-muted-foreground">{blueprint.keyFeatures}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><Users className="text-primary"/> Target User</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">{blueprint.targetUser}</CardContent>
        </Card>
      </div>

      <div>
        <h2 className="font-headline text-2xl font-bold text-center">Revise the Plan?</h2>
        <p className="mt-2 text-center text-muted-foreground">
          Suggest changes or additions to refine your app blueprint.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onRevise)} className="mt-6 w-full space-y-4">
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Let's also add a gamification feature to keep users engaged."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                Revise Blueprint ✍️
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={onStartOver} className="flex-1">
                Start Over
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
