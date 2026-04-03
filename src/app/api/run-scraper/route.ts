import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
    runApifyActor,
    waitForActorRun,
    fetchDatasetItems,
    normalizeLead,
    type NormalizedLead,
} from '@/lib/apify';

type ScrapeRequestBody = {
    campaignId?: string | null;
    fetchCount?: number;
    fileName?: string;
    jobTitles?: string[];
    excludeJobTitles?: string[];
    seniorityLevel?: string | null;
    functionalLevel?: string | null;
    contactLocation?: string | null;
    contactCities?: string[];
    excludeLocation?: string | null;
    excludeCities?: string[];
    emailStatus?: string[];
    companyDomains?: string[];
    companySize?: string | null;
    industry?: string | null;
    excludeIndustry?: string | null;
    companyKeywords?: string[];
    excludeCompanyKeywords?: string[];
    minRevenue?: string | null;
    maxRevenue?: string | null;
    funding?: string | null;
};

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ScrapeRequestBody;

        const {
            campaignId = null,
            fetchCount = 10,
            fileName = 'Prospects',
            jobTitles = [],
            excludeJobTitles = [],
            seniorityLevel = null,
            functionalLevel = null,
            contactLocation = null,
            contactCities = [],
            excludeLocation = null,
            excludeCities = [],
            emailStatus = ['validated'],
            companyDomains = [],
            companySize = null,
            industry = null,
            excludeIndustry = null,
            companyKeywords = [],
            excludeCompanyKeywords = [],
            minRevenue = null,
            maxRevenue = null,
            funding = null,
        } = body;

        // --- Validate ---
        if (fetchCount < 1 || fetchCount > 100_000) {
            return NextResponse.json(
                { error: 'fetchCount must be between 1 and 100000' },
                { status: 400 },
            );
        }

        const hasFilter = jobTitles.length > 0 || contactLocation || contactCities.length > 0
            || industry || companyDomains.length > 0 || companyKeywords.length > 0
            || seniorityLevel || functionalLevel;

        if (!hasFilter) {
            return NextResponse.json(
                { error: 'Provide at least one search filter' },
                { status: 400 },
            );
        }

        const supabase = createServerClient();

        // --- 1. Build actor input matching IoSHqwTR9YGhzccez schema ---
        const toNullableArr = (arr: string[]) => arr.length > 0 ? arr : null;

        // Helper: wrap a single string into a single-element array for the actor
        const toArr = (val: string | null) => val ? [val] : null;

        // Build input, omitting null/undefined values so the actor doesn't receive invalid fields
        const rawInput: Record<string, unknown> = {
            fetch_count: fetchCount,
            file_name: fileName,
            contact_job_title: toNullableArr(jobTitles),
            contact_not_job_title: toNullableArr(excludeJobTitles),
            seniority_level: toArr(seniorityLevel),
            functional_level: toArr(functionalLevel),
            contact_location: toArr(contactLocation),
            contact_city: toNullableArr(contactCities),
            contact_not_location: toArr(excludeLocation),
            contact_not_city: toNullableArr(excludeCities),
            email_status: emailStatus,
            company_domain: toNullableArr(companyDomains),
            size: toArr(companySize),
            company_industry: toArr(industry),
            company_not_industry: toArr(excludeIndustry),
            company_keywords: toNullableArr(companyKeywords),
            company_not_keywords: toNullableArr(excludeCompanyKeywords),
            min_revenue: toArr(minRevenue),
            max_revenue: toArr(maxRevenue),
            funding: toArr(funding),
        };

        // Strip null/undefined values — the actor rejects null for array fields
        const actorInput: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(rawInput)) {
            if (value !== null && value !== undefined) {
                actorInput[key] = value;
            }
        }

        // --- 2. Trigger the Apify Actor ---
        const { runId, datasetId: initialDatasetId } = await runApifyActor(actorInput);

        // Log the run as started
        await supabase.from('runs').insert({
            campaign_id: campaignId,
            apify_run_id: runId,
            leads_processed: 0,
            status: 'started',
        });

        // --- 3. Wait for Actor to finish ---
        const { datasetId } = await waitForActorRun(runId);

        // --- 4. Fetch dataset results ---
        const rawItems = await fetchDatasetItems(datasetId ?? initialDatasetId);

        if (rawItems.length === 0) {
            await supabase
                .from('runs')
                .update({ status: 'success', leads_processed: 0 })
                .eq('apify_run_id', runId);

            return NextResponse.json({
                message: 'Actor completed but returned no results',
                runId,
                leads: [],
            });
        }

        // --- 5. Normalize and insert into Supabase ---
        const leads = rawItems
            .map((item) => normalizeLead(item, campaignId, industry))
            .filter((lead): lead is NormalizedLead => lead !== null);

        const { data: savedLeads, error: insertError } = await supabase
            .from('leads')
            .upsert(leads, { onConflict: 'linkedin_url' })
            .select();

        if (insertError) {
            console.error('Error inserting leads:', insertError);

            await supabase
                .from('runs')
                .update({ status: 'failed', leads_processed: 0 })
                .eq('apify_run_id', runId);

            return NextResponse.json(
                { error: 'Failed to save leads to database' },
                { status: 500 },
            );
        }

        // --- 6. Update run log ---
        await supabase
            .from('runs')
            .update({
                status: 'success',
                leads_processed: savedLeads?.length ?? 0,
            })
            .eq('apify_run_id', runId);

        // --- 7. Return results ---
        return NextResponse.json({
            message: `Successfully scraped and saved ${savedLeads?.length ?? 0} leads`,
            runId,
            leads: savedLeads ?? [],
        });
    } catch (err) {
        console.error('Run scraper error:', err);

        const message =
            err instanceof Error ? err.message : 'Internal server error';

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
