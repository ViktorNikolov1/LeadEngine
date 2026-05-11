import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';
import ExcelJS from 'exceljs';

const TEMPLATE_HEADERS = [
    'First Name',
    'Last Name',
    'Email',
    'LinkedIn URL',
    'Job Title',
    'Company',
    'Industry',
    'Location',
    'Website',
    'Headline',
];

const EXAMPLE_ROW = [
    'Jane',
    'Smith',
    'jane.smith@example.com',
    'https://linkedin.com/in/janesmith',
    'VP of Sales',
    'Acme Corp',
    'Software',
    'New York, USA',
    'acmecorp.com',
    'Driving B2B growth at scale',
];

export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const format = request.nextUrl.searchParams.get('format') ?? 'xlsx';

    if (format === 'csv') {
        const csv = [
            TEMPLATE_HEADERS.join(','),
            EXAMPLE_ROW.map(v => `"${v}"`).join(','),
        ].join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="lead-import-template.csv"',
            },
        });
    }

    // Default: xlsx
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Leads');

    sheet.columns = TEMPLATE_HEADERS.map(h => ({
        header: h,
        key: h,
        width: Math.max(h.length + 4, 18),
    }));

    const rowData: Record<string, string> = {};
    TEMPLATE_HEADERS.forEach((h, i) => { rowData[h] = EXAMPLE_ROW[i]; });
    sheet.addRow(rowData);

    const buf = await workbook.xlsx.writeBuffer();

    return new NextResponse(buf, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="lead-import-template.xlsx"',
        },
    });
}
