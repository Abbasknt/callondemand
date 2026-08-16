"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  variant?: "icon" | "full" | "dropdown";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-10 w-10 rounded-xl text-slate-500 dark:text-slate-400", className)}
        aria-label="Toggle theme"
      >
        <Sun className="h-4.5 w-4.5" />
      </Button>
    );
  }

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95",
              className
            )}
            title="Theme Settings"
          >
            {resolvedTheme === "dark" ? (
              <Moon className="h-4.5 w-4.5 text-amber-400" />
            ) : (
              <Sun className="h-4.5 w-4.5 text-amber-500" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center gap-2 cursor-pointer rounded-lg text-xs font-medium py-2",
              theme === "light" && "bg-slate-100 dark:bg-slate-800 text-primary font-semibold"
            )}
          >
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Light</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center gap-2 cursor-pointer rounded-lg text-xs font-medium py-2",
              theme === "dark" && "bg-slate-100 dark:bg-slate-800 text-primary font-semibold"
            )}
          >
            <Moon className="h-4 w-4 text-indigo-400" />
            <span>Dark</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className={cn(
              "flex items-center gap-2 cursor-pointer rounded-lg text-xs font-medium py-2",
              theme === "system" && "bg-slate-100 dark:bg-slate-800 text-primary font-semibold"
            )}
          >
            <Laptop className="h-4 w-4 text-slate-400" />
            <span>System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "full") {
    return (
      <div className={cn("flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60", className)}>
        <button
          onClick={() => setTheme("light")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all",
            theme === "light"
              ? "bg-white text-slate-900 shadow-2xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span>Light</span>
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all",
            theme === "dark"
              ? "bg-slate-900 text-white shadow-2xs font-semibold dark:bg-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          <Moon className="h-3.5 w-3.5 text-indigo-400" />
          <span>Dark</span>
        </button>
        <button
          onClick={() => setTheme("system")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all",
            theme === "system"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          <Laptop className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95",
        className
      )}
      title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-5 w-5 text-amber-400 transition-transform rotate-0 hover:rotate-90 duration-300" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 transition-transform -rotate-12 hover:rotate-0 duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
