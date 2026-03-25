"use client";
import React from "react";
import { Eye, MousePointer2, Sparkles } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface TourHeaderProps {
    currentTourStep: any;
    currentStep: number;
    tourStepsLength: number;
    progress: number;
    isAnimating: boolean;
    isMobile?: boolean;
}

export const TourHeader: React.FC<TourHeaderProps> = ({
    currentTourStep,
    currentStep,
    tourStepsLength,
    progress,
    isAnimating,
    isMobile = false
}) => {
    return (
        <div className={`bg-gradient-to-r ${currentTourStep.gradient} p-3 sm:p-4 text-white relative overflow-hidden flex-shrink-0 transition-all duration-700 ease-in-out ${isAnimating ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
            <div className="mb-2 sm:mb-3 md:mb-4">
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center gap-3 sm:gap-5'} mb-2 sm:mb-3`}>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 opacity-90" />
                        <span className="text-xs sm:text-sm font-medium opacity-90">Step {currentStep + 1} of {tourStepsLength}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <MousePointer2 className="w-3 h-3 sm:w-4 sm:h-4 opacity-75" />
                        <span className="text-xs sm:text-sm font-medium opacity-90">{Math.round(progress)}% Complete</span>
                    </div>
                </div>
                <Progress value={progress} className="h-1.5 sm:h-2 bg-white/20 dark:bg-gray-600/40" />
            </div>

            <DialogHeader className={`space-y-3 sm:space-y-4 p-0`}>
                <div className={`flex ${isMobile ? 'flex-col items-center text-center' : 'items-start'} ${isMobile ? 'gap-3' : 'gap-3 sm:gap-4'}`}>
                    <div className={`bg-white/20 dark:bg-gray-600/30 rounded-xl sm:rounded-2xl p-2 sm:p-3 sm:mt-4 xs:mt-3 backdrop-blur-sm animate-bounce flex-shrink-0`}>
                        <div className="text-white text-lg sm:text-xl">{currentTourStep.icon}</div>
                    </div>
                    <div className={`${isMobile ? 'w-full' : 'flex-1'} min-w-0`}>
                        <DialogTitle className={`text-base sm:text-lg md:text-xl font-bold text-white mb-1 sm:mb-2 leading-tight ${isMobile ? 'text-center' : ''}`}>
                            {currentTourStep.title}
                        </DialogTitle>
                        <DialogDescription className={`text-white/90 text-xs sm:text-sm leading-relaxed ${isMobile ? 'text-center' : ''}`}>
                            {currentTourStep.description}
                        </DialogDescription>
                        <Badge variant="secondary" className={`mt-2 bg-white/20 dark:bg-gray-600/40 text-white border-white/30 dark:border-gray-500/40 text-xs ${isMobile ? 'mx-auto' : ''}`}>
                            <Sparkles className="w-3 h-3 mr-1" />
                            {currentTourStep.keyBenefit}
                        </Badge>
                    </div>
                </div>
            </DialogHeader>
        </div>
    );
};
