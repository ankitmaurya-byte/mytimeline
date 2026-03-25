"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourFooterProps {
    currentStep: number;
    tourSteps: any[];
    currentTourStep: any;
    navigateToStep: (stepIndex: number, nextTourStep?: any) => void;
    skipTour: () => void;
    finishTour: () => void;
    isMobile?: boolean;
}

export const TourFooter: React.FC<TourFooterProps> = ({
    currentStep,
    tourSteps,
    currentTourStep,
    navigateToStep,
    skipTour,
    finishTour,
    isMobile = false
}) => {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 flex-shrink-0">
            <div className="flex items-center gap-1.5">
                {tourSteps.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => navigateToStep(index, tourSteps[index])}
                        className={`transition-all duration-300 rounded-full ${index === currentStep ? `w-8 h-2 bg-gradient-to-r ${currentTourStep.gradient} dark:bg-gradient-to-r dark:from-gray-500 dark:to-gray-400` : "w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"}`}
                        aria-label={`Go to step ${index + 1}`}
                    />
                ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipTour}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs sm:text-sm"
                >
                    Skip Tour
                </Button>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToStep(currentStep - 1, tourSteps[currentStep - 1])}
                        disabled={currentStep === 0}
                        className="border-gray-300 dark:border-gray-600 text-xs sm:text-sm px-2 sm:px-3"
                    >
                        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Previous</span>
                    </Button>

                    {currentStep === tourSteps.length - 1 ? (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={finishTour}
                            className="text-xs sm:text-sm px-3 sm:px-4"
                        >
                            Finish Tour
                        </Button>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigateToStep(currentStep + 1, tourSteps[currentStep + 1])}
                            className="text-xs sm:text-sm px-3 sm:px-4"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <span className="sm:hidden">Next</span>
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
