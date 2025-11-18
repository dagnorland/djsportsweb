"use client";

import { CurrentlyPlaying } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FloatingPauseButtonProps {
  currentlyPlaying: CurrentlyPlaying | null;
  onPlayPause: () => void;
}

export default function FloatingPauseButton({
  currentlyPlaying,
  onPlayPause,
}: FloatingPauseButtonProps) {
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem("floatingPauseButtonPosition");
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (position.x !== 20 || position.y !== 80) {
      localStorage.setItem("floatingPauseButtonPosition", JSON.stringify(position));
    }
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left mouse button
    
    setIsDragging(true);
    setHasMoved(false);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      setHasMoved(true);

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Constrain to viewport
      const maxX = window.innerWidth - 64; // Button width
      const maxY = window.innerHeight - 64; // Button height

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Reset hasMoved after a short delay to allow click to work
      setTimeout(() => setHasMoved(false), 100);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger pause if we didn't just drag and if music is currently playing
    if (!hasMoved && currentlyPlaying?.is_playing) {
      onPlayPause();
    }
  };

  return (
    <TooltipProvider>
      <div
        ref={buttonRef}
        className="fixed z-[55] cursor-move select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              size="lg"
              disabled={!currentlyPlaying?.is_playing}
              className={cn(
                "h-16 w-16 rounded-full shadow-lg",
                "bg-primary hover:bg-primary/90",
                "transition-all duration-200",
                "hover:scale-110 active:scale-95",
                "flex items-center justify-center",
                isDragging && "cursor-grabbing",
                !currentlyPlaying?.is_playing && "opacity-50 cursor-not-allowed hover:scale-100"
              )}
              aria-label="Pause"
              onMouseDown={(e) => {
                // Prevent button's default behavior during drag
                if (isDragging) {
                  e.preventDefault();
                }
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="h-8 w-2 bg-primary-foreground rounded-sm" />
                <div className="h-8 w-2 bg-primary-foreground rounded-sm" />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>ESC pauser også musikken</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

