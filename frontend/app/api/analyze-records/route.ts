import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { records, patientInfo } = body;

        if (!records || !Array.isArray(records)) {
            return NextResponse.json({ error: "Invalid records provided" }, { status: 400 });
        }

        if (records.length === 0) {
            return NextResponse.json({
                clinicalBrief: "No medical records available for this patient yet.",
                healthScore: 100,
                riskLevel: "low",
                chronicConditions: [],
                surgeries: [],
                importantTreatments: [],
                rankedRecords: [],
                topMeds: [],
                suggestions: ["Upload medical records to generate a comprehensive clinical AI summary."],
                treatmentHistory: [],
                essentialFindings: [],
                predictiveRisks: {
                    diabetes: 0,
                    cardiac: 0,
                    kidney: 0,
                    riskContext: "Insufficient data to assess future health risks."
                }
            });
        }

        const prompt = `
You are a senior clinical AI assistant helping a treating doctor understand a patient's complete medical history.
Analyze the following patient medical records thoroughly and return a structured JSON summary optimized for clinical decision-making.

The doctor needs:
1. A quick clinical brief to understand the patient at a glance
2. Any surgeries or major procedures the patient has undergone
3. The most clinically important treatments ranked by severity/urgency
4. All records ranked from most to least clinically important
5. Chronic conditions, risk scores, and actionable recommendations

YOU MUST return ONLY raw valid JSON with NO markdown, NO backticks, NO explanations outside JSON.

Return exactly this schema:
{
  "clinicalBrief": string,  // 2-3 sentence executive summary of the patient's health status for the doctor. Include key conditions, major history, and current risk level.

  "healthScore": number,    // Overall vitality score 0-100. Heavily reduce for surgeries, chronic conditions, high risk records.

  "riskLevel": "high" | "medium" | "low",  // Overall patient risk level

  "chronicConditions": string[],  // List of detected chronic/ongoing conditions e.g. ["Type 2 Diabetes", "Hypertension"]

  "surgeries": [            // All surgeries or major procedures detected. Empty array if none.
    {
      "name": string,       // Name of surgery/procedure e.g. "Appendectomy", "Coronary Bypass"
      "date": string,       // Date or approximate period e.g. "March 2023"
      "hospital": string,   // Hospital name if available
      "notes": string       // Brief clinical note about the surgery/outcome
    }
  ],

  "importantTreatments": [  // Top 5 most clinically significant treatments, ranked by importance (most critical first)
    {
      "rank": number,       // 1 = most important
      "treatment": string,  // Treatment name/description
      "date": string,
      "reason": string,     // WHY this treatment is clinically important
      "severity": "critical" | "high" | "moderate" | "routine"
    }
  ],

  "rankedRecords": [        // ALL records re-ranked from most to least clinically important
    {
      "recordId": number,   // The original record id from the records array
      "visitDate": string,
      "diagnosis": string,
      "hospital": string,
      "importanceScore": number,   // 1-10 where 10 = most important/critical
      "importanceReason": string,  // Why this record ranks at this importance level
      "severityTag": "emergency" | "surgical" | "critical" | "chronic" | "moderate" | "routine",
      "prescription": string
    }
  ],

  "topMeds": [[string, number]],  // [[medicationName, frequency]] - top 5 most prescribed medications

  "essentialFindings": string[],  // 4-5 bullet points: key clinical events, allergy alerts, surgery outcomes, lifestyle warnings

  "suggestions": string[],        // 4-5 actionable clinical recommendations for the treating doctor

  "treatmentHistory": [           // Chronological treatment timeline (oldest first)
    {
      "date": string,
      "treatment": string,
      "medicines": string[],
      "isSurgery": boolean
    }
  ],

  "predictiveRisks": {
    "diabetes": number,   // 0-100 probability %
    "cardiac": number,    // 0-100 probability %
    "kidney": number,     // 0-100 probability %
    "riskContext": string // Concise summary of the highest risk factor with supporting evidence from records
  }
}

Patient Medical Records:
${JSON.stringify(records, null, 2)}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
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
