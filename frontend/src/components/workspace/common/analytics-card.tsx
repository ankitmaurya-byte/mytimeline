import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowBigUp, ArrowBigDown, Loader, LucideIcon } from "lucide-react";
import { useLoadingContext } from "@/components/loading";

const AnalyticsCard = (props: {
  title: string;
  value: number | string;
  isLoading: boolean;
  icon?: LucideIcon;
  trend?: string;
  trendDirection?: "up" | "down";
}) => {
  const { title, value, isLoading, icon: Icon, trend, trendDirection } = props;
  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  const getArrowIcon = () => {
    if (trendDirection === "up") {
      return <ArrowBigUp strokeWidth={2.5} className="h-4 w-4 text-green-500 dark:text-green-400" />;
    }
    if (trendDirection === "down") {
      return <ArrowBigDown strokeWidth={2.5} className="h-4 w-4 text-red-500 dark:text-red-400" />;
    }
    return null;
  };

  const getIconColor = () => {
    if (title === "Overdue Task" || title === "Overdue Tasks") {
      return "text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
    }
    if (title === "Completed Task" || title === "Completed Tasks") {
      return "text-green-500 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    }
    if (title === "Total Task" || title === "Total Tasks") {
      return "text-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
    }
    if (title === "Completion Rate") {
      return "text-purple-500 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400";
    }
    return "text-muted-foreground bg-gray-100 dark:bg-gray-800/50";
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 dark:bg-gradient-to-br dark:from-gray-950/90 dark:to-gray-800/70 dark:border dark:border-gray-700/30 hover:shadow-xl transition-all duration-300 group">

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`p-2 rounded-lg ${getIconColor()}`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</CardTitle>
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            {getArrowIcon()}
            <span className={`text-xs font-medium ${trendDirection === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}>
              {trend}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="w-full">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100  dark:group-hover:text-gray-300 transition-colors">
          {isLoading ? <Loader className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" /> : value}
        </div>
        {trend && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {trendDirection === "up" ? "Increased" : "Decreased"} from last period
          </p>
        )}
      </CardContent>
    </Card >
  );
};

export default AnalyticsCard;
