"use client";
import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import useWorkspaceId from "@/hooks/use-workspace-id";

interface SpotlightProps {
    isActive: boolean;
    targetSelector?: string;
    onComplete?: () => void;
    children?: React.ReactNode;
    highlightColor?: string;
}

export const SpotlightHighlight: React.FC<SpotlightProps> = ({
    isActive, targetSelector, onComplete, children, highlightColor = "rgba(59, 130, 246, 0.8)"
}) => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const [targetBounds, setTargetBounds] = useState<DOMRect | null>(null);
    const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('right');
    const hasNavigatedRef = useRef(false);

    const getSidebarRoute = (selector: string) => {
        if (!workspaceId) return null;
        const navKey = selector.match(/data-tour-id="([^"]+)"/)?.[1] || selector;
        const routes: Record<string, string> = {
            'nav-dashboard': `/workspace/${workspaceId}`,
            'nav-analytics': `/workspace/${workspaceId}/analytics`,
            'nav-tasks': `/workspace/${workspaceId}/tasks`,
            'nav-members': `/workspace/${workspaceId}/members`,
            'nav-settings': `/workspace/${workspaceId}/settings`,
        };
        return routes[navKey] || null;
    };

    useEffect(() => {
        if (!isActive || !targetSelector) return;
        const element = document.querySelector(targetSelector) as HTMLElement;
        if (!element) return;

        const bounds = element.getBoundingClientRect();
        setTargetBounds(bounds);

        const isNav = targetSelector.includes('nav-');
        setArrowPosition(isNav ? 'right' : (bounds.left + bounds.width / 2 < window.innerWidth / 2) ? 'right' : 'left');

        if (isNav) {
            const route = getSidebarRoute(targetSelector);
            if (route && !hasNavigatedRef.current && window.location.pathname !== route) {
                hasNavigatedRef.current = true;
                window.dispatchEvent(new CustomEvent('timeline:dialog-hide', { detail: { keepArrow: true } }));
                setTimeout(() => {
                    router.push(route);
                    setTimeout(() => {
                        hasNavigatedRef.current = false;
                        window.dispatchEvent(new CustomEvent('timeline:dialog-show', { detail: {} }));
                    }, 5000);
                }, 1000);
            }
        }

        const handleClick = () => {
            if (isNav) {
                const route = getSidebarRoute(targetSelector);
                if (route) router.push(route);
            }
        };

        element.addEventListener('click', handleClick);
        Object.assign(element.style, {
            cursor: 'pointer',
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 0 4px ${highlightColor}, 0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)`,
            borderRadius: "12px",
            position: "relative",
            zIndex: "1000",
            transform: "scale(1.05)",
            background: `linear-gradient(135deg, ${highlightColor}20, ${highlightColor}10)`,
            border: `1px solid ${highlightColor}`,
            animation: "spotlight-pulse 2s ease-in-out infinite",
        });

        return () => {
            element.removeEventListener('click', handleClick);
            Object.assign(element.style, { cursor: "", boxShadow: "", zIndex: "", transform: "", background: "", border: "", animation: "" });
        };
    }, [isActive, targetSelector, highlightColor, router, workspaceId]);

    useEffect(() => {
        if (isActive && onComplete) {
            const timer = setTimeout(onComplete, 3000);
            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    if (!isActive || !targetBounds) return null;

    const Arrow = { right: ArrowRight, left: ArrowLeft, top: ArrowUp, bottom: ArrowDown }[arrowPosition];
    const isSidebar = targetSelector?.includes('nav-');
    const arrowStyle = {
        position: 'absolute' as const,
        color: highlightColor,
        filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))',
        animation: 'arrow-bounce 1.5s ease-in-out infinite',
        zIndex: 1001,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(arrowPosition === 'right' && {
            left: targetBounds.right + (isSidebar ? 15 : 10),
            top: isSidebar ? targetBounds.top + targetBounds.height / 2 - 25 : targetBounds.top + targetBounds.height / 2 - 24,
            ...(isSidebar && { transform: 'translateY(-50%)' }),
        }),
        ...(arrowPosition === 'left' && {
            right: window.innerWidth - targetBounds.left + 10,
            top: targetBounds.top + targetBounds.height / 2 - 24,
        }),
        ...(arrowPosition === 'top' && {
            left: targetBounds.left + targetBounds.width / 2 - 24,
            bottom: window.innerHeight - targetBounds.top + 10,
        }),
        ...(arrowPosition === 'bottom' && {
            left: targetBounds.left + targetBounds.width / 2 - 24,
            top: targetBounds.bottom + 10,
        }),
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[999] animate-in fade-in duration-500">
            <Arrow size={48} style={arrowStyle} />
            <div className="absolute rounded-2xl animate-pulse" style={{
                left: targetBounds.left - 10, top: targetBounds.top - 10,
                width: targetBounds.width + 20, height: targetBounds.height + 20,
                background: `radial-gradient(circle, ${highlightColor}30 0%, transparent 70%)`, zIndex: 998,
            }} />
            {children && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto animate-in slide-in-from-bottom-4 duration-700 delay-300">
                    {children}
                </div>
            )}
            <style jsx>{`
                @keyframes spotlight-pulse {
                    0%, 100% { box-shadow: 0 0 0 4px ${highlightColor}, 0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1); transform: scale(1.05); }
                    50% { box-shadow: 0 0 0 6px ${highlightColor}, 0 0 40px rgba(59, 130, 246, 0.8), 0 0 80px rgba(59, 130, 246, 0.4), inset 0 0 30px rgba(59, 130, 246, 0.2); transform: scale(1.08); }
                }
                @keyframes arrow-bounce {
                    0%, 100% { transform: translateX(0) scale(1); opacity: 0.8; }
                    50% { transform: translateX(8px) scale(1.1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default SpotlightHighlight;
