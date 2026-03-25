// Lazy loading for heavy date picker components
import { lazy, Suspense } from 'react';
import { Loader } from 'lucide-react';
import { useLoadingContext } from "@/components/loading";

const CalendarLazy = lazy(() => import('../ui/calendar').then(module => ({
    default: module.Calendar
})));

interface LazyCalendarProps {
    className?: string;
    classNames?: Record<string, string>;
    showOutsideDays?: boolean;
    [key: string]: unknown;
}

export const LazyCalendar = (props: LazyCalendarProps) => {
    const { isStrategicLoading } = useLoadingContext();

    // Don't show anything during strategic loading
    if (isStrategicLoading) {
        return null;
    }

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[300px] w-[280px] border rounded-md">
                <Loader className="h-6 w-6 animate-spin" />
            </div>
        }>
            <CalendarLazy {...props} />
        </Suspense>
    );
};

export default LazyCalendar;
