import MyWorkspacesCard from "./MyWorkspacesCard";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { useEffect, useState } from "react";

interface Workspace {
  _id: string;
  name: string;
}

interface WorkspacesData {
  data: Workspace[];
}

const MyWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<WorkspacesData | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);

  useEffect(() => {
    // Replace this with your actual fetch logic
    setWorkspaces({ data: [] }); // Placeholder
    setSelectedWorkspace(null); // Placeholder
  }, []);

  return (
    <div className="space-y-2">
      <DropdownMenuItem className="hover:!bg-transparent focus:!bg-none px-0 py-0 !p-0 w-full m-0">
        <MyWorkspacesCard
          item={{ _id: "", name: "" }}
          selectedWorkspace={selectedWorkspace || ""}
        />
      </DropdownMenuItem>
      {workspaces?.data?.map((item) => (
        <DropdownMenuItem key={item._id} className="hover:!bg-transparent focus:!bg-none px-0 py-0 !p-0 w-full m-0">
          <MyWorkspacesCard
            selectedWorkspace={selectedWorkspace || ""}
            item={item}
          />
        </DropdownMenuItem>
      ))}
    </div>
  );
};

export default MyWorkspaces;
