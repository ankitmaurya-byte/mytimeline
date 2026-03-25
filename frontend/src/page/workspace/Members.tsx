"use client";

import { Separator } from "@/components/ui/separator";
import InviteMember from "@/components/workspace/member/invite-member";
import AllMembers from "@/components/workspace/member/all-members";
import WorkspaceHeader from "@/components/workspace/common/workspace-header";

export default function Members() {
  return (
    <div className="w-full min-h-screen pt-1 bg-gradient-to-br from-background to-muted/40 dark:from-background dark:to-muted/20">
      <WorkspaceHeader />
      <Separator className="my-2 sm:my-3" />
      <main>
        <div className="w-full max-w-4xl mx-auto px-3 sm:px-6">
          <div className="relative z-10 p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl bg-card/80 dark:bg-card/90 backdrop-blur-sm border border-border shadow-lg dark:shadow-xl">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-2 flex items-center gap-2">
                <span>Workspace Members</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Workspace members can view and join all workspace projects and tasks, and create new tasks in the workspace.
              </p>
            </div>
            <Separator className="my-3 sm:my-4" />
            <div className="mb-4 sm:mb-6">
              <InviteMember />
            </div>
            <Separator className="my-3 sm:my-4" />
            <AllMembers />
          </div>
        </div>
      </main>
    </div>
  );
}
