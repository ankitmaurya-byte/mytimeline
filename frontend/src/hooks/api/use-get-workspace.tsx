/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getWorkspaceByIdQueryFn } from "@/lib/api";
import { CustomError } from "@/types/custom-error.type";

const useGetWorkspaceQuery = (workspaceId: string, options?: Partial<UseQueryOptions<any, CustomError>>) => {
  const query = useQuery<any, CustomError>({
    queryKey: ["workspace", workspaceId],
    queryFn: () => getWorkspaceByIdQueryFn(workspaceId),
    staleTime: 5 * 60 * 1000, // 5 minutes cache for better performance
    retry: 1, // Reduced retries
    enabled: !!workspaceId && workspaceId.length > 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options, // Allow overriding options
  });

  return query;
};

export default useGetWorkspaceQuery;
