import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Lead } from '@/types';

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

type GenerateEmailParams = {
    lead: Pick<Lead, 'full_name' | 'first_name' | 'email' | 'company_name' | 'job_title' | 'headline' | 'location' | 'enrichment_data'>;
    senderName: string;
    senderCompany: string;
    context?: string;
};

type GenerateEmailResult = {
    subject: string;
    bodyHtml: string;
    bodyText: string;
};

export async function generateOutreachEmail(params: GenerateEmailParams): Promise<GenerateEmailResult> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const enrichmentContext = params.lead.enrichment_data
        ? `\nAdditional context about the lead:\n${JSON.stringify(params.lead.enrichment_data, null, 2)}`
        : '';

    const userContext = params.context
        ? `\nAdditional instructions from the sender:\n${params.context}`
        : '';

    const prompt = `You are a professional B2B sales outreach email writer. Write a personalized cold outreach email.

LEAD INFORMATION:
- Name: ${params.lead.full_name ?? params.lead.first_name ?? 'Unknown'}
- Job Title: ${params.lead.job_title ?? 'Unknown'}
- Company: ${params.lead.company_name ?? 'Unknown'}
- Headline: ${params.lead.headline ?? 'N/A'}
- Location: ${params.lead.location ?? 'N/A'}
${enrichmentContext}

SENDER INFORMATION:
- Name: ${params.senderName}
- Company: ${params.senderCompany}
${userContext}

RULES:
- Write a short, personalized subject line (under 60 characters)
- Keep the email body under 150 words
- Reference something specific about the lead's role, company, or background
- Be professional but conversational — not salesy or spammy
- Include a clear, low-friction call to action (e.g., "Would a 15-minute call work?")
- Do NOT use generic templates or filler phrases like "I hope this email finds you well"
- Do NOT use excessive exclamation marks or ALL CAPS
- Sign off with the sender's name

Respond in this exact JSON format (no markdown, no code fences):
{"subject": "...", "bodyText": "...", "bodyHtml": "..."}

For bodyHtml, use simple HTML: <p> tags for paragraphs, <br> for line breaks. No complex styling.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip potential markdown code fences
    const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');

    const parsed = JSON.parse(cleaned) as GenerateEmailResult;

    return {
        subject: parsed.subject,
        bodyHtml: parsed.bodyHtml,
        bodyText: parsed.bodyText,
    };
}

export function isGeminiConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
}
