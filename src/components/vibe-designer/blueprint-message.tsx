"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GenerateAppBlueprintOutput } from "@/ai/schemas";
import { Lightbulb, Users, Target } from "lucide-react";

type BlueprintMessageProps = {
  blueprint: GenerateAppBlueprintOutput;
};

export function BlueprintMessage({ blueprint }: BlueprintMessageProps) {
  return (
    <div className="space-y-4 text-sm w-full">
        <p className="font-semibold mb-4">Here's the plan based on our conversation:</p>
        <div className="space-y-4">
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold"><Target className="text-primary h-5 w-5"/> Core Problem</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-muted-foreground">{blueprint.coreProblem}</CardContent>
            </Card>
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold"><Lightbulb className="text-primary h-5 w-5"/> Key Features</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 whitespace-pre-wrap text-muted-foreground">{blueprint.keyFeatures}</CardContent>
            </Card>
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold"><Users className="text-primary h-5 w-5"/> Target User</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-muted-foreground">{blueprint.targetUser}</CardContent>
            </Card>
        </div>
        <p className="pt-4 font-medium">What would you like to change or refine next?</p>
    </div>
  );
}
