"use client";

import * as React from "react";
// import { useDebouncedCallback } from "use-debounce";
import Link from "next/link";

import { SearchIcon } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
// import { ProjectType } from "@/stores/workspace-store";
// import { SquareFilledIcon } from "../Sidebar/menu/ProjectMenu";
// import { getQueriedTasks } from "@/app/actions/user";
// import { MyTasksType } from "@/types";
import { Skeleton } from "../ui/skeleton";

// Commented out missing modules and fixed type issues

// Commented out 'use-debounce' import for now
// import { useDebouncedCallback } from "use-debounce";

// Commented out missing types and functions
// type ProjectType = any; // Replace with actual type
// type MyTasksType = any; // Replace with actual type
// const getQueriedTasks = async (term: string) => ({ success: false, data: [] });

// Commented out missing components
// const SquareFilledIcon = () => null;
// const CommandLoading = () => null;

type Props = {
  projects?: number[]; // Assuming projects is an array of numbers for simplicity
  workspaceId: string;
};
export default function CommandSearchMenu({ projects }: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const debouncedSearch = async () => {
    setLoading(true);

    // const isQueried = await getQueriedTasks(term);
    // if (isQueried.success) {
    //   setItems(isQueried.data || []);
    // } else {
    //   setItems([]);
    // }
    // if (!term && projects) {
    //   setProjectItems(projects);
    // } else {
    // const filteredProjects = projects?.filter((item) =>
    //   item.name.toLowerCase().includes(term.toLowerCase())
    // );

    // if (filteredProjects && filteredProjects?.length > 0) {
    //   setProjectItems(filteredProjects);
    // } else {
    // }
    // }

    setLoading(false);
  };

  const handleSearch = (val: string) => {
    setSearch(val); // Update the search value immediately
    debouncedSearch(); // Debounce the API call
  };

  return (
    <>
      {/* </p> */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="lg:w-[400px] w-[90px]" asChild>
          <Button
            className="flex justify-between items-center text-muted-foreground"
            variant={"outline"}
            size={"sm"}
          >
            <div className="flex items-center gap-x-2">
              <SearchIcon className="text-muted-foreground w-4 h-4" /> Search
            </div>

            <p className="text-sm text-muted-foreground hidden md:block">
              Press{" "}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>J
              </kbd>
            </p>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="px-0 py-0 w-[400px]">
          {/* <CommandDialog open={open} onOpenChange={setOpen}> */}
          <Command>
            <CommandInput
              value={search}
              onValueChange={handleSearch}
              placeholder="Type a command or search..."
            />
            <CommandList>
              <CommandEmpty>
                {" "}
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : (
                  "No data found"
                )}
              </CommandEmpty>
              {/* <CommandGroup heading="Suggestions">
                <CommandItem>
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Calendar</span>
                </CommandItem>
                <CommandItem>
                  <Smile className="mr-2 h-4 w-4" />
                  <span>Search Emoji</span>
                </CommandItem>
                <CommandItem>
                  <Calculator className="mr-2 h-4 w-4" />
                  <span>Calculator</span>
                </CommandItem>
              </CommandGroup> */}
              <CommandSeparator />
              <CommandGroup heading="Projects">
                {projects?.map((item: number) => (
                  <CommandItem
                    key={item}
                    onSelect={() => {
                      setOpen(false);
                      setSearch("");
                    }}
                    className="gap-x-2"
                  >
                    <Link href={`/home/${item}`} className="flex-1 w-full">
                      <span>{item}</span>
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* {loading && <CommandLoading>Checking tasks</CommandLoading>} */}
            </CommandList>
          </Command>

          {/* </CommandDialog> */}
        </PopoverContent>
      </Popover>
    </>
  );
}
