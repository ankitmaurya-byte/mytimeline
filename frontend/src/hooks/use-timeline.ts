import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logInfo, logError } from '@/lib/logger';

// Types
interface TimelineEntry {
    id: string;
    title: string;
    content: string;
    date: string;
    createdAt: string;
    updatedAt: string;
}

interface CreateTimelineEntry {
    title: string;
    content: string;
    date: string;
}

// API functions
const fetchTimeline = async (): Promise<TimelineEntry[]> => {
    const response = await fetch('/api/timeline');
    if (!response.ok) {
        throw new Error('Failed to fetch timeline');
    }
    return response.json();
};

const fetchTimelineByDate = async (date: string): Promise<TimelineEntry[]> => {
    const response = await fetch(`/api/timeline?date=${date}`);
    if (!response.ok) {
        throw new Error('Failed to fetch timeline by date');
    }
    return response.json();
};

const createTimelineEntry = async (entry: CreateTimelineEntry): Promise<TimelineEntry> => {
    const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
    });
    if (!response.ok) {
        throw new Error('Failed to create timeline entry');
    }
    return response.json();
};

// Custom hooks
export const useTimeline = () => {
    const query = useQuery({
        queryKey: ['timeline'],
        queryFn: fetchTimeline,
    });

    // Log on successful fetch
    if (query.data && !query.isLoading) {
        logInfo('Timeline fetched successfully', { count: query.data.length });
    }

    // Log on error
    if (query.error) {
        logError('Failed to fetch timeline', query.error);
    }

    return query;
};

export const useTimelineByDate = (date: string) => {
    const query = useQuery({
        queryKey: ['timeline', 'date', date],
        queryFn: () => fetchTimelineByDate(date),
        enabled: !!date, // Only run query if date is provided
    });

    // Log on successful fetch
    if (query.data && !query.isLoading) {
        logInfo('Timeline by date fetched successfully', { date, count: query.data.length });
    }

    // Log on error
    if (query.error) {
        logError('Failed to fetch timeline by date', { date, error: query.error });
    }

    return query;
};

export const useCreateTimelineEntry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createTimelineEntry,
        onSuccess: (newEntry) => {
            logInfo('Timeline entry created successfully', { entryId: newEntry.id });

            // Invalidate and refetch timeline queries
            queryClient.invalidateQueries({ queryKey: ['timeline'] });
            queryClient.invalidateQueries({ queryKey: ['timeline', 'date', newEntry.date] });

            // Optimistically update the cache
            queryClient.setQueryData(['timeline'], (oldData: TimelineEntry[] | undefined) => {
                if (oldData) {
                    return [newEntry, ...oldData];
                }
                return [newEntry];
            });
        },
        onError: (error) => {
            logError('Failed to create timeline entry', error);
        },
    });
};
