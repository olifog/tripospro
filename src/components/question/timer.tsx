"use client";

// made by v0.dev :-)

// import { Switch } from "@/components/ui/switch"
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
  const [time, setTime] = useState(30 * 60); // 30 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isCountingUp, setIsCountingUp] = useState(false);
  const [playSound, _setPlaySound] = useState(true);
  const [editableTime, setEditableTime] = useState("30:00");
  const [isEditing, setIsEditing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const originalStartTime = useRef(30 * 60);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/alarm.wav");
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (isCountingUp) {
            return prevTime + 1;
          }
          if (prevTime <= 1) {
            setIsRunning(false);
            if (playSound && audioRef.current) {
              audioRef.current
                .play()
                .catch((e) => console.error("Error playing sound:", e));
            }
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
  }, [isRunning, isCountingUp, playSound]);

  // Format time for display
  useEffect(() => {
    if (!isEditing) {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      setEditableTime(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }
  }, [time, isEditing]);

  // Handle time input change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTime(e.target.value);
  };

  // Handle time input blur
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
      // If input is invalid, reset to current time
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      setEditableTime(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }
  };

  // Handle time input focus
  const handleTimeFocus = () => {
    setIsEditing(true);
  };

  // Handle time input key press
  const handleTimeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTimeBlur();
    }
  };

  // Toggle timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Toggle stopwatch mode
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
    <div className="flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-8">
      <div className="flex-shrink-0">
        <Input
          value={editableTime}
          onChange={handleTimeChange}
          onBlur={handleTimeBlur}
          onFocus={handleTimeFocus}
          onKeyDown={handleTimeKeyPress}
          className="w-28 text-center font-mono text-2xl"
          aria-label="Timer"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
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

          {/* <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Switch
                  checked={playSound}
                  onCheckedChange={setPlaySound}
                  id="sound-mode"
                  aria-label="Play sound when timer ends"
                />
                <label htmlFor="sound-mode" className="text-muted-foreground text-sm">
                  Sound
                </label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{playSound ? "Disable sound alert" : "Enable sound alert"}</p>
            </TooltipContent>
          </Tooltip> */}

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
