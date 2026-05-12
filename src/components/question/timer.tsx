"use client";

import { Pause, Play, Timer } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function TimerComponent({
  markDone
}: {
  markDone: (time: number) => void;
}) {
  const [time, setTime] = useState(30 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCountingUp, setIsCountingUp] = useState(false);
  const [editableTime, setEditableTime] = useState("30:00");
  const [isEditing, setIsEditing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalStartTime = useRef(30 * 60);

  useEffect(() => {
    audioRef.current = new Audio("/alarm.wav");
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (isCountingUp) {
            return prevTime + 1;
          }
          if (prevTime <= 1) {
            setIsRunning(false);
            audioRef.current?.play().catch(() => {});
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isCountingUp]);

  useEffect(() => {
    if (!isEditing) {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      setEditableTime(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }
  }, [time, isEditing]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTime(e.target.value);
  };

  const handleTimeBlur = () => {
    setIsEditing(false);
    const [minutesStr, secondsStr] = editableTime.split(":");

    if (minutesStr && secondsStr) {
      const minutes = Number.parseInt(minutesStr, 10) || 0;
      const seconds = Number.parseInt(secondsStr, 10) || 0;
      const newTime = minutes * 60 + seconds;
      setTime(newTime);
      originalStartTime.current = newTime;
    } else {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      setEditableTime(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }
  };

  const handleTimeFocus = () => {
    setIsEditing(true);
  };

  const handleTimeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTimeBlur();
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const stopwatchMode = () => {
    if (isCountingUp) {
      setIsCountingUp(false);
      setIsRunning(false);
    } else {
      setIsCountingUp(true);
      setTime(0);
      setIsRunning(true);
    }
  };

  return (
    <div className="flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-2">
      <div className="flex-shrink-0">
        <Input
          value={editableTime}
          onChange={handleTimeChange}
          onBlur={handleTimeBlur}
          onFocus={handleTimeFocus}
          onKeyDown={handleTimeKeyPress}
          className="h-9 w-24 text-center font-mono text-lg"
          aria-label="Timer"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTimer}
                aria-label={isRunning ? "Pause" : "Start"}
              >
                {isRunning ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isRunning ? "Pause timer" : "Start timer"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={stopwatchMode}
                aria-label="Stopwatch mode"
                className={cn(isCountingUp && "invert")}
              >
                <Timer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stopwatch mode</p>
            </TooltipContent>
          </Tooltip>

          <Button
            variant="outline"
            onClick={() =>
              markDone(isCountingUp ? time : originalStartTime.current - time)
            }
            aria-label="Mark done"
          >
            Mark done
          </Button>
        </TooltipProvider>
      </div>
    </div>
  );
}
