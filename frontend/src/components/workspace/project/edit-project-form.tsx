import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../../ui/textarea";
import EmojiPickerComponent from "@/components/emoji-picker/lazy-emoji-picker";
import { ProjectType } from "@/types/api.type";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { editProjectMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { useLoadingContext } from "@/components/loading";

interface EditProjectFormProps {
  project?: ProjectType;
  onClose: () => void;
}

export default function EditProjectForm({ project, onClose }: EditProjectFormProps) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  const [emoji, setEmoji] = useState("📊");
  const [isEmojiPopoverOpen, setIsEmojiPopoverOpen] = useState(false);

  const projectId = project?._id as string;

  const formSchema = z.object({
    name: z.string().trim().min(1, {
      message: "Project title is required",
    }),
    description: z.string().trim(),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: editProjectMutationFn,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (project) {
      setEmoji(project.emoji);
      form.setValue("name", project.name);
      form.setValue("description", project.description);
    }
  }, [form, project]);

  const handleEmojiSelection = (emoji: string) => {
    setEmoji(emoji);
    setIsEmojiPopoverOpen(false); // Close popover when emoji is selected
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;
    const payload = {
      projectId,
      workspaceId,
      data: { emoji, ...values },
    };
    mutate(payload, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["singleProject", projectId],
        });

        queryClient.invalidateQueries({
          queryKey: ["allprojects", workspaceId],
        });

        toast({
          title: "Success",
          description: data.message,
          variant: "success",
        });

        setTimeout(() => onClose(), 100);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="w-full h-auto max-w-full p-3 sm:p-4 lg:p-6">
      <div className="h-full">
        <div className="mb-4 sm:mb-5 pb-2 border-b border-gray-200 dark:border-border">
          <h1
            className="text-lg sm:text-xl tracking-[-0.16px] dark:text-foreground font-semibold mb-1 sm:text-left"
          >
            Edit Project
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Update the project details to refine task management
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground">
                Select Emoji
              </label>
              <Popover open={isEmojiPopoverOpen} onOpenChange={setIsEmojiPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-normal size-[50px] sm:size-[60px] !p-2 !shadow-none mt-2 items-center rounded-full touch-manipulation"
                  >
                    <span className="text-4xl">{emoji}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  side="top"
                  // sideOffset={2}
                  className="!p-0 fixed top-0 left-0 xs:fixed xs:left-[-50px] max-h-[600px] max-w-[500px] overflow-y-auto overflow-x-hidden"
                  avoidCollisions={false}
                  collisionPadding={8}
                // onOpenAutoFocus={() => {
                //   // }}
                >
                  <EmojiPickerComponent onSelectEmoji={handleEmojiSelection} disablePopover={true} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="mb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Project title
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="" className="!h-[44px] sm:!h-[48px] text-sm sm:text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="mb-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Project description
                      <span className="text-xs font-extralight ml-2">
                        Optional
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Projects description"
                        className="text-sm sm:text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              disabled={isPending}
              className="flex place-self-end h-[40px] sm:h-[44px] text-white dark:bg-black font-semibold touch-manipulation w-full sm:w-auto"
              type="submit"
            >
              {isPending && <Loader className="animate-spin" />}
              Update
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
