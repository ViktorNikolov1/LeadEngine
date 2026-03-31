import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY environment variable is not set');
        }
        resendClient = new Resend(apiKey);
    }
    return resendClient;
}

export type SendEmailParams = {
    to: string;
    from: string;
    subject: string;
    html: string;
    text?: string;
};

export type SendEmailResult = {
    success: boolean;
    messageId?: string;
    error?: string;
};

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
        const resend = getResendClient();

        const { data, error } = await resend.emails.send({
            from: params.from,
            to: params.to,
            subject: params.subject,
            html: params.html,
            text: params.text,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, messageId: data?.id };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error sending email';
        return { success: false, error: message };
    }
}

export function isResendConfigured(): boolean {
    return !!process.env.RESEND_API_KEY;
}
