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
    seniorityLevel: z.string().max(100).nullable().optional(),
    functionalLevel: z.string().max(100).nullable().optional(),
    contactLocation: z.string().max(200).nullable().optional(),
    contactCities: z.array(z.string().max(200)).optional().default([]),
    excludeLocation: z.string().max(200).nullable().optional(),
    excludeCities: z.array(z.string().max(200)).optional().default([]),
    emailStatus: z.array(z.string().max(50)).optional().default(['validated']),
    companyDomains: z.array(z.string().max(300)).optional().default([]),
    companySize: z.string().max(100).nullable().optional(),
    industry: z.string().max(200).nullable().optional(),
    excludeIndustry: z.string().max(200).nullable().optional(),
    companyKeywords: z.array(z.string().max(200)).optional().default([]),
    excludeCompanyKeywords: z.array(z.string().max(200)).optional().default([]),
    minRevenue: z.string().max(50).nullable().optional(),
    maxRevenue: z.string().max(50).nullable().optional(),
    funding: z.string().max(100).nullable().optional(),
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
            seniorityLevel = null,
            functionalLevel = null,
            contactLocation = null,
            contactCities,
            excludeLocation = null,
            excludeCities,
            emailStatus,
            companyDomains,
            companySize = null,
            industry = null,
            excludeIndustry = null,
            companyKeywords,
            excludeCompanyKeywords,
            minRevenue = null,
            maxRevenue = null,
            funding = null,
        } = parsed.data;

        const hasFilter = jobTitles.length > 0 || contactLocation || contactCities.length > 0
            || industry || companyDomains.length > 0 || companyKeywords.length > 0
            || seniorityLevel || functionalLevel;

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

        // Build actor input
        const toNullableArr = (arr: string[]) => arr.length > 0 ? arr : null;
        const toArr = (val: string | null) => val ? [val] : null;

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
            .map((item) => normalizeLead(item, campaignId, industry))
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
