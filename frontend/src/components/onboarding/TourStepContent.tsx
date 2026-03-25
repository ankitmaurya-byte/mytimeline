"use client";
import React from "react";
import { Play, Star, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedWorkflow } from "./AnimatedWorkflow";

interface TourStepContentProps {
    currentTourStep: any;
    isAnimating: boolean;
    handleActionClick: () => void;
    isMobile?: boolean;
}

export const TourStepContent: React.FC<TourStepContentProps> = ({
    currentTourStep,
    isAnimating,
    handleActionClick,
    isMobile = false
}) => {
    return (
        <div className={`p-3 sm:p-4 flex-1 overflow-y-auto transition-all duration-700 ease-in-out ${isAnimating ? 'opacity-0 translate-y-8 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
            {currentTourStep.workflowType && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 animate-pulse" />
                        <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">Live Workflow Preview</span>
                        <Badge variant="secondary" className="text-xs">
                            {isMobile ? "Demo" : "Interactive"}
                        </Badge>
                    </div>
                    <AnimatedWorkflow
                        type={currentTourStep.workflowType}
                        isActive={!isAnimating}
                    />
                </div>
            )}

            {currentTourStep.demoElements && !currentTourStep.workflowType && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                        <Play className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Live Preview</span>
                    </div>
                    {currentTourStep.demoElements}
                </div>
            )}

            {currentTourStep.features && (
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                    <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 animate-spin" />
                        What You Can Do
                    </h4>
                    <div className="grid gap-1.5 sm:gap-2">
                        {currentTourStep.features.map((feature: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {currentTourStep.action && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-r ${currentTourStep.gradient} text-white animate-pulse flex-shrink-0`}>
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-semibold text-xs sm:text-sm">{currentTourStep.action.label}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{currentTourStep.action.description}</p>
                            </div>
                        </div>
                        <Button
                            onClick={isMobile ? undefined : handleActionClick}
                            variant={isMobile ? "secondary" : "default"}
                            size="sm"
                            disabled={isMobile}
                            className="text-xs sm:text-sm px-3 sm:px-4 w-full sm:w-auto"
                        >
                            {isMobile ? 'Desktop Only' : 'Try It'}
                        </Button>
                    </div>
                </div>
            )}

            {currentTourStep.tips && (
                <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">Pro Tips</span>
                    </div>
                    <ul className="space-y-1">
                        {currentTourStep.tips.map((tip: string, index: number) => (
                            <li key={index} className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 flex items-start gap-2">
                                <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
                                {tip}
                            </li>
                        ))}
                        {isMobile && currentTourStep.action && (
                            <li className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2 pt-1 border-t border-blue-200 dark:border-blue-700 mt-2">
                                <span className="text-amber-500 mt-1 flex-shrink-0">📱</span>
                                For the full interactive experience, visit on desktop
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};
