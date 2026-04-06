import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';
import {
    runApifyActor,
    waitForActorRun,
    fetchDatasetItems,
    normalizeLead,
    type NormalizedLead,
} from '@/lib/apify';

const scrapeSchema = z.object({
    campaignId: z.uuid().nullable().optional(),
    fetchCount: z.number().int().min(1).max(100_000).optional().default(10),
    fileName: z.string().max(200).optional().default('Prospects'),
    jobTitles: z.array(z.string().max(200)).optional().default([]),
    excludeJobTitles: z.array(z.string().max(200)).optional().default([]),
    seniorityLevel: z.array(z.string().max(100)).optional().default([]),
    functionalLevel: z.array(z.string().max(100)).optional().default([]),
    contactLocation: z.array(z.string().max(200)).optional().default([]),
    contactCities: z.array(z.string().max(200)).optional().default([]),
    excludeLocation: z.array(z.string().max(200)).optional().default([]),
    excludeCities: z.array(z.string().max(200)).optional().default([]),
    emailStatus: z.array(z.string().max(50)).optional().default(['validated']),
    companyDomains: z.array(z.string().max(300)).optional().default([]),
    companySize: z.array(z.string().max(100)).optional().default([]),
    industry: z.array(z.string().max(200)).optional().default([]),
    excludeIndustry: z.array(z.string().max(200)).optional().default([]),
    companyKeywords: z.array(z.string().max(200)).optional().default([]),
    excludeCompanyKeywords: z.array(z.string().max(200)).optional().default([]),
    minRevenue: z.string().max(50).nullable().optional(),
    maxRevenue: z.string().max(50).nullable().optional(),
    funding: z.array(z.string().max(100)).optional().default([]),
});

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const body = await request.json();
        const parsed = scrapeSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        const {
            campaignId = null,
            fetchCount,
            fileName,
            jobTitles,
            excludeJobTitles,
            seniorityLevel,
            functionalLevel,
            contactLocation,
            contactCities,
            excludeLocation,
            excludeCities,
            emailStatus,
            companyDomains,
            companySize,
            industry,
            excludeIndustry,
            companyKeywords,
            excludeCompanyKeywords,
            minRevenue = null,
            maxRevenue = null,
            funding,
        } = parsed.data;

        const hasFilter = jobTitles.length > 0 || contactLocation.length > 0 || contactCities.length > 0
            || industry.length > 0 || companyDomains.length > 0 || companyKeywords.length > 0
            || seniorityLevel.length > 0 || functionalLevel.length > 0;

        if (!hasFilter) {
            return NextResponse.json(
                { error: 'Provide at least one search filter' },
                { status: 400 },
            );
        }

        // If campaignId is provided, verify it belongs to the user
        if (campaignId) {
            const { data: campaign } = await supabase
                .from('campaigns')
                .select('id')
                .eq('id', campaignId)
                .eq('user_id', user.id)
                .single();

            if (!campaign) {
                return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
            }
        }

        // Build actor input — convert empty arrays to null so they're stripped
        const toNullableArr = (arr: string[]) => arr.length > 0 ? arr : null;
        const toArr = (val: string | null) => val ? [val] : null;

        const rawInput: Record<string, unknown> = {
            fetch_count: fetchCount,
            file_name: fileName,
            contact_job_title: toNullableArr(jobTitles),
            contact_not_job_title: toNullableArr(excludeJobTitles),
            seniority_level: toNullableArr(seniorityLevel),
            functional_level: toNullableArr(functionalLevel),
            contact_location: toNullableArr(contactLocation),
            contact_city: toNullableArr(contactCities),
            contact_not_location: toNullableArr(excludeLocation),
            contact_not_city: toNullableArr(excludeCities),
            email_status: emailStatus,
            company_domain: toNullableArr(companyDomains),
            size: toNullableArr(companySize),
            company_industry: toNullableArr(industry),
            company_not_industry: toNullableArr(excludeIndustry),
            company_keywords: toNullableArr(companyKeywords),
            company_not_keywords: toNullableArr(excludeCompanyKeywords),
            min_revenue: toArr(minRevenue),
            max_revenue: toArr(maxRevenue),
            funding: toNullableArr(funding),
        };

        const actorInput: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(rawInput)) {
            if (value !== null && value !== undefined) {
                actorInput[key] = value;
            }
        }

        // Trigger the Apify Actor
        const { runId, datasetId: initialDatasetId } = await runApifyActor(actorInput);

        // Log the run
        await supabase.from('runs').insert({
            campaign_id: campaignId,
            apify_run_id: runId,
            leads_processed: 0,
            status: 'started',
            user_id: user.id,
        });

        // Wait for Actor to finish
        const { datasetId } = await waitForActorRun(runId);

        // Fetch dataset results
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

        // Normalize and insert
        const leads = rawItems
            .map((item) => normalizeLead(item, campaignId, industry[0] ?? null))
            .filter((lead): lead is NormalizedLead => lead !== null)
            .map(lead => ({ ...lead, user_id: user.id }));

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

        // Update run log
        await supabase
            .from('runs')
            .update({
                status: 'success',
                leads_processed: savedLeads?.length ?? 0,
            })
            .eq('apify_run_id', runId);

        return NextResponse.json({
            message: `Successfully scraped and saved ${savedLeads?.length ?? 0} leads`,
            runId,
            leads: savedLeads ?? [],
        });
    } catch (err) {
        console.error('Run scraper error:', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
