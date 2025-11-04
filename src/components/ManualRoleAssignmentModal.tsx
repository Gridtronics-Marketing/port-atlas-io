import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUserRoles, type AppRole } from "@/hooks/useUserRoles";
import { Loader2, UserCog, Info } from "lucide-react";

const formSchema = z.object({
  userId: z.string().min(1, "User ID is required").regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Must be a valid UUID"),
  role: z.string().min(1, "Please select a role"),
});

interface ManualRoleAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleAssigned?: () => void;
}

const availableRoles: { value: AppRole; label: string; description: string }[] = [
  { 
    value: 'admin', 
    label: 'Administrator', 
    description: 'Full system access and user management' 
  },
  { 
    value: 'hr_manager', 
    label: 'HR Manager', 
    description: 'Employee management and HR functions' 
  },
  { 
    value: 'project_manager', 
    label: 'Project Manager', 
    description: 'Project oversight and team coordination' 
  },
  { 
    value: 'technician', 
    label: 'Technician', 
    description: 'Field operations and technical tasks' 
  },
  { 
    value: 'viewer', 
    label: 'Viewer', 
    description: 'Read-only access to system data' 
  },
];

export const ManualRoleAssignmentModal = ({ open, onOpenChange, onRoleAssigned }: ManualRoleAssignmentModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { assignRole } = useUserRoles();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      role: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await assignRole(values.userId, values.role as AppRole);
      
      toast({
        title: "Role Assigned Successfully",
        description: `Role ${values.role} has been assigned to the user.`,
      });

      form.reset();
      onOpenChange(false);
      onRoleAssigned?.();

    } catch (error: any) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: "Failed to assign role. Make sure the user ID is valid and exists in Supabase Auth.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Manual Role Assignment
          </DialogTitle>
          <DialogDescription>
            Assign roles to existing Supabase Auth users who don't have roles yet.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How to find User IDs:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Go to Supabase Dashboard → Authentication → Users</li>
                <li>Copy the UUID from the "id" column</li>
                <li>Users must exist in Supabase Auth before assigning roles</li>
              </ul>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID (UUID)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000" 
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role to Assign</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {role.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Role
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};