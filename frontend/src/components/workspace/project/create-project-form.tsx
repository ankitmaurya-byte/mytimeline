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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../../ui/textarea";
import EmojiPickerComponent from "@/components/emoji-picker/lazy-emoji-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProjectMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { useLoadingContext } from "@/components/loading";

export default function CreateProjectForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  const [emoji, setEmoji] = useState("📊");
  const [isEmojiPopoverOpen, setIsEmojiPopoverOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: createProjectMutationFn,
  });

  const formSchema = z.object({
    name: z.string().trim().min(1, {
      message: "Project title is required",
    }),
    description: z.string().trim(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleEmojiSelection = (emoji: string) => {
    setEmoji(emoji);
    setIsEmojiPopoverOpen(false); // Close popover when emoji is selected
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;
    const payload = {
      workspaceId,
      data: {
        emoji,
        ...values,
      },
    };
    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["allprojects", workspaceId],
        });

        toast({
          title: "Success",
          description: "Project created successfully",
          variant: "success",
        });

        onClose(); // Close dialog and remove query param first

        setTimeout(() => {
          router.push(`/workspace/${workspaceId}/`);
        }, 500);
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
        {/* Enhanced Header with Icon */}
        <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200 dark:border-border">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold dark:text-foreground mb-2">
                Create New Project
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Set up a new project to organize tasks, manage resources, and collaborate with your team
              </p>
            </div>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Enhanced Emoji Selection */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-3">
                Project Icon
                <span className="text-xs font-normal text-muted-foreground ml-2">Choose an emoji to represent your project</span>
              </label>
              <Popover open={isEmojiPopoverOpen} onOpenChange={setIsEmojiPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-lg"
                    className="font-normal w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] !p-2 items-center rounded-full border border-gray-300 dark:border-gray-100/15 touch-manipulation"
                  >
                    <span className="text-4xl">{emoji}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  side="top"
                  // sideOffset={2}
                  className="!p-0 fixed top-0 left-0 xs:fixed xs:left-[-50px] max-h-[600px] max-w-[500px] overflow-y-auto overflow-x-hidden bg-background border-border shadow-lg dark:shadow-xl dark:bg-background dark:border-border"
                  avoidCollisions={false}
                  collisionPadding={8}
                // onOpenAutoFocus={() => {
                //   // }}
                >
                  <EmojiPickerComponent onSelectEmoji={handleEmojiSelection} disablePopover={true} />
                </PopoverContent>
              </Popover>
            </div>
            {/* Enhanced Project Title Field */}
            <div className="mb-4 sm:mb-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-foreground text-sm font-medium mb-2 block">
                      Project Title
                      <span className="text-xs font-normal text-muted-foreground ml-2">Give your project a clear, descriptive name</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Website Redesign, Mobile App Development, Marketing Campaign"
                        className="!h-[48px] sm:!h-[52px] text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Enhanced Project Description Field */}
            <div className="mb-6 sm:mb-8">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-foreground text-sm font-medium mb-2 block">
                      Project Description
                      <span className="text-xs font-normal text-muted-foreground ml-2">Optional - Describe the project goals and scope</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Describe your project goals, timeline, key deliverables, and any important details that will help your team understand the project scope..."
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-border">
              <Button
                type="button"
                variant="outline"
                size="xl"
                onClick={onClose}
                className="flex-1 touch-manipulation"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                disabled={isPending}
                variant="gradient"
                size="xl"
                className="flex-1 touch-manipulation"
                type="submit"
              >
                {isPending ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
