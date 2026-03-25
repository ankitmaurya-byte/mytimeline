import nodemailer from 'nodemailer';

interface SendEmailOptions { to: string; subject: string; text?: string; html?: string; }

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (transporter) return transporter;
    const host = process.env.EMAIL_SMTP_HOST;
    const port = process.env.EMAIL_SMTP_PORT ? parseInt(process.env.EMAIL_SMTP_PORT, 10) : 587;
    const user = process.env.EMAIL_SMTP_USER;
    const pass = process.env.EMAIL_SMTP_PASS;
    if (host && user && pass) {
        transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    }
    return transporter;
}

export async function sendEmail(opts: SendEmailOptions) {
    const { to, subject, text, html } = opts;
    const tx = getTransporter();
    if (!tx) {
        console.log('[email.service] SMTP not configured. Falling back to console log.');
        console.log('To:', to); console.log('Subject:', subject); console.log(text || html || '');
        return { queued: true, simulated: true };
    }
    const from = process.env.EMAIL_FROM || `no-reply@${process.env.EMAIL_DOMAIN || 'localhost'}`;
    const info = await tx.sendMail({ from, to, subject, text, html });
    return { queued: true, messageId: info.messageId };
}

export function emailEnabled() {
    return !!(process.env.EMAIL_SMTP_HOST && process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASS);
}

const emailService = { sendEmail, emailEnabled };
export default emailService;
