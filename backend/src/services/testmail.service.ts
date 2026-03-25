
export interface TestmailMessage {
  id: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  to?: string[];
  createdAt?: string;
}

const API_KEY = process.env.TESTMAIL_API_KEY || '';
const NAMESPACE = process.env.TESTMAIL_NAMESPACE || '';
const BASE_URL = (process.env.TESTMAIL_BASE_URL || 'https://api.testmail.app').replace(/\/$/, '');
const DOMAIN = process.env.TESTMAIL_DOMAIN || 'inbox.testmail.app';

function ensureConfigured() {
  if (!API_KEY || !NAMESPACE) {
    throw new Error('Testmail not configured: TESTMAIL_API_KEY and TESTMAIL_NAMESPACE required');
  }
}

export function generateInboxAddress(tag: string = 'auto'): string {
  ensureConfigured();
  const sanitized = tag.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  return `${NAMESPACE}.${sanitized}@${DOMAIN}`;
}

export async function listMessages(tag?: string): Promise<TestmailMessage[]> {
  ensureConfigured();
  const url = new URL(`${BASE_URL}/api/json`);
  url.searchParams.set('apikey', API_KEY);
  url.searchParams.set('namespace', NAMESPACE);
  if (tag) url.searchParams.set('tag', tag);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Testmail API error ${res.status}`);
  const data = await res.json();
  return data.emails || [];
}

export async function getMessage(id: string): Promise<TestmailMessage | null> {
  ensureConfigured();
  const url = new URL(`${BASE_URL}/api/json`);
  url.searchParams.set('apikey', API_KEY);
  url.searchParams.set('namespace', NAMESPACE);
  url.searchParams.set('id', id);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Testmail API error ${res.status}`);
  const data = await res.json();
  return data.email || null;
}

export async function sendTestmail(to: string, subject: string, text: string) {
  // Testmail is typically used for receiving; emulate send by logging.
  console.log('[testmail/send] to=%s subject=%s', to, subject);
  console.log(text);
  return { queued: true };
}

const testmailService = { generateInboxAddress, listMessages, getMessage, sendTestmail };
export default testmailService;
