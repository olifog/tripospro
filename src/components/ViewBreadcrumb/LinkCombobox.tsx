"use client";

import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
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
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";

export interface Option {
  value: string;
  label: string;
  link: string;
}

export function LinkCombobox({
  options,
  defaultText = "Select...",
  fallbackName,
  startingValue = "",
  isFinalBreadcrumb = false,
  sortNumeric = false,
}: {
  options?: Option[];
  defaultText?: string;
  fallbackName?: string;
  startingValue?: string;
  isFinalBreadcrumb?: boolean;
  sortNumeric?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const currentOption = options?.find((option) => option.value === value);

  useEffect(() => {
    setValue(startingValue);
  }, [startingValue, options]);

  if (!options && !fallbackName) {
    return <Skeleton className="h-6 w-12" />;
  }

  const sortedOptions = sortNumeric
    ? options?.sort((a, b) => parseInt(b.label) - parseInt(a.label))
    : options?.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {value && !isFinalBreadcrumb ? (
          <div className="flex items-center h-6">
            <Link href={currentOption?.link || "#"}>
              <span className={cn(!value && "text-gray-500")}>
                {fallbackName || defaultText}
              </span>
            </Link>
            <button
              role="combobox"
              aria-expanded={open}
              aria-controls="combobox"
              className="flex items-center"
            >
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>
          </div>
        ) : (
          <button
            role="combobox"
            aria-expanded={open}
            aria-controls="combobox"
            className="flex items-center h-6"
          >
            <span className={cn(!value && "text-gray-500")}>
              {value ? currentOption?.label : fallbackName || defaultText}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-32 p-0">
        <Command
          filter={(value, search) => {
            const option = options?.find((option) => option.value === value);
            if (option?.label.toLowerCase().includes(search.toLowerCase())) {
              return 1;
            }
            return 0;
          }}
        >
          {sortedOptions ? (
            <>
              <CommandInput placeholder={defaultText} />
              <CommandList>
                <CommandEmpty>Nothing found.</CommandEmpty>
                <CommandGroup>
                  {sortedOptions.map((option) => (
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
                              value === option.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {option.label}
                        </div>
                      </Link>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </>
          ) : (
            <Skeleton className="h-16 w-full" />
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
