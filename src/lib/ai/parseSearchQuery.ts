import { GoogleGenerativeAI } from '@google/generative-ai';

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

export type ParsedSearchFilters = {
    fetchCount: number;
    jobTitles: string[];
    excludeJobTitles: string[];
    seniorityLevel: string | null;
    functionalLevel: string | null;
    contactLocation: string | null;
    contactCities: string[];
    excludeLocation: string | null;
    excludeCities: string[];
    emailStatus: string[];
    companyDomains: string[];
    companySize: string | null;
    industry: string | null;
    excludeIndustry: string | null;
    companyKeywords: string[];
    excludeCompanyKeywords: string[];
    minRevenue: string | null;
    maxRevenue: string | null;
    funding: string | null;
};

export async function parseSearchQuery(query: string): Promise<ParsedSearchFilters> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a B2B lead search query parser. Convert the user's natural language description into structured search filters for a contact database.

USER QUERY:
"${query}"

AVAILABLE FILTERS (return ONLY valid values from these lists):

seniorityLevel (pick ONE or null):
owner, founder, c_suite, partner, vp, head, director, manager, senior, entry, intern

functionalLevel (pick ONE or null):
accounting, business_development, consulting, education, engineering, finance, human_resources, information_technology, legal, marketing, media, operations, product, sales, support

contactLocation (pick ONE country/region in lowercase or null):
Examples: "united states", "germany", "spain", "united kingdom", "france", "india", "brazil", "mexico", "italy", "canada", "australia", "netherlands", "sweden", "switzerland", "japan", "china", "singapore", etc.

industry (pick ONE or null — use lowercase):
accounting, airlines/aviation, automotive, banking, biotechnology, building materials, computer software, construction, consumer goods, e-learning, education management, electrical/electronic manufacturing, entertainment, environmental services, financial services, food & beverages, health, wellness and fitness, hospital & health care, hospitality, human resources, information technology and services, insurance, internet, legal services, logistics and supply chain, management consulting, marketing and advertising, mechanical or industrial engineering, media production, mining & metals, oil & energy, pharmaceuticals, real estate, retail, staffing and recruiting, telecommunications, transportation/trucking/railroad

companySize (pick ONE or null):
1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001-10000, 10001+

emailStatus (array, defaults to ["validated"]):
validated, guessed, unavailable

funding (pick ONE or null):
seed, angel, venture, series_a, series_b, series_c, series_d, private_equity, ipo, other

Revenue values (string numbers or null):
0, 1000000, 5000000, 10000000, 25000000, 50000000, 100000000, 250000000, 500000000, 1000000000

RULES:
- Extract as many relevant filters as possible from the query
- jobTitles: array of job title strings the user wants (e.g. ["CEO", "CTO", "Director of Sales"])
- contactCities: array of city names (e.g. ["Madrid", "Barcelona"])
- companyKeywords: array of keywords about the company (e.g. ["SaaS", "fintech"])
- companyDomains: array of specific company domains if mentioned
- fetchCount: number of leads to find. Default 25 unless the user specifies otherwise
- If the user mentions a number of employees/workers, map it to the closest companySize bracket
- All location values must be lowercase for contactLocation
- Return valid JSON only, no markdown, no code fences

Respond with this exact JSON structure:
{"fetchCount":25,"jobTitles":[],"excludeJobTitles":[],"seniorityLevel":null,"functionalLevel":null,"contactLocation":null,"contactCities":[],"excludeLocation":null,"excludeCities":[],"emailStatus":["validated"],"companyDomains":[],"companySize":null,"industry":null,"excludeIndustry":null,"companyKeywords":[],"excludeCompanyKeywords":[],"minRevenue":null,"maxRevenue":null,"funding":null}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned) as ParsedSearchFilters;

    // Ensure defaults
    if (!parsed.emailStatus || parsed.emailStatus.length === 0) {
        parsed.emailStatus = ['validated'];
    }
    if (!parsed.fetchCount || parsed.fetchCount < 1) {
        parsed.fetchCount = 25;
    }

    return parsed;
}
