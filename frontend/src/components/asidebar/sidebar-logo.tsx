"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/context/theme-context";
import { TimelineLogo } from "@/components/ui/timeline-logo";

type SidebarLogoProps = {
    url?: string;
    isLink?: boolean;
};

const SidebarLogo = ({ url = "/", isLink = true }: SidebarLogoProps) => {
    const { resolvedTheme } = useTheme();

    // Custom rotation animation styles
    const animationStyles = `
        @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .rotate-animation {
            animation: rotate 8s linear infinite;
        }
    `;

    const logoContent = (
        <div className="flex items-center justify-center gap-3 group-data-[collapsible=icon]:justify-center transition-all duration-300">
            <style>{animationStyles}</style>
            {/* Icon version for collapsed state */}
            <div className="group-data-[collapsible=icon]:block hidden">
                <div className="relative flex items-center justify-center h-12 rounded-lg">
                    <Image
                        src="https://res.cloudinary.com/dsuafua4l/image/upload/v1758264239/timeline/frontend/public/--/frontend/public/timeline-png/timeline.png"
                        alt="Timeline Logo"
                        width={48}
                        height={48}
                        className="h-12 rotate-animation"
                    />
                </div>
            </div>

            {/* Full logo for expanded state */}
            <div className="group-data-[collapsible=icon]:hidden flex justify-center gap-3">
                <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center h-12 rounded-lg">
                        <Image
                            src="https://res.cloudinary.com/dsuafua4l/image/upload/v1758264239/timeline/frontend/public/--/frontend/public/timeline-png/timeline.png"
                            alt="Timeline Logo"
                            width={48}
                            height={48}
                            className="size-12 object-contain rotate-animation"
                            priority
                        />
                    </div>
                    <span className="text-xl font-semibold text-foreground dark:text-gray-200 leading-tight group-hover/logo:text-blue-600 dark:group-hover/logo:text-blue-400 transition-colors duration-300">Timeline</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex items-center justify-center w-full bg-background">
            {isLink ? (
                <Link
                    href={url}
                    className="flex items-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group/logo hover:drop-shadow-lg hover:drop-shadow-blue-500/20 dark:hover:drop-shadow-blue-400/30"
                >
                    <div className="group-hover/logo:text-primary transition-colors duration-300">
                        {logoContent}
                    </div>
                </Link>
            ) : (
                logoContent
            )}
        </div>
    );
};

export default SidebarLogo;
