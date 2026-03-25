'use client';

import { lazy, Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smile, Loader2 } from 'lucide-react';

// Ultra lazy-loaded emoji picker - only loads when actually needed
const EmojiPickerLazy = lazy(() =>
    import('./index').then(module => ({
        default: module.default
    }))
);

interface UltraLazyEmojiPickerProps {
    onSelectEmoji: (emoji: string) => void;
    trigger?: React.ReactNode;
    className?: string;
}

export function UltraLazyEmojiPicker({
    onSelectEmoji,
    trigger,
    className
}: UltraLazyEmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleOpen = () => {
        if (!isOpen) {
            setIsLoading(true);
            setIsOpen(true);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        onSelectEmoji(emoji);
        setIsOpen(false);
        setIsLoading(false);
    };

    return (
        <div className={className}>
            {trigger ? (
                <div onClick={handleOpen} className="cursor-pointer">
                    {trigger}
                </div>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpen}
                    className="h-8 w-8 p-0"
                >
                    <Smile className="h-4 w-4" />
                </Button>
            )}

            {isOpen && (
                <div className="absolute z-50 mt-2">
                    <Suspense fallback={
                        <div className="flex items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                                Loading emoji picker...
                            </span>
                        </div>
                    }>
                        <EmojiPickerLazy onSelectEmoji={handleEmojiSelect} />
                    </Suspense>
                </div>
            )}
        </div>
    );
}























