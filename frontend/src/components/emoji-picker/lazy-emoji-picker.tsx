// Lazy component wrapper for heavy emoji picker
import { lazy, Suspense } from 'react';
import { Loader } from 'lucide-react';
import { useLoadingContext } from "@/components/loading";

const EmojiPickerLazy = lazy(() => import('./index'));

interface EmojiPickerWrapperProps {
    onSelectEmoji: (emoji: string) => void;
    disablePopover?: boolean;
}

const EmojiPickerWrapper = ({ onSelectEmoji, disablePopover = false }: EmojiPickerWrapperProps) => {
    const { isStrategicLoading } = useLoadingContext();

    // Don't show anything during strategic loading
    if (isStrategicLoading) {
        return null;
    }

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[200px] w-[300px]">
                <Loader className="h-6 w-6 animate-spin" />
            </div>
        }>
            <EmojiPickerLazy onSelectEmoji={onSelectEmoji} disablePopover={disablePopover} />
        </Suspense>
    );
};

export default EmojiPickerWrapper;
