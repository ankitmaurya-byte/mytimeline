import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkspaceMutationFn } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Loader, Building2 } from "lucide-react";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useLoadingContext } from "@/components/loading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateWorkspaceForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createWorkspaceMutationFn,
  });

  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  const formSchema = z.object({
    name: z.string().trim().min(1, {
      message: "Workspace name is required",
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;
    mutate(values, {
      onSuccess: (data) => {

        const workspace = data.workspace;

        // Close dialog first
        onClose();

        // Invalidate and refetch queries to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: ["workspaces"],
        });
        queryClient.invalidateQueries({
          queryKey: ["authUser"],
        });

        // Navigate directly to the newly created workspace
        router.push(`/workspace/${workspace._id}`);
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
    <div className="w-full sm:max-w-4xl mx-auto p-3 sm:p-4">
      {/* Add DialogTitle and DialogDescription for accessibility */}
      <VisuallyHidden asChild>
        <DialogTitle>Create Workspace</DialogTitle>
      </VisuallyHidden>
      <VisuallyHidden asChild>
        <DialogDescription>
          Create a new workspace for your team to collaborate
        </DialogDescription>
      </VisuallyHidden>

      <div className="text-center mb-4 sm:mb-6">
        <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          Create a new workspace
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground px-2">
          Workspaces help you organize projects and collaborate with your team.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Workspace details</CardTitle>
          <CardDescription className="text-sm">
            Provide basic information about your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              {/* Workspace Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Workspace name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. My Company, Marketing Team"
                        className="h-11 sm:h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      This is the name that will be displayed to your team.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Workspace Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                      Description
                      <span className="text-xs text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly describe what this workspace is for..."
                        rows={3}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      Help your team understand the purpose of this workspace.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-11 sm:h-10"
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 sm:h-10"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Workspace"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
