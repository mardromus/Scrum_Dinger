import { GoogleGenAI } from "@google/genai";

export async function generateMeetingSummary(transcript: string): Promise<string> {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        return "Error: API key not configured. Please set the API_KEY environment variable.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
              You are an expert at summarizing agile scrum meetings.
              Analyze the following transcript and provide a concise summary.
              The summary should be in Markdown format and include three sections:
              1.  **Key Points**: A bulleted list of the main updates from each participant.
              2.  **Action Items**: A list of any tasks or follow-ups mentioned. Each action item MUST start with "[ ] ". For example: "[ ] Alex to follow up on the API documentation."
              3.  **Blockers**: A bulleted list of any impediments or issues raised.

              If a section has no content, state "None."

              ---
              TRANSCRIPT:
              ---
              ${transcript}
            `,
        });
        
        return result.text;
    } catch (error) {
        console.error("Error generating summary with Gemini:", error);
        return "An error occurred while generating the summary.";
    }
}

export async function generateMemberSummary(memberName: string, updates: string[]): Promise<string> {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        return "Error: API key not configured.";
    }
    if (updates.length === 0) {
        return `No recent updates found for ${memberName}.`;
    }

    const updatesText = updates.join('\n---\n');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
              You are an expert HR analyst and team lead.
              Analyze the following scrum updates for a team member named "${memberName}".
              The updates are from the last 7 days.
              
              Provide a concise summary of their performance and contributions in Markdown format.
              The summary must include these four sections:
              1.  **Key Accomplishments**: A bulleted list of completed tasks and achievements.
              2.  **Stated Goals / Next Steps**: A bulleted list of their planned work.
              3.  **Reported Blockers**: Any impediments they mentioned.
              4.  **Overall Tone Assessment**: A brief analysis of their attitude and sentiment (e.g., positive, motivated, concerned, neutral).

              If a section has no specific information, state "None reported."

              ---
              UPDATES FOR ${memberName}:
              ---
              ${updatesText}
            `,
        });
        
        return result.text;
    } catch (error) {
        console.error("Error generating member summary with Gemini:", error);
        return "An error occurred while generating the member summary.";
    }
}


export async function analyzeBlockerTrends(blockersText: string): Promise<string> {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        return "Error: API key not configured.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
              You are an expert agile coach and project manager.
              Analyze the following list of blockers reported by a team in their daily scrums.
              Identify recurring themes, patterns, and potential root causes.

              Structure your analysis in Markdown format with the following sections:
              1.  **Recurring Blocker Themes**: A bulleted list of the most common categories of blockers (e.g., "Dependency on Other Teams", "Technical Debt", "Unclear Requirements").
              2.  **Detailed Analysis**: For each theme, provide a brief explanation and list specific examples from the provided blockers.
              3.  **Suggested Actions**: Recommend concrete steps the team or scrum master could take to address these recurring issues.

              ---
              LIST OF REPORTED BLOCKERS:
              ---
              ${blockersText}
            `,
        });
        
        return result.text;
    } catch (error) {
        console.error("Error analyzing blockers with Gemini:", error);
        return "An error occurred while analyzing blocker trends.";
    }
}
