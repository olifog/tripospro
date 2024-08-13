"use client";

import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface Option {
  value: string;
  label: string;
  link: string;
}

export function LinkCombobox({
  options,
  defaultText = "Select...",
  startingValue = "",
  isFinalBreadcrumb = false,
}: {
  options: Option[];
  defaultText?: string;
  startingValue?: string;
  isFinalBreadcrumb?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const currentOption = options.find((option) => option.value === value);

  useEffect(() => {
    setValue(startingValue);
  }, [startingValue, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {value && !isFinalBreadcrumb ? (
          <div className="flex items-center">
            <Link href={currentOption?.link || "#"}>
              <span className={cn(!value && "text-gray-500")}>
                {value ? currentOption?.label : defaultText}
              </span>
            </Link>
            <button
              role="combobox"
              aria-expanded={open}
              className="flex items-center"
            >
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>
          </div>
        ) : (
          <button
            role="combobox"
            aria-expanded={open}
            className="flex items-center"
          >
            <span className={cn(!value && "text-gray-500")}>
              {value ? currentOption?.label : defaultText}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-28 p-0">
        <Command>
          <CommandInput placeholder={defaultText} />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={option.value}>
                  <Link
                    href={option.link}
                    onClick={() => {
                      setOpen(false);
                    }}
                    className="w-full"
                  >
                    <div className="flex">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </div>
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
