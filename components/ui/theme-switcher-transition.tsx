"use client";
import { Moon, Sun, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./button";

type Theme = "light" | "dark" | "sports";

export function ThemeSwitcherTransition() {
    const [theme, setTheme] = useState<Theme>("dark");

    useEffect(() => {
        // Load theme from localStorage on mount
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        if (savedTheme) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
        }
    }, []);

    const applyTheme = (newTheme: Theme) => {
        document.documentElement.classList.remove("light", "dark", "sports");
        document.documentElement.classList.add(newTheme);
    };

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    };

    return (
        <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
                variant={theme === "light" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleThemeChange("light")}
                className="h-8 w-8 p-0"
                title="Light theme"
            >
                <Sun className="h-4 w-4" />
            </Button>
            <Button
                variant={theme === "dark" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleThemeChange("dark")}
                className="h-8 w-8 p-0"
                title="Dark theme"
            >
                <Moon className="h-4 w-4" />
            </Button>
            <Button
                variant={theme === "sports" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleThemeChange("sports")}
                className="h-8 w-8 p-0"
                title="Sports theme"
            >
                <Zap className="h-4 w-4" />
            </Button>
        </div>
    );
}