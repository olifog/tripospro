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

export interface Option {
  value: string;
  label: string;
  link: string;
}

export function LinkCombobox({
  options,
  defaultText = "Select...",
  startingValue = "",
}: {
  options: Option[];
  defaultText?: string;
  startingValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const router = useRouter();

  useEffect(() => {
    setValue(startingValue);
  }, [startingValue, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-28"
        >
          <span className={cn(!value && "text-gray-500")}>
            {value
              ? options.find((option) => option.value === value)?.label
              : defaultText}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-28 p-0">
        <Command>
          <CommandInput placeholder={defaultText} />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue);
                    setOpen(false);
                    router.push(option.link);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
