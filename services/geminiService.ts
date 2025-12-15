import { GoogleGenAI } from "@google/genai";
import { VideoTask, User } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const generateProjectReport = async (tasks: VideoTask[], users: User[]) => {
  try {
    const ai = getAiClient();
    
    // Prepare data context
    const dataSummary = tasks.map(t => {
      const assignee = users.find(u => u.id === t.assigneeId)?.name || "Unassigned";
      const annotationCount = t.annotations.length;
      const hours = Math.floor(t.timeSpentSeconds / 3600);
      const minutes = Math.floor((t.timeSpentSeconds % 3600) / 60);
      
      return `
      - Video: "${t.title}"
      - Assignee: ${assignee}
      - Status: ${t.status}
      - Time Spent: ${hours}h ${minutes}m
      - Annotations Count: ${annotationCount}
      - Sample Annotation: ${t.annotations[0]?.description || "None"}
      `;
    }).join("\n");

    const prompt = `
      You are a Project Manager Assistant. 
      Analyze the following video annotation project data and generate a concise textual report (Markdown).
      
      Focus on:
      1. Productivity summary (who spent how much time).
      2. Project completion status.
      3. Any anomalies (e.g., lots of time spent but few annotations).
      
      Data:
      ${dataSummary}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating report. Please check your API key.";
  }
};

export const cleanupAnnotationText = async (text: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Fix grammar and standardize this video annotation text to be professional and concise: "${text}"`,
        });
        return response.text.trim();
    } catch (e) {
        return text;
    }
}
