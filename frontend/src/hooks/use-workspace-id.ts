"use client";
import { useParams } from "next/navigation";

const useWorkspaceId = () => {
  const params = useParams();
  return (params as { workspaceId: string })?.workspaceId || '';
};

export default useWorkspaceId;
