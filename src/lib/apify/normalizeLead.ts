export type NormalizedLead = {
    linkedin_url: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    headline: string | null;
    location: string | null;
    company_name: string | null;
    job_title: string | null;
    email: string | null;
    industry: string | null;
    enrichment_data: Record<string, unknown>;
    campaign_id: string | null;
};

/**
 * Normalizes raw Apify actor output into the leads table schema.
 * Handles field name variations across different actor output formats,
 * including the IoSHqwTR9YGhzccez contact database actor.
 */
export function normalizeLead(
    raw: Record<string, unknown>,
    campaignId: string | null,
    searchIndustry?: string | null,
): NormalizedLead | null {
    const linkedinUrl =
        (raw.linkedin_url as string) ??
        (raw.linkedInUrl as string) ??
        (raw.linkedin as string) ??
        (raw.profileUrl as string) ??
        (raw.url as string) ??
        (raw.person_linkedin_url as string) ??
        '';

    // Require either a linkedin URL or an email to save the lead
    const email = (raw.email as string) ?? (raw.contact_email as string) ?? null;
    if (!linkedinUrl && !email) return null;

    const firstName =
        (raw.first_name as string) ??
        (raw.firstName as string) ??
        (raw.contact_first_name as string) ??
        null;
    const lastName =
        (raw.last_name as string) ??
        (raw.lastName as string) ??
        (raw.contact_last_name as string) ??
        null;
    const fullName =
        (raw.full_name as string) ??
        (raw.fullName as string) ??
        (raw.name as string) ??
        (raw.contact_name as string) ??
        ([firstName, lastName].filter(Boolean).join(' ') || null);

    return {
        linkedin_url: linkedinUrl || `apify:${email}`,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        headline:
            (raw.headline as string) ??
            (raw.title as string) ??
            (raw.contact_title as string) ??
            null,
        location:
            (raw.location as string) ??
            (raw.contact_location as string) ??
            (raw.addressLocality as string) ??
            (raw.city as string) ??
            null,
        company_name:
            (raw.company_name as string) ??
            (raw.companyName as string) ??
            (raw.company as string) ??
            (raw.organization_name as string) ??
            null,
        job_title:
            (raw.job_title as string) ??
            (raw.jobTitle as string) ??
            (raw.position as string) ??
            (raw.contact_title as string) ??
            (raw.title as string) ??
            null,
        email,
        industry:
            (raw.company_industry as string) ??
            (raw.industry as string) ??
            (raw.companyIndustry as string) ??
            searchIndustry ??
            null,
        enrichment_data: raw,
        campaign_id: campaignId,
    };
}
