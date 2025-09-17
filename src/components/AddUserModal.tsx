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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles, type AppRole } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, Shield } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roles: z.array(z.string()).min(1, "Please select at least one role"),
  createEmployee: z.boolean().default(false),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: () => void;
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

export const AddUserModal = ({ open, onOpenChange, onUserCreated }: AddUserModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signUp } = useAuth();
  const { assignRole } = useUserRoles();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      roles: [],
      createEmployee: false,
      firstName: "",
      lastName: "",
    },
  });

  const watchCreateEmployee = form.watch("createEmployee");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Create the user directly with Supabase client to get user data
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (authError) {
        throw new Error(authError.message);
      }

      // If user was created successfully and we have the user ID
      if (authData?.user) {
        // Wait a bit for the user to be fully created in the system
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Assign the selected roles
        for (const roleValue of values.roles) {
          try {
            await assignRole(authData.user.id, roleValue as AppRole);
          } catch (roleError: any) {
            console.warn(`Failed to assign role ${roleValue}:`, roleError);
          }
        }

        // Create employee record if requested
        if (values.createEmployee && values.firstName && values.lastName) {
          try {
            const { error: employeeError } = await supabase
              .from('employees')
              .insert({
                first_name: values.firstName,
                last_name: values.lastName,
                email: values.email,
                role: 'Employee', // Default role for employee table
                status: 'Active'
              });

            if (employeeError) {
              console.warn('Failed to create employee record:', employeeError);
            }
          } catch (employeeError) {
            console.warn('Failed to create employee record:', employeeError);
          }
        }

        toast({
          title: "User Created Successfully",
          description: `User ${values.email} has been created with the selected roles. They will receive an email confirmation.`,
        });
      } else {
        toast({
          title: "User Created",
          description: `User ${values.email} has been created. Please check your email to confirm your account.`,
        });
      }

      form.reset();
      onOpenChange(false);
      onUserCreated?.();

    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = (roleValue: string, checked: boolean) => {
    const currentRoles = form.getValues("roles");
    if (checked) {
      form.setValue("roles", [...currentRoles, roleValue]);
    } else {
      form.setValue("roles", currentRoles.filter(role => role !== roleValue));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account and assign roles. The user will receive an email confirmation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="user@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Minimum 6 characters" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                User Roles
              </FormLabel>
              <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg bg-muted/30">
                {availableRoles.map((role) => (
                  <div key={role.value} className="flex items-start space-x-3">
                    <Checkbox
                      checked={form.watch("roles").includes(role.value)}
                      onCheckedChange={(checked) => handleRoleToggle(role.value, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{role.label}</div>
                      <div className="text-sm text-muted-foreground">{role.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              <FormMessage />
            </div>

            <FormField
              control={form.control}
              name="createEmployee"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Create Employee Record
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Also create an employee profile for HR management
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {watchCreateEmployee && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
                Create User
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};