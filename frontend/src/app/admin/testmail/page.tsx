import React from 'react';

async function fetchEmails(tag?: string) {
  const params = tag ? `?tag=${encodeURIComponent(tag)}` : '';
  const res = await fetch(`/api/admin/testmail${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load testmail messages');
  return res.json();
}

// Next.js 15 generated types wrap params/searchParams in Promises (see .next/types/.../page.ts)
// Match that contract exactly (Promise or undefined). Do NOT include plain object union.
interface TestmailPageProps {
  params?: Promise<Record<string, any>>; // unused here but included to satisfy PageProps
  searchParams?: Promise<Record<string, any>>;
}

export default async function TestmailPage({ searchParams }: TestmailPageProps) {
  const resolvedSearch = searchParams ? await searchParams : {} as Record<string, any>;

  const rawTag = resolvedSearch.tag;
  const tag = Array.isArray(rawTag) ? rawTag[0] : rawTag;

  let data: any = { emails: [] };
  try {
    data = await fetchEmails(typeof tag === 'string' ? tag : undefined);
  } catch { /* silent */ }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Testmail Inbox</h1>
      <form className="flex gap-2">
        <input name="tag" defaultValue={tag || ''} placeholder="tag (optional)" className="px-2 py-1 border rounded" />
        <button className="px-3 py-1 bg-blue-600 text-white rounded" type="submit">Load</button>
      </form>
      {data.sampleInbox && (
        <div className="text-sm">Sample address for this tag: <code className="bg-gray-100 px-1 py-0.5 rounded">{data.sampleInbox}</code></div>
      )}
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-2 py-1">ID</th>
              <th className="text-left px-2 py-1">Subject</th>
              <th className="text-left px-2 py-1">From</th>
              <th className="text-left px-2 py-1">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.emails?.map((e: any) => (
              <tr key={e.id} className="border-t">
                <td className="px-2 py-1 font-mono text-xs max-w-[180px] truncate" title={e.id}>{e.id}</td>
                <td className="px-2 py-1">{e.subject || <span className="italic text-gray-400">(no subject)</span>}</td>
                <td className="px-2 py-1">{e.from}</td>
                <td className="px-2 py-1">{e.createdAt ? new Date(e.createdAt).toLocaleString() : ''}</td>
              </tr>
            ))}
            {!data.emails?.length && (
              <tr><td colSpan={4} className="px-2 py-4 text-center text-gray-500">No messages</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
