import sgMail from '@sendgrid/mail';

let initialized = false;

function ensureInitialized(): void {
    if (!initialized) {
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            throw new Error('SENDGRID_API_KEY environment variable is not set');
        }
        sgMail.setApiKey(apiKey);
        // Route API calls through EU servers for GDPR compliance and lower latency to European recipients
        (sgMail as unknown as { setDataResidency: (region: string) => void }).setDataResidency('eu');
        initialized = true;
    }
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
        ensureInitialized();

        const [response] = await sgMail.send({
            to: params.to,
            from: params.from,
            subject: params.subject,
            html: params.html,
            text: params.text,
        });

        // SendGrid returns the message ID in the x-message-id header
        const messageId = response.headers['x-message-id'] as string | undefined;

        return { success: true, messageId };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error sending email';
        return { success: false, error: message };
    }
}

export function isEmailConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
}
