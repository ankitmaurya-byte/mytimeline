import { cva } from "class-variance-authority";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md dark:bg-primary/90 dark:hover:bg-primary dark:shadow-sm dark:hover:shadow-md",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md dark:bg-red-600 dark:hover:bg-red-700 dark:shadow-sm dark:hover:shadow-md",
                outline:
                    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:border-slate-500 dark:hover:bg-accent/20 dark:shadow-sm dark:hover:shadow-md",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md dark:bg-secondary/80 dark:hover:bg-secondary/60 dark:shadow-sm dark:hover:shadow-md",
                ghost:
                    "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/20 dark:text-foreground dark:hover:text-foreground",
                link:
                    "text-primary underline-offset-4 hover:underline dark:text-primary-foreground dark:hover:text-primary/80",
                success:
                    "bg-green-600 text-white shadow-sm hover:bg-green-700 hover:shadow-md dark:bg-green-700 dark:hover:bg-green-800 dark:shadow-sm dark:hover:shadow-md",
                warning:
                    "bg-yellow-600 text-white shadow-sm hover:bg-yellow-700 hover:shadow-md dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:shadow-sm dark:hover:shadow-md",
                info:
                    "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md dark:bg-blue-700 dark:hover:bg-blue-800 dark:shadow-sm dark:hover:shadow-md",
                gradient:
                    "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm hover:from-primary/90 hover:to-primary/70 hover:shadow-md dark:shadow-sm dark:hover:shadow-md",
                glassmorphism:
                    "bg-white/10 backdrop-blur-md border border-white/30 text-foreground shadow-sm hover:bg-white/20 hover:border-white/40 dark:bg-white/5 dark:border-slate-500 dark:hover:bg-white/10 dark:hover:border-slate-400",
            },
            size: {
                xs: "h-6 px-2 text-xs rounded-sm",
                sm: "h-8 px-3 text-xs rounded-md",
                default: "h-9 px-4 py-2",
                lg: "h-10 px-6 text-base rounded-lg",
                xl: "h-12 px-8 text-lg rounded-lg",
                icon: "h-9 w-9",
                "icon-sm": "h-8 w-8",
                "icon-lg": "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export default buttonVariants;
