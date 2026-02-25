import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { records } = body;

        if (!records || !Array.isArray(records)) {
            return NextResponse.json({ error: "Invalid records provided" }, { status: 400 });
        }

        if (records.length === 0) {
            return NextResponse.json({
                chronicConditions: [],
                riskLevel: "low",
                topMeds: [],
                healthScore: 100,
                suggestions: ["Upload medical records to generate a comprehensive AI summary."]
            });
        }

        const prompt = `
You are an expert medical AI specializing in analyzing health histories from electronic health records.
Analyze the following patient's medical records and provide a JSON response summarizing their health.
You MUST return EXACTLY a raw JSON object string WITH NO MARKDOWN FORMATTING OR BACKTICKS.
Use exactly this schema:
{
  "chronicConditions": string[], // e.g. ["diabetes", "hypertension"]
  "riskLevel": "high" | "medium" | "low", // e.g. "medium"
  "topMeds": [ [string, number] ], // array of tuples of medication names & frequencies. max 5. e.g. [["Aspirin", 2], ["Metformin", 1]]
  "healthScore": number, // vitality score out of 100. Lower it depending on severity of chronic conditions and risks.
  "suggestions": string[] // 3-4 actionable clinical notes or health improvement suggestions
}

Medical Records:
${JSON.stringify(records)}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text || "{}";
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanedText);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: "Failed to generate AI summary: " + error.message }, { status: 500 });
    }
}
