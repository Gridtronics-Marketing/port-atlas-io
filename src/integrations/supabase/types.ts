export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          billing_address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          created_at: string
          crew_members: string[] | null
          employee_id: string
          hours_worked: number | null
          id: string
          issues_encountered: string | null
          location_id: string | null
          log_date: string
          materials_used: Json | null
          photos: string[] | null
          project_id: string | null
          safety_incidents: string | null
          updated_at: string
          weather_conditions: string | null
          work_description: string | null
          work_order_id: string | null
        }
        Insert: {
          created_at?: string
          crew_members?: string[] | null
          employee_id: string
          hours_worked?: number | null
          id?: string
          issues_encountered?: string | null
          location_id?: string | null
          log_date: string
          materials_used?: Json | null
          photos?: string[] | null
          project_id?: string | null
          safety_incidents?: string | null
          updated_at?: string
          weather_conditions?: string | null
          work_description?: string | null
          work_order_id?: string | null
        }
        Update: {
          created_at?: string
          crew_members?: string[] | null
          employee_id?: string
          hours_worked?: number | null
          id?: string
          issues_encountered?: string | null
          location_id?: string | null
          log_date?: string
          materials_used?: Json | null
          photos?: string[] | null
          project_id?: string | null
          safety_incidents?: string | null
          updated_at?: string
          weather_conditions?: string | null
          work_description?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_points: {
        Row: {
          cable_id: string | null
          created_at: string
          floor: number | null
          id: string
          installed_by: string | null
          installed_date: string | null
          ip_address: unknown | null
          label: string
          location_id: string | null
          mac_address: string | null
          notes: string | null
          patch_panel_port: string | null
          point_type: string | null
          room: string | null
          status: string | null
          switch_port: string | null
          test_results: Json | null
          tested_by: string | null
          tested_date: string | null
          updated_at: string
          vlan: string | null
          x_coordinate: number | null
          y_coordinate: number | null
        }
        Insert: {
          cable_id?: string | null
          created_at?: string
          floor?: number | null
          id?: string
          installed_by?: string | null
          installed_date?: string | null
          ip_address?: unknown | null
          label: string
          location_id?: string | null
          mac_address?: string | null
          notes?: string | null
          patch_panel_port?: string | null
          point_type?: string | null
          room?: string | null
          status?: string | null
          switch_port?: string | null
          test_results?: Json | null
          tested_by?: string | null
          tested_date?: string | null
          updated_at?: string
          vlan?: string | null
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Update: {
          cable_id?: string | null
          created_at?: string
          floor?: number | null
          id?: string
          installed_by?: string | null
          installed_date?: string | null
          ip_address?: unknown | null
          label?: string
          location_id?: string | null
          mac_address?: string | null
          notes?: string | null
          patch_panel_port?: string | null
          point_type?: string | null
          room?: string | null
          status?: string | null
          switch_port?: string | null
          test_results?: Json | null
          tested_by?: string | null
          tested_date?: string | null
          updated_at?: string
          vlan?: string | null
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "drop_points_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_points_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_points_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_availability: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          availability_type: string
          created_at: string
          employee_id: string
          end_date: string
          end_time: string | null
          id: string
          notes: string | null
          reason: string | null
          start_date: string
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          availability_type?: string
          created_at?: string
          employee_id: string
          end_date: string
          end_time?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date: string
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          availability_type?: string
          created_at?: string
          employee_id?: string
          end_date?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          end_time: string
          id: string
          location_id: string | null
          notes: string | null
          project_id: string | null
          schedule_date: string
          schedule_type: string
          start_time: string
          status: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          end_time: string
          id?: string
          location_id?: string | null
          notes?: string | null
          project_id?: string | null
          schedule_date: string
          schedule_type?: string
          start_time: string
          status?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          end_time?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          project_id?: string | null
          schedule_date?: string
          schedule_type?: string
          start_time?: string
          status?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          certification_expiry: Json | null
          certifications: string[] | null
          client_id: string | null
          created_at: string
          department: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_number: string | null
          first_name: string
          hire_date: string | null
          hourly_rate: number | null
          id: string
          last_name: string
          phone: string | null
          role: string
          skills: string[] | null
          status: string | null
          updated_at: string
        }
        Insert: {
          certification_expiry?: Json | null
          certifications?: string[] | null
          client_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string | null
          first_name: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          last_name: string
          phone?: string | null
          role: string
          skills?: string[] | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          certification_expiry?: Json | null
          certifications?: string[] | null
          client_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string | null
          first_name?: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          last_name?: string
          phone?: string | null
          role?: string
          skills?: string[] | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          asset_tag: string | null
          assigned_to: string | null
          cost: number | null
          created_at: string
          equipment_type: string
          firmware_version: string | null
          id: string
          location_id: string | null
          make: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          rack_id: string | null
          rack_position: number | null
          serial_number: string | null
          status: string | null
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_tag?: string | null
          assigned_to?: string | null
          cost?: number | null
          created_at?: string
          equipment_type: string
          firmware_version?: string | null
          id?: string
          location_id?: string | null
          make?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          rack_id?: string | null
          rack_position?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_tag?: string | null
          assigned_to?: string | null
          cost?: number | null
          created_at?: string
          equipment_type?: string
          firmware_version?: string | null
          id?: string
          location_id?: string | null
          make?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          rack_id?: string | null
          rack_position?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          access_instructions: string | null
          address: string
          building_type: string | null
          completion_percentage: number | null
          contact_onsite: string | null
          contact_phone: string | null
          created_at: string
          floor_plan_files: Json | null
          floors: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          project_id: string | null
          status: string | null
          total_square_feet: number | null
          updated_at: string
        }
        Insert: {
          access_instructions?: string | null
          address: string
          building_type?: string | null
          completion_percentage?: number | null
          contact_onsite?: string | null
          contact_phone?: string | null
          created_at?: string
          floor_plan_files?: Json | null
          floors?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          project_id?: string | null
          status?: string | null
          total_square_feet?: number | null
          updated_at?: string
        }
        Update: {
          access_instructions?: string | null
          address?: string
          building_type?: string | null
          completion_percentage?: number | null
          contact_onsite?: string | null
          contact_phone?: string | null
          created_at?: string
          floor_plan_files?: Json | null
          floors?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          project_id?: string | null
          status?: string | null
          total_square_feet?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_cost: number | null
          client_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          estimated_budget: number | null
          id: string
          name: string
          priority: string | null
          project_type: string | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimated_budget?: number | null
          id?: string
          name: string
          priority?: string | null
          project_type?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimated_budget?: number | null
          id?: string
          name?: string
          priority?: string | null
          project_type?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_checklist_items: {
        Row: {
          category: string
          checklist_id: string
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          checklist_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          checklist_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "quality_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_checklist_submissions: {
        Row: {
          checklist_id: string
          created_at: string
          employee_id: string
          id: string
          location_id: string | null
          notes: string | null
          overall_status: string
          project_id: string | null
          responses: Json
          submitted_at: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          checklist_id: string
          created_at?: string
          employee_id: string
          id?: string
          location_id?: string | null
          notes?: string | null
          overall_status?: string
          project_id?: string | null
          responses?: Json
          submitted_at?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          checklist_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          overall_status?: string
          project_id?: string | null
          responses?: Json
          submitted_at?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_checklist_submissions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "quality_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_checklists: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      racks: {
        Row: {
          cooling_required: boolean | null
          created_at: string
          floor: number | null
          id: string
          location_id: string | null
          notes: string | null
          power_available: number | null
          rack_name: string
          rack_units: number | null
          room: string | null
          updated_at: string
          x_coordinate: number | null
          y_coordinate: number | null
        }
        Insert: {
          cooling_required?: boolean | null
          created_at?: string
          floor?: number | null
          id?: string
          location_id?: string | null
          notes?: string | null
          power_available?: number | null
          rack_name: string
          rack_units?: number | null
          room?: string | null
          updated_at?: string
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Update: {
          cooling_required?: boolean | null
          created_at?: string
          floor?: number | null
          id?: string
          location_id?: string | null
          notes?: string | null
          power_available?: number | null
          rack_name?: string
          rack_units?: number | null
          room?: string | null
          updated_at?: string
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "racks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_checklist_items: {
        Row: {
          category: string
          checklist_id: string
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          checklist_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          checklist_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "safety_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_checklist_submissions: {
        Row: {
          checklist_id: string
          created_at: string
          employee_id: string
          id: string
          location_id: string | null
          notes: string | null
          overall_status: string
          project_id: string | null
          responses: Json
          submitted_at: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          checklist_id: string
          created_at?: string
          employee_id: string
          id?: string
          location_id?: string | null
          notes?: string | null
          overall_status?: string
          project_id?: string | null
          responses?: Json
          submitted_at?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          checklist_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          overall_status?: string
          project_id?: string | null
          responses?: Json
          submitted_at?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_checklist_submissions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "safety_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_checklists: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      safety_incidents: {
        Row: {
          corrective_actions: string | null
          created_at: string
          description: string
          id: string
          incident_date: string
          incident_type: string
          injured_person: string | null
          investigation_notes: string | null
          investigation_required: boolean | null
          location_id: string | null
          photos: string[] | null
          project_id: string | null
          reported_by: string
          severity: string | null
          updated_at: string
          witness_names: string[] | null
        }
        Insert: {
          corrective_actions?: string | null
          created_at?: string
          description: string
          id?: string
          incident_date: string
          incident_type: string
          injured_person?: string | null
          investigation_notes?: string | null
          investigation_required?: boolean | null
          location_id?: string | null
          photos?: string[] | null
          project_id?: string | null
          reported_by: string
          severity?: string | null
          updated_at?: string
          witness_names?: string[] | null
        }
        Update: {
          corrective_actions?: string | null
          created_at?: string
          description?: string
          id?: string
          incident_date?: string
          incident_type?: string
          injured_person?: string | null
          investigation_notes?: string | null
          investigation_required?: boolean | null
          location_id?: string | null
          photos?: string[] | null
          project_id?: string | null
          reported_by?: string
          severity?: string | null
          updated_at?: string
          witness_names?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_incidents_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_templates: {
        Row: {
          created_at: string
          created_by: string | null
          days_of_week: number[]
          effective_end_date: string | null
          effective_start_date: string
          employee_id: string | null
          end_time: string
          id: string
          is_active: boolean
          location_id: string | null
          notes: string | null
          project_id: string | null
          start_time: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          days_of_week: number[]
          effective_end_date?: string | null
          effective_start_date: string
          employee_id?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          notes?: string | null
          project_id?: string | null
          start_time: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          effective_end_date?: string | null
          effective_start_date?: string
          employee_id?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          notes?: string | null
          project_id?: string | null
          start_time?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          created_at: string
          drop_point_id: string | null
          equipment_used: string | null
          id: string
          notes: string | null
          pass_fail: string | null
          photos: string[] | null
          results: Json | null
          test_date: string
          test_type: string
          test_values: Json | null
          tested_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          drop_point_id?: string | null
          equipment_used?: string | null
          id?: string
          notes?: string | null
          pass_fail?: string | null
          photos?: string[] | null
          results?: Json | null
          test_date?: string
          test_type: string
          test_values?: Json | null
          tested_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          drop_point_id?: string | null
          equipment_used?: string | null
          id?: string
          notes?: string | null
          pass_fail?: string | null
          photos?: string[] | null
          results?: Json | null
          test_date?: string
          test_type?: string
          test_values?: Json | null
          tested_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_drop_point_id_fkey"
            columns: ["drop_point_id"]
            isOneToOne: false
            referencedRelation: "drop_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completed_date: string | null
          completion_notes: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          location_id: string | null
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string
          work_type: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          location_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          work_type?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          location_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_client_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_employee_directory: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          department: string
          first_name: string
          id: string
          last_name: string
          role: string
          status: string
          updated_at: string
        }[]
      }
      has_any_role: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "hr_manager"
        | "project_manager"
        | "technician"
        | "viewer"
        | "client"
        | "client_technician"
        | "client_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "hr_manager",
        "project_manager",
        "technician",
        "viewer",
        "client",
        "client_technician",
        "client_admin",
      ],
    },
  },
} as const
