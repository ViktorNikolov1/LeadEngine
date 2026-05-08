import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

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
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, EXAMPLE_ROW]);

    // Set column widths
    ws['!cols'] = TEMPLATE_HEADERS.map(h => ({ wch: Math.max(h.length + 4, 18) }));

    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="lead-import-template.xlsx"',
        },
    });
}
