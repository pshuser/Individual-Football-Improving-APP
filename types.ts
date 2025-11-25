export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  DRILLS = 'DRILLS',
  IQ_COACH = 'IQ_COACH',
  ANALYST = 'ANALYST',
  TACTICS = 'TACTICS'
}

export type Language = 'en' | 'zh';

export interface Drill {
  id: string;
  title: string;
  category: 'Technical' | 'Physical' | 'Tactical' | 'Mental';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  duration: string; // e.g., "15 mins"
  description: string;
  equipment: string[];
  reps?: string; // e.g. "3 sets of 10"
}

export interface TrainingDay {
  dayName: string;
  focus: string;
  drills: Drill[];
}

export interface TrainingPlan {
  title: string;
  level: string;
  weeklySchedule: TrainingDay[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface UserStats {
  technical: number;
  physical: number;
  tactical: number;
  mental: number;
  trainingHours: number;
  drillsCompleted: number;
}

export interface TacticalScenario {
  id: string;
  title: string;
  situation: string;
  formation: string;
  options: {
    id: string;
    text: string;
  }[];
}

export interface VideoAnalysisResult {
  actionType: string;
  techniqueScore: number; // 0-100
  breakdown: string;
  corrections: string;
  drillRecommendation: string;
}