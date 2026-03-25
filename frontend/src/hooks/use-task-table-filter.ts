import { useState } from "react";

export type TaskTableFilters = {
  status: string | null;
  priority: string | null;
  keyword: string | null;
  projectId: string | null;
  assigneeId: string | null;
};

export default function useTaskTableFilter(): [TaskTableFilters, (filters: Partial<TaskTableFilters>) => void] {
  const [filters, setFilters] = useState<TaskTableFilters>({
    status: null,
    priority: null,
    keyword: null,
    projectId: null,
    assigneeId: null,
  });

  const updateFilters = (newFilters: Partial<TaskTableFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return [filters, updateFilters];
}
