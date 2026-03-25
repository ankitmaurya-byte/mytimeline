import { useQuery } from '@tanstack/react-query';
import API from '@/lib/axios-client';

interface ProfilePicturesResponse {
    message: string;
    profilePictures: Record<string, string | null>;
}

export const useProfilePictures = (userIds: string[]) => {
    // Sort and deduplicate user IDs for consistent caching
    const sortedUserIds = [...new Set(userIds)].sort();
    const cacheKey = sortedUserIds.join(',');

    return useQuery({
        queryKey: ['profile-pictures', cacheKey],
        queryFn: async (): Promise<ProfilePicturesResponse> => {
            if (sortedUserIds.length === 0) {
                return { message: 'No users', profilePictures: {} };
            }

            const response = await API.get(`/users/profile-pictures?userIds=${sortedUserIds.join(',')}`);
            return response.data;
        },
        enabled: sortedUserIds.length > 0,
        staleTime: 10 * 60 * 1000, // 10 minutes cache - profile pictures don't change often
        gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnMount: false, // Don't refetch on mount if data is fresh
    });
};
