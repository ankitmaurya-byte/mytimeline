import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: LucideIcon;
    gradient?: string;
    bgGradient?: string;
}

export function AnalyticsStatCard({ title, value, change, icon: Icon, gradient = "from-blue-500 to-blue-600", bgGradient = "from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50" }: StatCardProps) {
    return (
        <Card className={`relative overflow-hidden bg-gradient-to-r ${bgGradient} border border-border/50 dark:border-slate-600/50 shadow-sm hover:shadow-md dark:hover:shadow-xl dark:shadow-slate-900/20 transition-all duration-200`}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground dark:text-slate-300">{title}</p>
                        <p className="text-2xl font-bold text-foreground dark:text-slate-100">{value}</p>
                        {change && (
                            <p className="text-xs text-muted-foreground dark:text-slate-400">{change}</p>
                        )}
                    </div>
                    <div className={`flex items-center justify-center w-12 h-12 bg-gradient-to-r ${gradient} rounded-lg shadow-sm`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
