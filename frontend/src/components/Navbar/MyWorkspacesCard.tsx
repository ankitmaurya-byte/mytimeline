"use client";

import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { BuildingIcon, CheckIcon } from "lucide-react";

type Props = {
  item: {
    _id: string;
    name: string;
  };
  selectedWorkspace: string;
};

const MyWorkspacesCard = ({ item, selectedWorkspace }: Props) => {

  return (
    <Button
      variant={"ghost"}
      className={cn(
        "w-full justify-between items-center gap-x-2 px-2 text-sm font-normal",
        selectedWorkspace === item._id && "bg-secondary"
      )}
    >
      <div className="flex gap-x-2">
        <BuildingIcon size={20} />
        {item.name}{" "}
      </div>
      {selectedWorkspace === item._id && (
        <CheckIcon size={20} className="text-muted-foreground" />
      )}
    </Button>
  );
};

export default MyWorkspacesCard;
