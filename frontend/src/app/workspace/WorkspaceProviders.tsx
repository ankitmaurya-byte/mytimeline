"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/auth-provider";
import { BiometricProvider } from "@/context/useBiometricContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProjectDialogProvider } from "@/context/project-dialog-context";
import { WorkspaceDialogProvider } from "@/context/workspace-dialog-context";
import CreateWorkspaceDialog from "@/components/workspace/create-workspace-dialog";
import CreateProjectDialog from "@/components/workspace/project/create-project-dialog";
import { OnlineNotifications } from "@/components/workspace/online-notifications";

export default function WorkspaceProviders({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <AuthProvider>
                <BiometricProvider>
                    <ProjectDialogProvider>
                        <WorkspaceDialogProvider>
                            {children}
                            <CreateWorkspaceDialog />
                            <CreateProjectDialog />
                            <OnlineNotifications />
                        </WorkspaceDialogProvider>
                    </ProjectDialogProvider>
                </BiometricProvider>
            </AuthProvider>
        </SidebarProvider>
    );
}
