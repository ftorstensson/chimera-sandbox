// src/components/AgentOutputCard.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function AgentOutputCard({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
  return (
    <Card className="animate-in fade-in-50">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}