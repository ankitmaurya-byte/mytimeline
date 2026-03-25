"use client";

import { ReactNode } from "react";
import AsidebarWrapper from "@/components/asidebar/asidebar-wrapper";
import Header from "@/components/header";
import { BottomNav } from "@/components/navigation";
import { NavigationOptimizer } from "@/components/navigation/NavigationOptimizer";
import { WorkspaceValidator } from "@/components/workspace/WorkspaceValidator";

interface WorkspaceLayoutContentProps {
    children: ReactNode;
}

export default function WorkspaceLayoutContent({ children }: WorkspaceLayoutContentProps) {
    return (
        <WorkspaceValidator>
            <div suppressHydrationWarning={true} className="flex w-full relative">
                {/* Sidebar - hidden on mobile */}
                <div className="hidden md:block">
                    <AsidebarWrapper />
                </div>

                <div className="flex-1 flex flex-col min-w-0 w-full">
                    <Header />
                    <main className="px-1 lg:px-20 py-3 bg-background pb-24 md:pb-3">
                        {children}
                    </main>
                </div>

                {/* Bottom Navigation - only visible on mobile */}
                <div className="md:hidden">
                    <BottomNav />
                </div>
                
                {/* Navigation Optimizer */}
                <NavigationOptimizer />
            </div>
        </WorkspaceValidator>
    );
}
