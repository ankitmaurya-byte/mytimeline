import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm hover:shadow-md dark:shadow-lg dark:shadow-black/10",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 hover:scale-105 dark:shadow-primary/25",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 dark:bg-secondary/80 dark:hover:bg-secondary/60",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80 hover:scale-105 dark:bg-red-600 dark:hover:bg-red-700 dark:shadow-red-900/25",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground dark:border-border dark:hover:bg-accent/10",
        // Status badges with dark mode support
        [TaskStatusEnum.BACKLOG]: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 hover:scale-105 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700",
        [TaskStatusEnum.TODO]: "bg-[#DEEBFF] text-[#0052CC] border-[#B3D4FF] hover:bg-[#B3D4FF] hover:scale-105 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/50",
        [TaskStatusEnum.IN_PROGRESS]: "bg-yellow-100 text-yellow-600 border-yellow-200 hover:bg-yellow-200 hover:scale-105 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/50",
        [TaskStatusEnum.IN_REVIEW]: "bg-purple-100 text-purple-500 border-purple-200 hover:bg-purple-200 hover:scale-105 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/50",
        [TaskStatusEnum.DONE]: "bg-green-100 text-green-600 border-green-200 hover:bg-green-100 hover:scale-105 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/50",
        // Priority badges with dark mode support
        [TaskPriorityEnum.HIGH]: "bg-orange-100 text-orange-600 border-orange-200 hover:bg-orange-200 hover:scale-105 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/50",
        "URGENT": "bg-red-100 text-red-600 border-red-200 hover:bg-red-200 hover:scale-105 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50",
        [TaskPriorityEnum.MEDIUM]: "bg-yellow-100 text-yellow-600 border-yellow-200 hover:bg-yellow-200 hover:scale-105 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/50",
        [TaskPriorityEnum.LOW]: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 hover:scale-105 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
