/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Check, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface DataTableFacetedFilterProps {
  title?: string;
  options: {
    label: string | JSX.Element;
    value: string;
    icon?: React.ComponentType<{ className?: string }> | any;
  }[];
  disabled?: boolean;
  multiSelect?: boolean;
  selectedValues: string[]; // New prop
  onFilterChange: (values: string[]) => void; // New callback prop
}

export function DataTableFacetedFilter({
  title,
  options,
  selectedValues = [],
  disabled,
  multiSelect = true,
  onFilterChange,
}: DataTableFacetedFilterProps) {
  const selectedValueSet = new Set(selectedValues);

  const [open, setOpen] = React.useState(false);

  const onClose = () => {
    setOpen(false);
  };

  // Auto-close when selection changes for single select
  const handleSelection = (optionValue: string) => {
    const isSelected = selectedValueSet.has(optionValue);

    if (multiSelect) {
      const updatedValues = isSelected
        ? selectedValues.filter((val) => val !== optionValue) // Remove value
        : [...selectedValues, optionValue]; // Add value
      onFilterChange(updatedValues);
      // Keep open for multi-select to allow multiple selections
    } else {
      onFilterChange(isSelected ? [] : [optionValue]); // Single select
      // Close immediately for single select to provide better UX
      setOpen(false);
    }
  };

  // Close when clearing filters
  const handleClearFilters = () => {
    onFilterChange([]);
    onClose();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          size="sm"
          className="h-8 border-solid w-full lg:w-auto"
        >
          <PlusCircle className="h-4 w-4" />
          {title}
          {selectedValueSet.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValueSet.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValueSet.size > 1 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValueSet.size}
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValueSet.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start" side="bottom" sideOffset={4}>
        <Command>
          <CommandInput placeholder={`Filter ${title}`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValueSet.has(option.value);
                return (
                  <CommandItem
                    className={`cursor-pointer`}
                    key={option.value}
                    onSelect={() => handleSelection(option.value)}
                  >
                    {multiSelect && (
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValueSet.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup className="sticky bottom-0 align-bottom">
                  <CommandItem
                    onSelect={handleClearFilters}
                    className="justify-center text-center cursor-pointer"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
