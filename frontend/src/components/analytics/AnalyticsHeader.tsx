import { Download, RefreshCw, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyticsHeaderProps {
    timeRange: "7d" | "30d" | "90d";
    setTimeRange: (range: "7d" | "30d" | "90d") => void;
    onRefresh: () => void;
    onExport: () => void;
    loading?: boolean;
}

export function AnalyticsHeader({ timeRange, setTimeRange, onRefresh, onExport, loading }: AnalyticsHeaderProps) {
    return (
        <div className="relative p-4 sm:p-6 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800/80 dark:via-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-slate-200 dark:border-slate-600/50 shadow-sm dark:shadow-lg">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-600/20 rounded-xl opacity-50"></div>

            <div className="relative flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 gap-4">
                <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                                Project Analytics
                            </h1>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Real-time insights & performance metrics</span>
                                <span className="sm:hidden">Real-time insights</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center gap-3">
                    <div className="flex gap-1 p-1 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-slate-600/50 shadow-sm">
                        {(["7d", "30d", "90d"] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`flex-1 px-1 sm:px-3 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs font-medium transition-all duration-200 text-center whitespace-nowrap ${timeRange === range
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105"
                                    : "text-gray-600 dark:text-slate-300 hover:bg-gray-100/80 dark:hover:bg-slate-600/80 hover:text-gray-900 dark:hover:text-slate-100"
                                    }`}
                            >
                                {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "Last 90 Days"}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            disabled={loading}
                            className="flex items-center gap-1.5 sm:gap-2 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-600 border-gray-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3"
                        >
                            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">{loading ? "Updating..." : "Refresh"}</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExport}
                            className="flex items-center gap-1.5 sm:gap-2 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-600 border-gray-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3"
                        >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Export Data</span>
                            <span className="sm:hidden">Export</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
