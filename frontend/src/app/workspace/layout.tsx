import { ReactNode } from "react";
import WorkspaceProviders from "./WorkspaceProviders";
import { CentralLoader } from "@/components/loading";
import WorkspaceTourWrapper from "@/components/onboarding/WorkspaceTourWrapper";
import WorkspaceLayoutContent from "./WorkspaceLayoutContent";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
    return (
        <WorkspaceProviders>
            <CentralLoader route="/workspace">
                <WorkspaceLayoutContent>
                    {children}
                </WorkspaceLayoutContent>
                <WorkspaceTourWrapper />
            </CentralLoader>
        </WorkspaceProviders>
    );
}