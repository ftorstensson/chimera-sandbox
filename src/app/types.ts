// src/app/types.ts

export interface Persona {
    name: string;
    age: number;
    role: string;
    pains: string[];
    goals: string[];
  }
  
  export interface GuideOutput {
    ProblemSummary: string;
    UserStory: string;
    DreamOutcome: string;
    HeroExperienceNarrative: string;
    OptionalAppAnalogues: string[];
  }
  
  export interface InsightOutput {
    Personas: Persona[];
    JobsToBeDone: string[];
    CompetitorLandscape: string[];
    InsightSummary: string;
  }
  
  export interface JourneyOutput {
    UserJourneySteps: string[];
    ScreenMap: Record<string, string>;
    Components: string[];
    UXTips: string[];
  }
  
  export interface ArchitectOutput {
    FirestoreSchema: Record<string, any>;
    AuthenticationSetup: string;
    TriggerLogic: string[];
    SecurityRulesTips: string[];
  }
  
  export interface AiCompanionOutput {
    AIUseCases: string[];
    AIRoleCard: {
      name: string;
      description: string;
      tone: string;
    };
    PromptTemplates: string[];
    IntegrationNotes: string;
  }
  
  export interface MvpOutput {
    MVPChecklist: string[];
    DeferredFeatures: string[];
    RisksOrDependencies: string[];
    BuildSequence: string[];
  }
  
  // This is the top-level structure of our entire project plan.
  // The '?' makes each part optional, which is perfect for our step-by-step process.
  export interface ProjectPlan {
    guide?: GuideOutput;
    insight?: InsightOutput;
    journey?: JourneyOutput;
    architect?: ArchitectOutput;
    ai_companion?: AiCompanionOutput;
    mvp?: MvpOutput;
  }