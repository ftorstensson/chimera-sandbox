"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const AppIdeaSchema = z.object({
  appIdea: z.string().min(20, {
    message: "Please describe your app idea in at least 20 characters.",
  }),
});

type InitialViewProps = {
  onGenerate: (data: z.infer<typeof AppIdeaSchema>) => void;
};

export function InitialView({ onGenerate }: InitialViewProps) {
  const form = useForm<z.infer<typeof AppIdeaSchema>>({
    resolver: zodResolver(AppIdeaSchema),
    defaultValues: {
      appIdea: "",
    },
  });

  const { isSubmitting } = form.formState;

  return (
    <div className="flex flex-col items-center justify-center text-center animate-in fade-in-50 duration-500">
      <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
        Vibe Designer AI
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl">
        Your AI-powered thought partner. Let's build a plan together.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onGenerate)} className="mt-8 w-full space-y-6">
          <FormField
            control={form.control}
            name="appIdea"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="e.g., An AI coach that helps people practice for job interviews"
                    className="min-h-[120px] resize-none rounded-lg border-2 border-border bg-card p-4 text-base shadow-sm focus:border-primary focus:ring-primary"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting}
            className="w-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 hover:bg-accent/90 focus:ring-4 focus:ring-accent/50"
          >
            Start Brainstorming ✨
          </Button>
        </form>
      </Form>
    </div>
  );
}
