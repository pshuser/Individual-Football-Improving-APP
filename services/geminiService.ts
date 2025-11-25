import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { Drill, TrainingPlan, TacticalScenario, VideoAnalysisResult, Language } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- Schemas ---

const DRILL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    category: { type: Type.STRING, enum: ['Technical', 'Physical', 'Tactical', 'Mental'] },
    difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced', 'Pro'] },
    duration: { type: Type.STRING },
    description: { type: Type.STRING },
    equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
    reps: { type: Type.STRING, description: "Suggested sets and reps, e.g., '3 sets of 12'" }
  },
  required: ['title', 'category', 'difficulty', 'duration', 'description', 'equipment', 'reps']
};

const TRAINING_PLAN_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    level: { type: Type.STRING },
    weeklySchedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayName: { type: Type.STRING, description: "e.g., Day 1, Tuesday" },
          focus: { type: Type.STRING },
          drills: {
            type: Type.ARRAY,
            items: DRILL_SCHEMA
          }
        },
        required: ['dayName', 'focus', 'drills']
      }
    }
  },
  required: ['title', 'level', 'weeklySchedule']
};

const TACTICAL_SCENARIO_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    situation: { type: Type.STRING, description: "Description of the tactical situation on the pitch" },
    formation: { type: Type.STRING, description: "Relevant formations involved" },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING, description: "A decision the player can make" }
        },
        required: ['id', 'text']
      }
    }
  },
  required: ['title', 'situation', 'formation', 'options']
};

const VIDEO_ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    actionType: { type: Type.STRING, description: "e.g., Shooting, Dribbling" },
    techniqueScore: { type: Type.INTEGER, description: "0-100 score" },
    breakdown: { type: Type.STRING, description: "Analysis of body mechanics" },
    corrections: { type: Type.STRING, description: "Key mistakes and how to fix them" },
    drillRecommendation: { type: Type.STRING, description: "Name of a drill to improve this" }
  },
  required: ['actionType', 'techniqueScore', 'breakdown', 'corrections', 'drillRecommendation']
};

// --- Coach Chat ---

const getCoachSystemInstruction = (lang: Language) => `
You are a world-class football (soccer) coach.
Your goal is to improve the user's "Football IQ".
- Explain complex tactical concepts simply.
- Analyze scenarios users give you.
- Be encouraging but demanding.
- You must reply in ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.
`;

export const createCoachChat = (lang: Language = 'en'): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getCoachSystemInstruction(lang),
      temperature: 0.7,
    }
  });
};

// --- Drill Generators ---

export const generateCustomDrills = async (focusArea: string, level: string, lang: Language): Promise<Drill[]> => {
  try {
    const prompt = `Generate 3 specific football training drills focusing on: "${focusArea}". The user level is: ${level}. Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: DRILL_SCHEMA },
        temperature: 0.5,
      }
    });

    const text = response.text;
    if (!text) return [];
    const rawData = JSON.parse(text);
    return rawData.map((d: any, index: number) => ({ ...d, id: `gen-${Date.now()}-${index}` }));
  } catch (error) {
    console.error("Error generating drills:", error);
    return [];
  }
};

export const generateTrainingPlan = async (level: string, goal: string, daysPerWeek: string, lang: Language): Promise<TrainingPlan | null> => {
  try {
    const prompt = `Create a 1-week football training plan for a ${level} player. 
    Primary Goal: ${goal}. 
    Availability: ${daysPerWeek}. 
    Includes specific drills with sets/reps.
    Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: TRAINING_PLAN_SCHEMA,
      }
    });

    if (!response.text) return null;
    return JSON.parse(response.text) as TrainingPlan;
  } catch (error) {
    console.error("Error generating plan:", error);
    return null;
  }
};

// --- Video Analysis ---

export const analyzeVideoTechnique = async (base64Data: string, mimeType: string, lang: Language): Promise<VideoAnalysisResult | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: `Analyze the football technique shown in this video. Identify the action (Shot, Pass, Dribble). Provide a technical breakdown, key corrections, and a score out of 100. Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.` }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: VIDEO_ANALYSIS_SCHEMA
      }
    });

    if (!response.text) return null;
    return JSON.parse(response.text) as VideoAnalysisResult;
  } catch (error) {
    console.error("Error analyzing video:", error);
    return null;
  }
};

// --- Tactics ---

export const generateTacticalScenario = async (lang: Language): Promise<TacticalScenario | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a challenging football tactical scenario for a player (e.g., 3v2 counter attack, playing out from back under pressure). Provide the situation description and 3 distinct decision options. Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: TACTICAL_SCENARIO_SCHEMA
      }
    });
    if (!response.text) return null;
    return JSON.parse(response.text) as TacticalScenario;
  } catch (error) {
    return null;
  }
};

export const evaluateTacticalDecision = async (scenario: string, decision: string, lang: Language): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Scenario: ${scenario}. 
      Player Decision: ${decision}.
      Analyze this decision. Is it the best option? What are the pros/cons? What would a pro player do? Keep it concise (under 100 words). Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.`,
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    return "Error evaluating decision.";
  }
};