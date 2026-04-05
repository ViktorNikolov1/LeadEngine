import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

type ParsedLead = {
    linkedin_url: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    headline: string | null;
    location: string | null;
    company_name: string | null;
    company_domain: string | null;
    job_title: string | null;
    industry: string | null;
    source: string;
    campaign_id: string | null;
    user_id: string;
};

// Map common CSV header variations to our schema fields
const COLUMN_MAP: Record<string, keyof Omit<ParsedLead, 'source' | 'campaign_id' | 'user_id'>> = {
    // LinkedIn URL
    'linkedin_url': 'linkedin_url',
    'linkedin url': 'linkedin_url',
    'linkedin': 'linkedin_url',
    'linkedin profile': 'linkedin_url',
    'linkedin link': 'linkedin_url',
    'profile url': 'linkedin_url',
    'profileurl': 'linkedin_url',
    'person linkedin url': 'linkedin_url',
    'url': 'linkedin_url',

    // Email
    'email': 'email',
    'email address': 'email',
    'e-mail': 'email',
    'contact email': 'email',
    'work email': 'email',

    // First name
    'first_name': 'first_name',
    'first name': 'first_name',
    'firstname': 'first_name',
    'given name': 'first_name',
    'nombre': 'first_name',

    // Last name
    'last_name': 'last_name',
    'last name': 'last_name',
    'lastname': 'last_name',
    'surname': 'last_name',
    'family name': 'last_name',
    'apellido': 'last_name',

    // Full name
    'full_name': 'full_name',
    'full name': 'full_name',
    'fullname': 'full_name',
    'name': 'full_name',
    'contact name': 'full_name',
    'nombre completo': 'full_name',

    // Headline
    'headline': 'headline',
    'title': 'headline',
    'bio': 'headline',

    // Location
    'location': 'location',
    'city': 'location',
    'region': 'location',
    'country': 'location',
    'address': 'location',
    'ubicacion': 'location',
    'ubicación': 'location',

    // Company
    'company_name': 'company_name',
    'company name': 'company_name',
    'company': 'company_name',
    'organization': 'company_name',
    'organisation': 'company_name',
    'empresa': 'company_name',

    // Company domain
    'company_domain': 'company_domain',
    'company domain': 'company_domain',
    'domain': 'company_domain',
    'website': 'company_domain',
    'company website': 'company_domain',

    // Job title
    'job_title': 'job_title',
    'job title': 'job_title',
    'jobtitle': 'job_title',
    'position': 'job_title',
    'role': 'job_title',
    'cargo': 'job_title',
    'puesto': 'job_title',

    // Industry
    'industry': 'industry',
    'sector': 'industry',
    'company industry': 'industry',
    'industria': 'industry',
};

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if ((char === ',' || char === ';') && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0 || (values.length === 1 && !values[0])) continue;

        const row: Record<string, string> = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j] ?? '';
        }
        rows.push(row);
    }
    return rows;
}

function mapRow(
    row: Record<string, string>,
    campaignId: string | null,
    defaultIndustry: string | null,
    userId: string,
): ParsedLead | null {
    const mapped: Partial<ParsedLead> = {};

    for (const [csvHeader, value] of Object.entries(row)) {
        if (!value) continue;
        const normalized = csvHeader.toLowerCase().trim();
        const field = COLUMN_MAP[normalized];
        if (field) {
            (mapped as Record<string, string>)[field] = value;
        }
    }

    // Build full_name from first + last if not present
    if (!mapped.full_name && (mapped.first_name || mapped.last_name)) {
        mapped.full_name = [mapped.first_name, mapped.last_name].filter(Boolean).join(' ') || null;
    }

    // Require either linkedin_url or email
    if (!mapped.linkedin_url && !mapped.email) return null;

    // Generate synthetic linkedin_url if missing (needed for dedup key)
    if (!mapped.linkedin_url) {
        mapped.linkedin_url = `import:${mapped.email}`;
    }

    return {
        linkedin_url: mapped.linkedin_url!,
        email: mapped.email ?? null,
        first_name: mapped.first_name ?? null,
        last_name: mapped.last_name ?? null,
        full_name: mapped.full_name ?? null,
        headline: mapped.headline ?? null,
        location: mapped.location ?? null,
        company_name: mapped.company_name ?? null,
        company_domain: mapped.company_domain ?? null,
        job_title: mapped.job_title ?? null,
        industry: mapped.industry ?? defaultIndustry ?? null,
        source: 'import',
        campaign_id: campaignId,
        user_id: userId,
    };
}

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const campaignId = formData.get('campaignId') as string | null;
        const defaultIndustry = formData.get('industry') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const name = file.name.toLowerCase();
        if (!name.endsWith('.csv') && !name.endsWith('.tsv') && !name.endsWith('.txt')) {
            return NextResponse.json(
                { error: 'Unsupported file format. Please upload a CSV file.' },
                { status: 400 },
            );
        }

        // Size limit: 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 400 },
            );
        }

        const text = await file.text();
        const rows = parseCSV(text);

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'No valid rows found in the file. Make sure it has a header row.' },
                { status: 400 },
            );
        }

        // Map and filter
        const leads = rows
            .map(row => mapRow(row, campaignId || null, defaultIndustry, user.id))
            .filter((lead): lead is ParsedLead => lead !== null);

        if (leads.length === 0) {
            return NextResponse.json(
                { error: 'No valid leads found. Each row must have at least an email or LinkedIn URL.' },
                { status: 400 },
            );
        }

        // Insert in batches of 500
        let totalSaved = 0;
        const batchSize = 500;

        for (let i = 0; i < leads.length; i += batchSize) {
            const batch = leads.slice(i, i + batchSize);
            const { data, error } = await supabase
                .from('leads')
                .upsert(batch, { onConflict: 'linkedin_url' })
                .select('id');

            if (error) {
                console.error('Import batch error:', error);
                return NextResponse.json(
                    {
                        error: `Import failed at row ${i + 1}. ${totalSaved} leads were saved before the error.`,
                        saved: totalSaved,
                    },
                    { status: 500 },
                );
            }
            totalSaved += data?.length ?? 0;
        }

        // Detect which columns were mapped for feedback
        const sampleRow = rows[0];
        const detectedColumns: string[] = [];
        for (const header of Object.keys(sampleRow)) {
            const normalized = header.toLowerCase().trim();
            if (COLUMN_MAP[normalized]) {
                detectedColumns.push(header);
            }
        }

        return NextResponse.json({
            message: `Successfully imported ${totalSaved} leads`,
            total_rows: rows.length,
            valid_leads: leads.length,
            saved: totalSaved,
            detected_columns: detectedColumns,
            skipped: rows.length - leads.length,
        });
    } catch (err) {
        console.error('Import error:', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
