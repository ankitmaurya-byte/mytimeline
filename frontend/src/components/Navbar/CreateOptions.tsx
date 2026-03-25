"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus } from "lucide-react";

// type Props = {
//   workspaceId?: string;
//   workspaceName?: string;
// };

const CreateOptions = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size={"sm"}>Create</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {/* <DropdownMenuLabel>My Account</DropdownMenuLabel> */}
          <DropdownMenuSeparator />
          {/* <Link href={"/project/new"}>
            <DropdownMenuItem className="cursor-pointer">
              {" "}
              <ClipboardListIcon className="w-4 h-4 mr-1" />
              Project
            </DropdownMenuItem>
          </Link> */}
          {/* <Link href={"/workspace/new"}>
            <DropdownMenuItem className="cursor-pointer">
              {" "}
              <Briefcase className="w-4 h-4 mr-1" />
              Workspace
            </DropdownMenuItem>
          </Link> */}
          {/* <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuItem>Subscription</DropdownMenuItem> */}
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => {
              // setOpen(false);
              // setIsMemberModalOpen(true);
              // e.preventDefault();
              // e.stopPropagation();
            }}
          >
            {/* <AddMemberModal
              workspaceId={workspaceId as string}
              workspaceName={workspaceName}
              setPopOverOpen={setOpen}
              className="gap-x-0 py-0 ml-0 px-0 relative z-50"
              buttonTrigger={
                <>
                  <UserPlus className="w-4 h-4 mr-1" />
                  Invite
                </>
              }
            /> */}
            <>
              <UserPlus className="w-4 h-4 mr-1" />
              Invite
            </>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CreateOptions;
