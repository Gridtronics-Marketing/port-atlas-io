import { useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

export const SeedDataButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const seedDatabase = async () => {
    setLoading(true);
    try {
      // Seed clients
      const clientsData = [
        {
          name: "TechCorp Inc.",
          contact_name: "John Smith",
          contact_email: "john.smith@techcorp.com",
          contact_phone: "(555) 123-4567",
          address: "123 Business Ave, Suite 100",
          status: "Active"
        },
        {
          name: "Industrial Solutions",
          contact_name: "Sarah Johnson",
          contact_email: "sarah@industrial.com",
          contact_phone: "(555) 234-5678",
          address: "456 Factory Road",
          status: "Active"
        },
        {
          name: "ShopMart Chain",
          contact_name: "Mike Davis",
          contact_email: "mike.davis@shopmart.com",
          contact_phone: "(555) 345-6789",
          address: "789 Retail Plaza",
          status: "Inactive"
        }
      ];

      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .insert(clientsData)
        .select();

      if (clientsError) throw clientsError;

      // Seed employees
      const employeesData = [
        {
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@aljsolutions.com",
          phone: "(555) 123-4567",
          role: "Lead Technician",
          department: "Field Operations",
          status: "Active",
          skills: ["Fiber Splicing", "Network Testing", "Safety Training"],
          certifications: ["OSHA 30", "Fiber Optic Certification"]
        },
        {
          first_name: "Sarah",
          last_name: "Wilson",
          email: "sarah.wilson@aljsolutions.com",
          phone: "(555) 234-5678",
          role: "Project Manager",
          department: "Project Management",
          status: "Active",
          skills: ["Project Planning", "Client Relations", "Budget Management"],
          certifications: ["PMP", "Safety Coordinator"]
        },
        {
          first_name: "Mike",
          last_name: "Johnson",
          email: "mike.johnson@aljsolutions.com",
          phone: "(555) 345-6789",
          role: "Network Engineer",
          department: "Engineering",
          status: "Active",
          skills: ["Network Design", "Cisco Systems", "Troubleshooting"],
          certifications: ["CCNA", "Network+"]
        }
      ];

      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .insert(employeesData)
        .select();

      if (employeesError) throw employeesError;

      // Seed projects
      const projectsData = [
        {
          name: "Downtown Office Network",
          client_id: clients![0].id,
          description: "Complete network infrastructure installation",
          status: "Active",
          priority: "High"
        },
        {
          name: "Manufacturing Floor Upgrade",
          client_id: clients![1].id,
          description: "Industrial network and security system installation",
          status: "In Progress",
          priority: "Medium"
        }
      ];

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .insert(projectsData)
        .select();

      if (projectsError) throw projectsError;

      // Seed locations
      const locationsData = [
        {
          project_id: projects![0].id,
          name: "Downtown Office Complex",
          address: "123 Business Ave, Suite 100",
          building_type: "Office Building",
          floors: 5,
          status: "Active",
          completion_percentage: 85
        },
        {
          project_id: projects![1].id,
          name: "Manufacturing Facility A",
          address: "456 Factory Road",
          building_type: "Industrial",
          floors: 2,
          status: "In Progress",
          completion_percentage: 60
        },
        {
          project_id: projects![0].id,
          name: "Retail Store Network",
          address: "789 Commerce Street",
          building_type: "Retail",
          floors: 1,
          status: "Completed",
          completion_percentage: 100
        }
      ];

      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .insert(locationsData)
        .select();

      if (locationsError) throw locationsError;

      // Seed drop points
      const dropPointsData = [
        {
          location_id: locations![0].id,
          label: "DP-001",
          room: "Reception Area",
          floor: 1,
          point_type: "data",
          x_coordinate: 20.5,
          y_coordinate: 30.2,
          status: "tested",
          cable_id: "CAT6-001"
        },
        {
          location_id: locations![0].id,
          label: "FP-001",
          room: "Server Room",
          floor: 1,
          point_type: "fiber",
          x_coordinate: 45.8,
          y_coordinate: 25.1,
          status: "installed",
          cable_id: "SM-001"
        },
        {
          location_id: locations![1].id,
          label: "DP-002",
          room: "Office A",
          floor: 2,
          point_type: "data",
          x_coordinate: 35.3,
          y_coordinate: 60.7,
          status: "planned"
        }
      ];

      const { error: dropPointsError } = await supabase
        .from('drop_points')
        .insert(dropPointsData);

      if (dropPointsError) throw dropPointsError;

      toast({
        title: "Success!",
        description: "Sample data has been added to your database",
      });

    } catch (error) {
      console.error('Error seeding database:', error);
      toast({
        title: "Error",
        description: "Failed to seed database. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={seedDatabase} 
      disabled={loading}
      variant="outline"
      className="mb-4"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Adding Sample Data...
        </>
      ) : (
        <>
          <Database className="h-4 w-4 mr-2" />
          Add Sample Data
        </>
      )}
    </Button>
  );
};