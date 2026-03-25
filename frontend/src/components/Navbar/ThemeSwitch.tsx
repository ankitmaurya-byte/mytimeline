import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";
import { useTheme } from "@/context/theme-context";

export default function ThemeSwitch() {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg focus:scale-105 focus:shadow-lg focus:transition-all focus:duration-300 focus-visible:ring-0 focus-visible:ring-offset-0 active:outline-none bg-white/10 dark:bg-black/20 hover:bg-white/20 dark:hover:bg-black/30 border border-white/20 dark:border-white/10 backdrop-blur-sm"
          onMouseDown={(e) => e.currentTarget.blur()}
        >
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          <MonitorIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 opacity-50" />
          <span className="sr-only">Toggle theme</span>

          {/* Theme indicator dot */}
          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full transition-all duration-300 ${theme === 'light' ? 'bg-yellow-400' :
            theme === 'dark' ? 'bg-blue-400' : 'bg-green-400'
            }`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`flex items-center gap-2 cursor-pointer transition-colors ${theme === 'light' ? 'bg-accent text-accent-foreground' : ''
            }`}
        >
          <SunIcon className="h-4 w-4 text-yellow-500" />
          <span>Light</span>
          {theme === 'light' && <div className="ml-auto w-2 h-2 bg-yellow-400 rounded-full" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-2 cursor-pointer transition-colors ${theme === 'dark' ? 'bg-accent text-accent-foreground' : ''
            }`}
        >
          <MoonIcon className="h-4 w-4 text-blue-500" />
          <span>Dark</span>
          {theme === 'dark' && <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`flex items-center gap-2 cursor-pointer transition-colors ${theme === 'system' ? 'bg-accent text-accent-foreground' : ''
            }`}
        >
          <MonitorIcon className="h-4 w-4 text-green-500" />
          <span>System</span>
          {theme === 'system' && <div className="ml-auto w-2 h-2 bg-green-400 rounded-full" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
