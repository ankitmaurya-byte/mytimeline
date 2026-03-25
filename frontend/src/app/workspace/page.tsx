import { redirect } from "next/navigation";
import WorkspaceRedirect from "@/page/workspace/WorkspaceRedirect";
import { serverFetchCurrentUser } from "@/lib/auth/server-auth";

async function getCurrentUser() {
  return serverFetchCurrentUser();
}

export default async function WorkspaceIndexPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <WorkspaceRedirect />;
}
