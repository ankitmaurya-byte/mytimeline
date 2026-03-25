import { getAllTasksService } from '../../services/task.service';

export interface ParsedTaskQuery {
  intent: 'today' | 'tomorrow' | 'overdue' | 'week' | 'assigned' | 'status' | 'priority' | 'unknown';
  status?: string[];
  priority?: string[];
  assignedToSelf?: boolean;
  dateRange?: { start: Date; end: Date };
  // Future: freeFormKeywords could hold extracted entity tokens for richer AI prompting.
  keywords?: string[];
}

export interface SummarizeOptions {
  style?: 'short' | 'detailed' | 'friendly'; // short = original terse output
  includeExamples?: boolean; // show a couple of task titles inline
  limitExamples?: number; // default 3
}

const normalize = (s: string) => s.toLowerCase().trim();

export function parseTaskQuery(input: string): ParsedTaskQuery {
  const q = normalize(input);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday); startOfTomorrow.setDate(startOfToday.getDate() + 1);
  const startOfNextDay = new Date(startOfTomorrow); startOfNextDay.setDate(startOfTomorrow.getDate() + 1);
  if (/overdue|late|past due/.test(q)) {
    return { intent: 'overdue', dateRange: { start: new Date(0), end: startOfToday } };
  }
  if (/(today|todays|today's)/.test(q)) {
    return { intent: 'today', dateRange: { start: startOfToday, end: startOfTomorrow } };
  }
  if (/(tomorrow|tomm?oror?)/.test(q)) {
    return { intent: 'tomorrow', dateRange: { start: startOfTomorrow, end: startOfNextDay } };
  }
  if (/this week|current week|week's|weeks tasks|week tasks|week\b/.test(q)) {
    const day = startOfToday.getDay(); // 0 Sun .. 6 Sat
    const diffToMonday = (day + 6) % 7; // days since Monday
    const weekStart = new Date(startOfToday); weekStart.setDate(startOfToday.getDate() - diffToMonday);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
    return { intent: 'week', dateRange: { start: weekStart, end: weekEnd } };
  }
  if (/my tasks|assigned to me|for me|assigned/i.test(q)) {
    return { intent: 'assigned', assignedToSelf: true };
  }
  if (/(in progress|doing|working|progress|wip|ip)/.test(q)) {
    return { intent: 'status', status: ['IN_PROGRESS'] };
  }
  if (/(review|in review|awaiting review|needs review)/.test(q)) {
    return { intent: 'status', status: ['IN_REVIEW'] };
  }
  if (/(done|completed|finished|closed|resolved)/.test(q)) {
    return { intent: 'status', status: ['DONE'] };
  }
  if (/(high priority|urgent|important|critical|blocker)/.test(q)) {
    return { intent: 'priority', priority: ['HIGH'] };
  }
  if (/low priority/.test(q)) {
    return { intent: 'priority', priority: ['LOW'] };
  }
  // Basic heuristic: if user typed a known status token directly, capture it.
  if (/(todo|backlog|in_progress|in progress|review|done)/.test(q)) {
    const map: Record<string, string> = {
      'in progress': 'IN_PROGRESS',
      'in_progress': 'IN_PROGRESS',
      'review': 'IN_REVIEW',
      'done': 'DONE'
    };
    const found = Object.keys(map).find(k => q.includes(k));
    if (found) return { intent: 'status', status: [map[found]] };
  }
  return { intent: 'unknown' };
}

export async function executeParsedTaskQuery(workspaceId: string, userId: string, parsed: ParsedTaskQuery) {
  // Build filters for existing getAllTasksService
  const filters: any = {};
  if (parsed.status) filters.status = parsed.status;
  if (parsed.priority) filters.priority = parsed.priority;
  if (parsed.assignedToSelf) filters.assignedTo = [userId];
  if (parsed.dateRange) {
    filters.dueDateStart = parsed.dateRange.start.toISOString();
    // subtract tiny epsilon to avoid overlap; service uses inclusive $lte, we mimic by end - 1ms
    const end = new Date(parsed.dateRange.end.getTime() - 1);
    filters.dueDateEnd = end.toISOString();
  }

  const result = await getAllTasksService(
    workspaceId,
    filters,
    { pageSize: 200, pageNumber: 1 },
  );
  return result.tasks;
}

export function summarizeTasks(intent: ParsedTaskQuery['intent'], tasks: any[], opts: SummarizeOptions = {}) {
  const { style = 'short', includeExamples = style !== 'short', limitExamples = 3 } = opts;

  if (!tasks.length) {
    const base = (() => {
      switch (intent) {
        case 'today': return 'You have no tasks due today.';
        case 'tomorrow': return 'You have no tasks due tomorrow.';
        case 'overdue': return 'Great! No overdue tasks.';
        case 'week': return 'No tasks found for this week.';
        case 'assigned': return 'No tasks currently assigned to you.';
        default: return 'No matching tasks found.';
      }
    })();
    if (style === 'friendly') return base + ' Nice and clear slate—maybe plan or refine upcoming work?';
    if (style === 'detailed') return base + ' (Query returned zero rows)';
    return base;
  }

  const total = tasks.length;
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let dueToday = 0, overdue = 0, dueThisWeek = 0;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday); endOfToday.setDate(startOfToday.getDate() + 1);
  const weekDay = startOfToday.getDay();
  const monday = new Date(startOfToday); monday.setDate(startOfToday.getDate() - ((weekDay + 6) % 7));
  const endWeek = new Date(monday); endWeek.setDate(monday.getDate() + 7);

  tasks.forEach(t => {
    if (t.status) byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    if (t.priority) byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    if (t.dueDate) {
      const d = new Date(t.dueDate);
      if (d < startOfToday) overdue++;
      else if (d >= startOfToday && d < endOfToday) dueToday++;
      if (d >= monday && d < endWeek) dueThisWeek++;
    }
  });
  const statusSummary = Object.entries(byStatus).map(([s, c]) => `${c} ${s.replace('_', ' ').toLowerCase()}`).join(', ');
  const prioritySummary = Object.entries(byPriority).map(([p, c]) => `${c} ${p.toLowerCase()}`).join(', ');

  const examples = includeExamples
    ? tasks.slice(0, limitExamples).map(t => `“${(t.title || t.name || 'Untitled').slice(0, 70)}”`).join(', ')
    : '';

  const shortIntentLine = (() => {
    switch (intent) {
      case 'today': return `Today you have ${total} task(s): ${statusSummary}.`;
      case 'tomorrow': return `Tomorrow you have ${total} task(s).`;
      case 'overdue': return `You have ${total} overdue task(s).`;
      case 'week': return `This week: ${total} task(s) (${statusSummary}).`;
      case 'assigned': return `You have ${total} task(s) assigned to you.`;
      default: return `${total} task(s) found (${statusSummary}).`;
    }
  })();

  if (style === 'short') return shortIntentLine;

  const detailBits: string[] = [];
  detailBits.push(shortIntentLine);
  if (prioritySummary) detailBits.push(`Priority mix: ${prioritySummary}.`);
  detailBits.push(`Overdue: ${overdue}, due today: ${dueToday}, due this week: ${dueThisWeek}.`);
  if (examples) detailBits.push(`Examples: ${examples}${tasks.length > limitExamples ? ` +${tasks.length - limitExamples} more` : ''}.`);

  if (style === 'detailed') return detailBits.join(' ');
  // friendly
  return detailBits.join(' ') + ' Stay focused—tackle high priority or overdue items first.';
}
