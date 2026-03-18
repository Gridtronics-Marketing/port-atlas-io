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
      admin_impersonation_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          id: string
          impersonation_type: string
          ip_address: string | null
          metadata: Json | null
          target_organization_id: string | null
          target_role: Database["public"]["Enums"]["org_role"] | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          impersonation_type: string
          ip_address?: string | null
          metadata?: Json | null
          target_organization_id?: string | null
          target_role?: Database["public"]["Enums"]["org_role"] | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          impersonation_type?: string
          ip_address?: string | null
          metadata?: Json | null
          target_organization_id?: string | null
          target_role?: Database["public"]["Enums"]["org_role"] | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_impersonation_log_target_organization_id_fkey"
            columns: ["target_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily_stats: {
        Row: {
          avg_pages_per_session: number | null
          avg_session_duration_seconds: number | null
          bounce_rate: number | null
          created_at: string
          date: string
          desktop_sessions: number | null
          id: string
          mobile_sessions: number | null
          new_visitors: number | null
          returning_visitors: number | null
          tablet_sessions: number | null
          top_pages: Json | null
          top_referrers: Json | null
          total_events: number | null
          total_page_views: number | null
          total_sessions: number | null
          traffic_sources: Json | null
          unique_visitors: number | null
          updated_at: string
        }
        Insert: {
          avg_pages_per_session?: number | null
          avg_session_duration_seconds?: number | null
          bounce_rate?: number | null
          created_at?: string
          date: string
          desktop_sessions?: number | null
          id?: string
          mobile_sessions?: number | null
          new_visitors?: number | null
          returning_visitors?: number | null
          tablet_sessions?: number | null
          top_pages?: Json | null
          top_referrers?: Json | null
          total_events?: number | null
          total_page_views?: number | null
          total_sessions?: number | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string
        }
        Update: {
          avg_pages_per_session?: number | null
          avg_session_duration_seconds?: number | null
          bounce_rate?: number | null
          created_at?: string
          date?: string
          desktop_sessions?: number | null
          id?: string
          mobile_sessions?: number | null
          new_visitors?: number | null
          returning_visitors?: number | null
          tablet_sessions?: number | null
          top_pages?: Json | null
          top_referrers?: Json | null
          total_events?: number | null
          total_page_views?: number | null
          total_sessions?: number | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_action: string
          event_category: string
          event_label: string | null
          event_value: number | null
          id: string
          metadata: Json | null
          page_path: string | null
          session_id: string | null
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          event_action: string
          event_category: string
          event_label?: string | null
          event_value?: number | null
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          event_action?: string
          event_category?: string
          event_label?: string | null
          event_value?: number | null
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_page_views: {
        Row: {
          created_at: string
          exited_at: string | null
          id: string
          page_path: string
          page_title: string | null
          page_url: string | null
          referrer: string | null
          scroll_depth_percent: number | null
          session_id: string | null
          time_on_page_seconds: number | null
          user_id: string | null
          viewed_at: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          exited_at?: string | null
          id?: string
          page_path: string
          page_title?: string | null
          page_url?: string | null
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id?: string | null
          time_on_page_seconds?: number | null
          user_id?: string | null
          viewed_at?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          exited_at?: string | null
          id?: string
          page_path?: string
          page_title?: string | null
          page_url?: string | null
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id?: string | null
          time_on_page_seconds?: number | null
          user_id?: string | null
          viewed_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_page_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          browser_version: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          entry_page: string | null
          exit_page: string | null
          id: string
          ip_hash: string | null
          is_bounce: boolean | null
          language: string | null
          os: string | null
          os_version: string | null
          page_count: number | null
          referrer: string | null
          referrer_domain: string | null
          screen_height: number | null
          screen_width: number | null
          started_at: string
          timezone: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          viewport_height: number | null
          viewport_width: number | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          ip_hash?: string | null
          is_bounce?: boolean | null
          language?: string | null
          os?: string | null
          os_version?: string | null
          page_count?: number | null
          referrer?: string | null
          referrer_domain?: string | null
          screen_height?: number | null
          screen_width?: number | null
          started_at?: string
          timezone?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          ip_hash?: string | null
          is_bounce?: boolean | null
          language?: string | null
          os?: string | null
          os_version?: string | null
          page_count?: number | null
          referrer?: string | null
          referrer_domain?: string | null
          screen_height?: number | null
          screen_width?: number | null
          started_at?: string
          timezone?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
          visitor_id?: string
        }
        Relationships: []
      }
      backbone_cables: {
        Row: {
          cable_label: string
          cable_subtype: string | null
          cable_type: string
          capacity_spare: number | null
          capacity_total: number | null
          capacity_used: number | null
          created_at: string
          destination_equipment: string | null
          destination_floor: number | null
          id: string
          installation_date: string | null
          is_multi_segment: boolean
          jacket_rating: string | null
          labeling_standard: string | null
          location_id: string | null
          notes: string | null
          organization_id: string | null
          origin_equipment: string | null
          origin_floor: number | null
          pair_count: number | null
          strand_count: number | null
          test_results: Json | null
          total_segments: number | null
          unique_id: string | null
          updated_at: string
        }
        Insert: {
          cable_label: string
          cable_subtype?: string | null
          cable_type: string
          capacity_spare?: number | null
          capacity_total?: number | null
          capacity_used?: number | null
          created_at?: string
          destination_equipment?: string | null
          destination_floor?: number | null
          id?: string
          installation_date?: string | null
          is_multi_segment?: boolean
          jacket_rating?: string | null
          labeling_standard?: string | null
          location_id?: string | null
          notes?: string | null
          organization_id?: string | null
          origin_equipment?: string | null
          origin_floor?: number | null
          pair_count?: number | null
          strand_count?: number | null
          test_results?: Json | null
          total_segments?: number | null
          unique_id?: string | null
          updated_at?: string
        }
        Update: {
          cable_label?: string
          cable_subtype?: string | null
          cable_type?: string
          capacity_spare?: number | null
          capacity_total?: number | null
          capacity_used?: number | null
          created_at?: string
          destination_equipment?: string | null
          destination_floor?: number | null
          id?: string
          installation_date?: string | null
          is_multi_segment?: boolean
          jacket_rating?: string | null
          labeling_standard?: string | null
          location_id?: string | null
          notes?: string | null
          organization_id?: string | null
          origin_equipment?: string | null
          origin_floor?: number | null
          pair_count?: number | null
          strand_count?: number | null
          test_results?: Json | null
          total_segments?: number | null
          unique_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backbone_cables_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backbone_cables_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_avatar_url: string | null
          author_name: string
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          published_at: string | null
          read_time_minutes: number | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          organization_id: string | null
          priority: number | null
          rule_name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          priority?: number | null
          rule_name: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          priority?: number | null
          rule_name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cable_connections: {
        Row: {
          backbone_cable_id: string | null
          connection_type: string | null
          created_at: string
          from_frame_id: string | null
          from_port: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          organization_id: string | null
          redundancy_group: string | null
          to_frame_id: string | null
          to_port: string | null
          updated_at: string
        }
        Insert: {
          backbone_cable_id?: string | null
          connection_type?: string | null
          created_at?: string
          from_frame_id?: string | null
          from_port?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          organization_id?: string | null
          redundancy_group?: string | null
          to_frame_id?: string | null
          to_port?: string | null
          updated_at?: string
        }
        Update: {
          backbone_cable_id?: string | null
          connection_type?: string | null
          created_at?: string
          from_frame_id?: string | null
          from_port?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          organization_id?: string | null
          redundancy_group?: string | null
          to_frame_id?: string | null
          to_port?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cable_connections_backbone_cable_id_fkey"
            columns: ["backbone_cable_id"]
            isOneToOne: false
            referencedRelation: "backbone_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cable_connections_from_frame_id_fkey"
            columns: ["from_frame_id"]
            isOneToOne: false
            referencedRelation: "distribution_frames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cable_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cable_connections_to_frame_id_fkey"
            columns: ["to_frame_id"]
            isOneToOne: false
            referencedRelation: "distribution_frames"
            referencedColumns: ["id"]
          },
        ]
      }
      cable_junction_boxes: {
        Row: {
          backbone_cable_id: string | null
          created_at: string
          floor: number
          id: string
          junction_type: string
          label: string
          location_id: string | null
          notes: string | null
          organization_id: string | null
          updated_at: string
          x_coordinate: number | null
          y_coordinate: number | null
        }
        Insert: {
          backbone_cable_id?: string | null
          created_at?: string
          floor: number
          id?: string
          junction_type?: string
          label: string
          location_id?: string | null
          notes?: string | null
          organization_id?: string | null
          updated_at?: string
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Update: {
          backbone_cable_id?: string | null
          created_at?: string
          floor?: number
          id?: string
          junction_type?: string
          label?: string
          location_id?: string | null
          notes?: string | null
          organization_id?: string | null
          updated_at?: string
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cable_junction_boxes_backbone_cable_id_fkey"
            columns: ["backbone_cable_id"]
            isOneToOne: false
            referencedRelation: "backbone_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cable_junction_boxes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cable_junction_boxes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cable_segments: {
        Row: {
          cable_run_id: string
          created_at: string
          destination_equipment: string
          destination_floor: number | null
          id: string
          notes: string | null
          organization_id: string | null
          origin_equipment: string
          origin_floor: number | null
          segment_label: string
          segment_order: number
          updated_at: string
        }
        Insert: {
          cable_run_id: string
          created_at?: string
          destination_equipment: string
          destination_floor?: number | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          origin_equipment: string
          origin_floor?: number | null
          segment_label: string
          segment_order: number
          updated_at?: string
        }
        Update: {
          cable_run_id?: string
          created_at?: string
          destination_equipment?: string
          destination_floor?: number | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          origin_equipment?: string
          origin_floor?: number | null
          segment_label?: string
          segment_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cable_segments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_drawings: {
        Row: {
          canvas_data: Json
          created_at: string
          created_by: string | null
          floor_number: number
          id: string
          location_id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          canvas_data?: Json
          created_at?: string
          created_by?: string | null
          floor_number: number
          id?: string
          location_id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          canvas_data?: Json
          created_at?: string
          created_by?: string | null
          floor_number?: number
          id?: string
          location_id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_drawings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_drawings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      capacity_alerts: {
        Row: {
          alert_message: string | null
          alert_type: string
          component_id: string | null
          component_type: string
          created_at: string | null
          current_utilization: number | null
          id: string
          is_resolved: boolean | null
          location_id: string | null
          max_capacity: number | null
          organization_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          threshold_percentage: number | null
        }
        Insert: {
          alert_message?: string | null
          alert_type: string
          component_id?: string | null
          component_type: string
          created_at?: string | null
          current_utilization?: number | null
          id?: string
          is_resolved?: boolean | null
          location_id?: string | null
          max_capacity?: number | null
          organization_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          threshold_percentage?: number | null
        }
        Update: {
          alert_message?: string | null
          alert_type?: string
          component_id?: string | null
          component_type?: string
          created_at?: string | null
          current_utilization?: number | null
          id?: string
          is_resolved?: boolean | null
          location_id?: string | null
          max_capacity?: number | null
          organization_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          threshold_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "capacity_alerts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capacity_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capacity_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      change_logs: {
        Row: {
          change_description: string | null
          change_type: string
          component_id: string | null
          component_type: string
          id: string
          location_id: string | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string | null
          status: string | null
          technician_id: string | null
          timestamp: string | null
          work_order_id: string | null
        }
        Insert: {
          change_description?: string | null
          change_type: string
          component_id?: string | null
          component_type: string
          id?: string
          location_id?: string | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          status?: string | null
          technician_id?: string | null
          timestamp?: string | null
          work_order_id?: string | null
        }
        Update: {
          change_description?: string | null
          change_type?: string
          component_id?: string | null
          component_type?: string
          id?: string
          location_id?: string | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          status?: string | null
          technician_id?: string | null
          timestamp?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_logs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_logs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string
          organization_id: string | null
          room_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string
          organization_id?: string | null
          room_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          organization_id?: string | null
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          organization_id: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invitations: {
        Row: {
          accepted_at: string | null
          client_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          invitation_token: string | null
          invited_by: string | null
          invited_email: string
          organization_id: string | null
          organization_id_scope: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          invited_email: string
          organization_id?: string | null
          organization_id_scope?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          invited_email?: string
          organization_id?: string | null
          organization_id_scope?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invitations_organization_id_scope_fkey"
            columns: ["organization_id_scope"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_users: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          invited_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          billing_address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          linked_organization_id: string | null
          name: string
          organization_id: string | null
          slug: string | null
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
          linked_organization_id?: string | null
          name: string
          organization_id?: string | null
          slug?: string | null
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
          linked_organization_id?: string | null
          name?: string
          organization_id?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_linked_organization_id_fkey"
            columns: ["linked_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          billing_frequency: string
          client_id: string | null
          client_signature_url: string | null
          company_signature_url: string | null
          contract_number: string
          contract_type: string
          contract_value: number
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          organization_id: string | null
          signed_by_client: string | null
          signed_by_company: string | null
          signed_date: string | null
          start_date: string
          status: string
          terms_and_conditions: string | null
          title: string
          updated_at: string
        }
        Insert: {
          billing_frequency?: string
          client_id?: string | null
          client_signature_url?: string | null
          company_signature_url?: string | null
          contract_number: string
          contract_type?: string
          contract_value?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          organization_id?: string | null
          signed_by_client?: string | null
          signed_by_company?: string | null
          signed_date?: string | null
          start_date: string
          status?: string
          terms_and_conditions?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          billing_frequency?: string
          client_id?: string | null
          client_signature_url?: string | null
          company_signature_url?: string | null
          contract_number?: string
          contract_type?: string
          contract_value?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          organization_id?: string | null
          signed_by_client?: string | null
          signed_by_company?: string | null
          signed_date?: string | null
          start_date?: string
          status?: string
          terms_and_conditions?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          created_by: string | null
          id: string
          location_id: string
          note_text: string
          organization_id: string | null
          priority: string
          status: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id: string
          note_text: string
          organization_id?: string | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string
          note_text?: string
          organization_id?: string | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          created_at: string
          crew_members: string[] | null
          employee_id: string | null
          hours_worked: number | null
          id: string
          issues_encountered: string | null
          location_id: string | null
          log_date: string
          materials_used: Json | null
          organization_id: string | null
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
          employee_id?: string | null
          hours_worked?: number | null
          id?: string
          issues_encountered?: string | null
          location_id?: string | null
          log_date: string
          materials_used?: Json | null
          organization_id?: string | null
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
          employee_id?: string | null
          hours_worked?: number | null
          id?: string
          issues_encountered?: string | null
          location_id?: string | null
          log_date?: string
          materials_used?: Json | null
          organization_id?: string | null
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
            foreignKeyName: "daily_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      device_ports: {
        Row: {
          connected_device_id: string | null
          connected_port_number: number | null
          created_at: string | null
          description: string | null
          device_id: string | null
          id: string
          mac_address: string | null
          organization_id: string | null
          port_name: string | null
          port_number: number
          port_speed: string | null
          port_status: string | null
          port_type: string | null
          updated_at: string | null
        }
        Insert: {
          connected_device_id?: string | null
          connected_port_number?: number | null
          created_at?: string | null
          description?: string | null
          device_id?: string | null
          id?: string
          mac_address?: string | null
          organization_id?: string | null
          port_name?: string | null
          port_number: number
          port_speed?: string | null
          port_status?: string | null
          port_type?: string | null
          updated_at?: string | null
        }
        Update: {
          connected_device_id?: string | null
          connected_port_number?: number | null
          created_at?: string | null
          description?: string | null
          device_id?: string | null
          id?: string
          mac_address?: string | null
          organization_id?: string | null
          port_name?: string | null
          port_number?: number
          port_speed?: string | null
          port_status?: string | null
          port_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_ports_connected_device_id_fkey"
            columns: ["connected_device_id"]
            isOneToOne: false
            referencedRelation: "network_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_ports_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "network_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_ports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_frames: {
        Row: {
          capacity: number | null
          created_at: string
          equipment_details: Json | null
          floor: number
          frame_type: string
          id: string
          location_id: string | null
          name: string | null
          notes: string | null
          organization_id: string | null
          patch_panels: Json | null
          port_count: number | null
          rack_position: number | null
          room: string | null
          updated_at: string
          x_coordinate: number | null
          y_coordinate: number | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          equipment_details?: Json | null
          floor: number
          frame_type: string
          id?: string
          location_id?: string | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          patch_panels?: Json | null
          port_count?: number | null
          rack_position?: number | null
          room?: string | null
          updated_at?: string
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          equipment_details?: Json | null
          floor?: number
          frame_type?: string
          id?: string
          location_id?: string | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          patch_panels?: Json | null
          port_count?: number | null
          rack_position?: number | null
          room?: string | null
          updated_at?: string
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_frames_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_frames_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_files: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          document_category: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          location_id: string | null
          organization_id: string | null
          standards_reference: string | null
          tags: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_category?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          location_id?: string | null
          organization_id?: string | null
          standards_reference?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_category?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string | null
          standards_reference?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentation_files_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_files_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_point_photos: {
        Row: {
          annotation_data: Json | null
          annotation_metadata: Json | null
          created_at: string
          description: string | null
          drop_point_id: string
          employee_id: string | null
          id: string
          organization_id: string | null
          photo_type: string | null
          photo_url: string
          storage_bucket: string | null
          updated_at: string
        }
        Insert: {
          annotation_data?: Json | null
          annotation_metadata?: Json | null
          created_at?: string
          description?: string | null
          drop_point_id: string
          employee_id?: string | null
          id?: string
          organization_id?: string | null
          photo_type?: string | null
          photo_url: string
          storage_bucket?: string | null
          updated_at?: string
        }
        Update: {
          annotation_data?: Json | null
          annotation_metadata?: Json | null
          created_at?: string
          description?: string | null
          drop_point_id?: string
          employee_id?: string | null
          id?: string
          organization_id?: string | null
          photo_type?: string | null
          photo_url?: string
          storage_bucket?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_point_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_drop_point_photos_drop_point"
            columns: ["drop_point_id"]
            isOneToOne: false
            referencedRelation: "drop_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_drop_point_photos_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_points: {
        Row: {
          cable_count: number | null
          cable_id: string | null
          created_at: string
          floor: number | null
          id: string
          installed_by: string | null
          installed_date: string | null
          ip_address: unknown
          is_locked: boolean | null
          label: string | null
          location_id: string | null
          locked_at: string | null
          locked_by: string | null
          locking_mechanism: string | null
          mac_address: string | null
          notes: string | null
          organization_id: string | null
          patch_panel_config: Json | null
          patch_panel_port: string | null
          point_type: string | null
          rex_devices: string[] | null
          room: string | null
          status: string | null
          switch_port: string | null
          test_results: Json | null
          tested_by: string | null
          tested_date: string | null
          trade: Database["public"]["Enums"]["trade_type"] | null
          type_specific_data: Json | null
          updated_at: string
          vlan: string | null
          x_coordinate: number | null
          y_coordinate: number | null
        }
        Insert: {
          cable_count?: number | null
          cable_id?: string | null
          created_at?: string
          floor?: number | null
          id?: string
          installed_by?: string | null
          installed_date?: string | null
          ip_address?: unknown
          is_locked?: boolean | null
          label?: string | null
          location_id?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locking_mechanism?: string | null
          mac_address?: string | null
          notes?: string | null
          organization_id?: string | null
          patch_panel_config?: Json | null
          patch_panel_port?: string | null
          point_type?: string | null
          rex_devices?: string[] | null
          room?: string | null
          status?: string | null
          switch_port?: string | null
          test_results?: Json | null
          tested_by?: string | null
          tested_date?: string | null
          trade?: Database["public"]["Enums"]["trade_type"] | null
          type_specific_data?: Json | null
          updated_at?: string
          vlan?: string | null
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Update: {
          cable_count?: number | null
          cable_id?: string | null
          created_at?: string
          floor?: number | null
          id?: string
          installed_by?: string | null
          installed_date?: string | null
          ip_address?: unknown
          is_locked?: boolean | null
          label?: string | null
          location_id?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locking_mechanism?: string | null
          mac_address?: string | null
          notes?: string | null
          organization_id?: string | null
          patch_panel_config?: Json | null
          patch_panel_port?: string | null
          point_type?: string | null
          rex_devices?: string[] | null
          room?: string | null
          status?: string | null
          switch_port?: string | null
          test_results?: Json | null
          tested_by?: string | null
          tested_date?: string | null
          trade?: Database["public"]["Enums"]["trade_type"] | null
          type_specific_data?: Json | null
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
            foreignKeyName: "drop_points_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      dropdown_options: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          is_active: boolean
          metadata: Json | null
          option_key: string
          option_value: string
          organization_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          option_key: string
          option_value: string
          organization_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          option_key?: string
          option_value?: string
          organization_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropdown_options_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          reason?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_availability_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          project_id?: string | null
          schedule_date?: string
          schedule_type?: string
          start_time?: string
          status?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
          phone: string | null
          role: string
          skills: string[] | null
          status: string | null
          updated_at: string
          user_id: string | null
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
          organization_id?: string | null
          phone?: string | null
          role: string
          skills?: string[] | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
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
          organization_id?: string | null
          phone?: string | null
          role?: string
          skills?: string[] | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "equipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_published: boolean | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_credentials: {
        Row: {
          created_at: string | null
          encrypted_credentials: string | null
          id: string
          integration_type: string
          is_active: boolean | null
          last_error: string | null
          last_verified_at: string | null
          organization_id: string
          phone_number: string | null
          settings: Json | null
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_credentials?: string | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          last_error?: string | null
          last_verified_at?: string | null
          organization_id: string
          phone_number?: string | null
          settings?: Json | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_credentials?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_error?: string | null
          last_verified_at?: string | null
          organization_id?: string
          phone_number?: string | null
          settings?: Json | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          alternate_supplier_ids: string[] | null
          average_cost: number | null
          category: string
          created_at: string
          current_stock: number
          description: string | null
          id: string
          last_purchase_price: number | null
          last_restock_date: string | null
          last_used_date: string | null
          location_id: string | null
          maximum_stock: number | null
          minimum_stock: number
          name: string
          organization_id: string | null
          preferred_supplier_id: string | null
          reorder_point: number
          sku: string | null
          status: string
          unit_cost: number | null
          unit_of_measure: string
          updated_at: string
          warehouse_location: string | null
        }
        Insert: {
          alternate_supplier_ids?: string[] | null
          average_cost?: number | null
          category: string
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          last_purchase_price?: number | null
          last_restock_date?: string | null
          last_used_date?: string | null
          location_id?: string | null
          maximum_stock?: number | null
          minimum_stock?: number
          name: string
          organization_id?: string | null
          preferred_supplier_id?: string | null
          reorder_point?: number
          sku?: string | null
          status?: string
          unit_cost?: number | null
          unit_of_measure?: string
          updated_at?: string
          warehouse_location?: string | null
        }
        Update: {
          alternate_supplier_ids?: string[] | null
          average_cost?: number | null
          category?: string
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          last_purchase_price?: number | null
          last_restock_date?: string | null
          last_used_date?: string | null
          location_id?: string | null
          maximum_stock?: number | null
          minimum_stock?: number
          name?: string
          organization_id?: string | null
          preferred_supplier_id?: string | null
          reorder_point?: number
          sku?: string | null
          status?: string
          unit_cost?: number | null
          unit_of_measure?: string
          updated_at?: string
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          application_url: string | null
          benefits: string[] | null
          created_at: string
          department: string
          description: string
          employment_type: string
          id: string
          is_active: boolean | null
          location: string
          requirements: string[] | null
          salary_range: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_url?: string | null
          benefits?: string[] | null
          created_at?: string
          department: string
          description: string
          employment_type?: string
          id?: string
          is_active?: boolean | null
          location?: string
          requirements?: string[] | null
          salary_range?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_url?: string | null
          benefits?: string[] | null
          created_at?: string
          department?: string
          description?: string
          employment_type?: string
          id?: string
          is_active?: boolean | null
          location?: string
          requirements?: string[] | null
          salary_range?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_captures: {
        Row: {
          assigned_to: string | null
          company_name: string | null
          company_size: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          industry: string | null
          last_name: string | null
          message: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          industry?: string | null
          last_name?: string | null
          message?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          industry?: string | null
          last_name?: string | null
          message?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      location_access_grants: {
        Row: {
          access_level: string
          created_at: string
          granted_by: string | null
          granted_client_id: string | null
          granted_organization_id: string | null
          id: string
          location_id: string
          location_organization_id: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          granted_by?: string | null
          granted_client_id?: string | null
          granted_organization_id?: string | null
          id?: string
          location_id: string
          location_organization_id?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          access_level?: string
          created_at?: string
          granted_by?: string | null
          granted_client_id?: string | null
          granted_organization_id?: string | null
          id?: string
          location_id?: string
          location_organization_id?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_access_grants_granted_client_id_fkey"
            columns: ["granted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_access_grants_granted_organization_id_fkey"
            columns: ["granted_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_access_grants_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_access_grants_location_organization_id_fkey"
            columns: ["location_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_requests: {
        Row: {
          access_instructions: string | null
          address: string
          building_type: string | null
          client_id: string
          contact_onsite: string | null
          contact_phone: string | null
          created_at: string | null
          floors: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string
          service_request_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          access_instructions?: string | null
          address: string
          building_type?: string | null
          client_id: string
          contact_onsite?: string | null
          contact_phone?: string | null
          created_at?: string | null
          floors?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id: string
          service_request_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          access_instructions?: string | null
          address?: string
          building_type?: string | null
          client_id?: string
          contact_onsite?: string | null
          contact_phone?: string | null
          created_at?: string | null
          floors?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string
          service_request_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_requests_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          access_instructions: string | null
          address: string
          building_type: string | null
          client_id: string | null
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
          organization_id: string | null
          project_id: string | null
          status: string | null
          total_square_feet: number | null
          updated_at: string
        }
        Insert: {
          access_instructions?: string | null
          address: string
          building_type?: string | null
          client_id?: string | null
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
          organization_id?: string | null
          project_id?: string | null
          status?: string | null
          total_square_feet?: number | null
          updated_at?: string
        }
        Update: {
          access_instructions?: string | null
          address?: string
          building_type?: string | null
          client_id?: string | null
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
          organization_id?: string | null
          project_id?: string | null
          status?: string | null
          total_square_feet?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          assigned_technician_id: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          id: string
          location_id: string | null
          organization_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          service_plan_id: string | null
          status: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          assigned_technician_id?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          organization_id?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          service_plan_id?: string | null
          status?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          assigned_technician_id?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          organization_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          service_plan_id?: string | null
          status?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_service_plan_id_fkey"
            columns: ["service_plan_id"]
            isOneToOne: false
            referencedRelation: "service_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      network_devices: {
        Row: {
          created_at: string | null
          device_details: Json | null
          device_name: string
          device_type: string
          firmware_version: string | null
          id: string
          ip_address: unknown
          location_id: string | null
          mac_address: string | null
          management_url: string | null
          manufacturer: string | null
          model: string | null
          organization_id: string | null
          poe_status: string | null
          port_count: number | null
          rack_id: string | null
          rack_position: number | null
          serial_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_details?: Json | null
          device_name: string
          device_type: string
          firmware_version?: string | null
          id?: string
          ip_address?: unknown
          location_id?: string | null
          mac_address?: string | null
          management_url?: string | null
          manufacturer?: string | null
          model?: string | null
          organization_id?: string | null
          poe_status?: string | null
          port_count?: number | null
          rack_id?: string | null
          rack_position?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_details?: Json | null
          device_name?: string
          device_type?: string
          firmware_version?: string | null
          id?: string
          ip_address?: unknown
          location_id?: string | null
          mac_address?: string | null
          management_url?: string | null
          manufacturer?: string | null
          model?: string | null
          organization_id?: string | null
          poe_status?: string | null
          port_count?: number | null
          rack_id?: string | null
          rack_position?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_devices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_devices_rack_id_fkey"
            columns: ["rack_id"]
            isOneToOne: false
            referencedRelation: "racks"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          email_on_new_request: boolean | null
          email_on_status_change: boolean | null
          id: string
          new_service_request: boolean | null
          organization_id: string | null
          request_status_change: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          email_on_new_request?: boolean | null
          email_on_status_change?: boolean | null
          id?: string
          new_service_request?: boolean | null
          organization_id?: string | null
          request_status_change?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          email_on_new_request?: boolean | null
          email_on_status_change?: boolean | null
          id?: string
          new_service_request?: boolean | null
          organization_id?: string | null
          request_status_change?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_template: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          organization_id: string | null
          subject_template: string | null
          template_name: string
          template_type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_template: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          subject_template?: string | null
          template_name: string
          template_type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_template?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          subject_template?: string | null
          template_name?: string
          template_type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          organization_id: string | null
          read_at: string | null
          sent_via_twilio: boolean | null
          service_request_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          organization_id?: string | null
          read_at?: string | null
          sent_via_twilio?: boolean | null
          service_request_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          organization_id?: string | null
          read_at?: string | null
          sent_via_twilio?: boolean | null
          service_request_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_responses: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          response_data: Json
          step_name: string
          step_number: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          response_data?: Json
          step_name: string
          step_number: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          response_data?: Json
          step_name?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_captures"
            referencedColumns: ["id"]
          },
        ]
      }
      openphone_call_logs: {
        Row: {
          call_status: string | null
          contact_id: string | null
          contact_type: string | null
          created_at: string
          direction: string
          disposition: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          notes: string | null
          openphone_call_id: string
          organization_id: string
          phone_number: string
          recording_url: string | null
          started_at: string
          transcription: string | null
          updated_at: string
          work_order_created: string | null
        }
        Insert: {
          call_status?: string | null
          contact_id?: string | null
          contact_type?: string | null
          created_at?: string
          direction: string
          disposition?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          openphone_call_id: string
          organization_id: string
          phone_number: string
          recording_url?: string | null
          started_at: string
          transcription?: string | null
          updated_at?: string
          work_order_created?: string | null
        }
        Update: {
          call_status?: string | null
          contact_id?: string | null
          contact_type?: string | null
          created_at?: string
          direction?: string
          disposition?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          openphone_call_id?: string
          organization_id?: string
          phone_number?: string
          recording_url?: string | null
          started_at?: string
          transcription?: string | null
          updated_at?: string
          work_order_created?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "openphone_call_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "openphone_call_logs_work_order_created_fkey"
            columns: ["work_order_created"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_trades: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          trade: Database["public"]["Enums"]["trade_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          trade: Database["public"]["Enums"]["trade_type"]
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          trade?: Database["public"]["Enums"]["trade_type"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_trades_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          owner_id: string | null
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: Json | null
          created_at: string
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          page_slug: string
          page_title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          page_slug: string
          page_title: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          page_slug?: string
          page_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      patch_connections: {
        Row: {
          cable_type: string | null
          connection_status: string | null
          created_at: string | null
          from_frame_id: string | null
          from_port: number
          id: string
          notes: string | null
          organization_id: string | null
          patch_cable_id: string | null
          signal_strength: number | null
          test_results: Json | null
          to_frame_id: string | null
          to_port: number
          updated_at: string | null
        }
        Insert: {
          cable_type?: string | null
          connection_status?: string | null
          created_at?: string | null
          from_frame_id?: string | null
          from_port: number
          id?: string
          notes?: string | null
          organization_id?: string | null
          patch_cable_id?: string | null
          signal_strength?: number | null
          test_results?: Json | null
          to_frame_id?: string | null
          to_port: number
          updated_at?: string | null
        }
        Update: {
          cable_type?: string | null
          connection_status?: string | null
          created_at?: string | null
          from_frame_id?: string | null
          from_port?: number
          id?: string
          notes?: string | null
          organization_id?: string | null
          patch_cable_id?: string | null
          signal_strength?: number | null
          test_results?: Json | null
          to_frame_id?: string | null
          to_port?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patch_connections_from_frame_id_fkey"
            columns: ["from_frame_id"]
            isOneToOne: false
            referencedRelation: "distribution_frames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patch_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patch_connections_to_frame_id_fkey"
            columns: ["to_frame_id"]
            isOneToOne: false
            referencedRelation: "distribution_frames"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_number_org_mapping: {
        Row: {
          created_at: string | null
          id: string
          integration_type: string
          is_active: boolean | null
          organization_id: string
          phone_number: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          organization_id: string
          phone_number: string
        }
        Update: {
          created_at?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          organization_id?: string
          phone_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_number_org_mapping_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["platform_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      port_vlan_assignments: {
        Row: {
          assignment_type: string | null
          created_at: string | null
          device_id: string | null
          id: string
          native_vlan: boolean | null
          organization_id: string | null
          port_number: number
          updated_at: string | null
          vlan_id: string | null
        }
        Insert: {
          assignment_type?: string | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          native_vlan?: boolean | null
          organization_id?: string | null
          port_number: number
          updated_at?: string | null
          vlan_id?: string | null
        }
        Update: {
          assignment_type?: string | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          native_vlan?: boolean | null
          organization_id?: string | null
          port_number?: number
          updated_at?: string | null
          vlan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "port_vlan_assignments_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "network_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "port_vlan_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "port_vlan_assignments_vlan_id_fkey"
            columns: ["vlan_id"]
            isOneToOne: false
            referencedRelation: "vlans"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_features: {
        Row: {
          created_at: string | null
          feature_name: string
          feature_value: string | null
          id: string
          is_included: boolean | null
          plan_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          feature_value?: string | null
          id?: string
          is_included?: boolean | null
          plan_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          feature_value?: string | null
          id?: string
          is_included?: boolean | null
          plan_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_enterprise: boolean | null
          is_popular: boolean | null
          max_locations: number | null
          max_users: number | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_enterprise?: boolean | null
          is_popular?: boolean | null
          max_locations?: number | null
          max_users?: number | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_enterprise?: boolean | null
          is_popular?: boolean | null
          max_locations?: number | null
          max_users?: number | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      procurement_approvals: {
        Row: {
          approval_level: number
          approved_at: string | null
          approver_id: string | null
          comments: string | null
          created_at: string
          id: string
          organization_id: string | null
          purchase_order_id: string | null
          rejection_reason: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          approval_level?: number
          approved_at?: string | null
          approver_id?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          purchase_order_id?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          approval_level?: number
          approved_at?: string | null
          approver_id?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          purchase_order_id?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurement_approvals_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          organization_id: string | null
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          inventory_item_id: string | null
          item_code: string | null
          item_name: string
          line_total: number
          organization_id: string | null
          purchase_order_id: string | null
          quantity: number
          received_quantity: number | null
          supplier_catalog_id: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          inventory_item_id?: string | null
          item_code?: string | null
          item_name: string
          line_total?: number
          organization_id?: string | null
          purchase_order_id?: string | null
          quantity?: number
          received_quantity?: number | null
          supplier_catalog_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          inventory_item_id?: string | null
          item_code?: string | null
          item_name?: string
          line_total?: number
          organization_id?: string | null
          purchase_order_id?: string | null
          quantity?: number
          received_quantity?: number | null
          supplier_catalog_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_supplier_catalog_id_fkey"
            columns: ["supplier_catalog_id"]
            isOneToOne: false
            referencedRelation: "supplier_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          approved_by: string | null
          billing_address: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          expected_delivery_date: string | null
          id: string
          location_id: string | null
          notes: string | null
          order_date: string | null
          organization_id: string | null
          po_number: string
          shipping_address: string | null
          shipping_cost: number | null
          status: string | null
          subtotal: number | null
          supplier_id: string | null
          tax_amount: number | null
          terms_and_conditions: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          actual_delivery_date?: string | null
          approved_by?: string | null
          billing_address?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          expected_delivery_date?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          order_date?: string | null
          organization_id?: string | null
          po_number: string
          shipping_address?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          terms_and_conditions?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          actual_delivery_date?: string | null
          approved_by?: string | null
          billing_address?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          expected_delivery_date?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          order_date?: string | null
          organization_id?: string | null
          po_number?: string
          shipping_address?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          terms_and_conditions?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "quality_checklist_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "quality_checklist_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_checklists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      racks: {
        Row: {
          cooling_required: boolean | null
          created_at: string
          floor: number | null
          id: string
          location_id: string | null
          notes: string | null
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "racks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      riser_pathways: {
        Row: {
          created_at: string
          fire_stops: Json | null
          floors_served: number[] | null
          id: string
          location_id: string | null
          notes: string | null
          organization_id: string | null
          pathway_capacity: number | null
          pathway_name: string
          pathway_type: string
          updated_at: string
          utilization_percentage: number | null
          x_coordinate: number | null
          y_coordinate: number | null
        }
        Insert: {
          created_at?: string
          fire_stops?: Json | null
          floors_served?: number[] | null
          id?: string
          location_id?: string | null
          notes?: string | null
          organization_id?: string | null
          pathway_capacity?: number | null
          pathway_name: string
          pathway_type: string
          updated_at?: string
          utilization_percentage?: number | null
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Update: {
          created_at?: string
          fire_stops?: Json | null
          floors_served?: number[] | null
          id?: string
          location_id?: string | null
          notes?: string | null
          organization_id?: string | null
          pathway_capacity?: number | null
          pathway_name?: string
          pathway_type?: string
          updated_at?: string
          utilization_percentage?: number | null
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "riser_pathways_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riser_pathways_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      room_view_photos: {
        Row: {
          annotation_data: string | null
          annotation_metadata: Json | null
          created_at: string
          description: string | null
          employee_id: string | null
          id: string
          organization_id: string | null
          photo_type: string | null
          photo_url: string
          room_view_id: string
          storage_bucket: string | null
          updated_at: string
        }
        Insert: {
          annotation_data?: string | null
          annotation_metadata?: Json | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          organization_id?: string | null
          photo_type?: string | null
          photo_url: string
          room_view_id: string
          storage_bucket?: string | null
          updated_at?: string
        }
        Update: {
          annotation_data?: string | null
          annotation_metadata?: Json | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          organization_id?: string | null
          photo_type?: string | null
          photo_url?: string
          room_view_id?: string
          storage_bucket?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_view_photos_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_view_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_view_photos_room_view_id_fkey"
            columns: ["room_view_id"]
            isOneToOne: false
            referencedRelation: "room_views"
            referencedColumns: ["id"]
          },
        ]
      }
      room_views: {
        Row: {
          ceiling_height: number | null
          ceiling_height_unit: string | null
          created_at: string
          description: string | null
          employee_id: string | null
          floor: number
          id: string
          location_id: string
          organization_id: string | null
          photo_url: string
          room_name: string | null
          updated_at: string
          x_coordinate: number
          y_coordinate: number
        }
        Insert: {
          ceiling_height?: number | null
          ceiling_height_unit?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          floor?: number
          id?: string
          location_id: string
          organization_id?: string | null
          photo_url: string
          room_name?: string | null
          updated_at?: string
          x_coordinate: number
          y_coordinate: number
        }
        Update: {
          ceiling_height?: number | null
          ceiling_height_unit?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          floor?: number
          id?: string
          location_id?: string
          organization_id?: string | null
          photo_url?: string
          room_name?: string | null
          updated_at?: string
          x_coordinate?: number
          y_coordinate?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_views_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_views_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "safety_checklist_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "safety_checklist_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_checklists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "safety_incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          project_id?: string | null
          start_time?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_plans: {
        Row: {
          contract_id: string | null
          created_at: string
          description: string | null
          equipment_covered: Json | null
          id: string
          is_active: boolean
          locations_covered: string[] | null
          organization_id: string | null
          plan_name: string
          service_duration_hours: number | null
          service_frequency: string
          updated_at: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          description?: string | null
          equipment_covered?: Json | null
          id?: string
          is_active?: boolean
          locations_covered?: string[] | null
          organization_id?: string | null
          plan_name: string
          service_duration_hours?: number | null
          service_frequency?: string
          updated_at?: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          description?: string | null
          equipment_covered?: Json | null
          id?: string
          is_active?: boolean
          locations_covered?: string[] | null
          organization_id?: string | null
          plan_name?: string
          service_duration_hours?: number | null
          service_frequency?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_plans_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          created_at: string | null
          description: string | null
          drop_point_id: string | null
          id: string
          location_id: string | null
          parent_organization_id: string
          priority: string | null
          request_type: string
          requested_by: string
          requesting_organization_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          title: string
          updated_at: string | null
          work_order_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          drop_point_id?: string | null
          id?: string
          location_id?: string | null
          parent_organization_id: string
          priority?: string | null
          request_type?: string
          requested_by: string
          requesting_organization_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          work_order_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          drop_point_id?: string | null
          id?: string
          location_id?: string | null
          parent_organization_id?: string
          priority?: string | null
          request_type?: string
          requested_by?: string
          requesting_organization_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_drop_point_id_fkey"
            columns: ["drop_point_id"]
            isOneToOne: false
            referencedRelation: "drop_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_requesting_organization_id_fkey"
            columns: ["requesting_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organization_id: string | null
          related_id: string
          related_table: string
          signature_data: string
          signature_type: string
          signed_at: string
          signer_name: string | null
          signer_role: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string | null
          related_id: string
          related_table: string
          signature_data: string
          signature_type: string
          signed_at?: string
          signer_name?: string | null
          signer_role?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string | null
          related_id?: string
          related_table?: string
          signature_data?: string
          signature_type?: string
          signed_at?: string
          signer_name?: string | null
          signer_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signatures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string | null
          id: string
          inventory_item_id: string
          notes: string | null
          organization_id: string | null
          project_id: string | null
          purchase_order_id: string | null
          quantity: number
          reference_number: string | null
          supplier_id: string | null
          total_cost: number | null
          transaction_date: string
          transaction_type: string
          unit_cost: number | null
          work_order_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          inventory_item_id: string
          notes?: string | null
          organization_id?: string | null
          project_id?: string | null
          purchase_order_id?: string | null
          quantity: number
          reference_number?: string | null
          supplier_id?: string | null
          total_cost?: number | null
          transaction_date?: string
          transaction_type: string
          unit_cost?: number | null
          work_order_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          inventory_item_id?: string
          notes?: string | null
          organization_id?: string | null
          project_id?: string | null
          purchase_order_id?: string | null
          quantity?: number
          reference_number?: string | null
          supplier_id?: string | null
          total_cost?: number | null
          transaction_date?: string
          transaction_type?: string
          unit_cost?: number | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_billing: {
        Row: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          contract_id: string | null
          created_at: string
          due_date: string | null
          id: string
          invoice_date: string | null
          organization_id: string | null
          paid_date: string | null
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          contract_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          organization_id?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_period_end?: string
          billing_period_start?: string
          contract_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          organization_id?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_billing_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_billing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_catalogs: {
        Row: {
          availability_status: string | null
          category: string | null
          created_at: string
          currency: string | null
          custom_fields: Json | null
          description: string | null
          id: string
          item_code: string | null
          item_name: string
          last_price_update: string | null
          lead_time_days: number | null
          minimum_order_quantity: number | null
          organization_id: string | null
          supplier_id: string | null
          unit_price: number
          upc_code: string | null
          updated_at: string
        }
        Insert: {
          availability_status?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          item_code?: string | null
          item_name: string
          last_price_update?: string | null
          lead_time_days?: number | null
          minimum_order_quantity?: number | null
          organization_id?: string | null
          supplier_id?: string | null
          unit_price?: number
          upc_code?: string | null
          updated_at?: string
        }
        Update: {
          availability_status?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          item_code?: string | null
          item_name?: string
          last_price_update?: string | null
          lead_time_days?: number | null
          minimum_order_quantity?: number | null
          organization_id?: string | null
          supplier_id?: string | null
          unit_price?: number
          upc_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_catalogs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_catalogs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_price_history: {
        Row: {
          change_reason: string | null
          created_at: string
          effective_date: string | null
          id: string
          new_price: number
          old_price: number
          organization_id: string | null
          price_change_percentage: number | null
          supplier_catalog_id: string | null
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          new_price: number
          old_price: number
          organization_id?: string | null
          price_change_percentage?: number | null
          supplier_catalog_id?: string | null
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          new_price?: number
          old_price?: number
          organization_id?: string | null
          price_change_percentage?: number | null
          supplier_catalog_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_price_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_price_history_supplier_catalog_id_fkey"
            columns: ["supplier_catalog_id"]
            isOneToOne: false
            referencedRelation: "supplier_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string | null
          payment_terms: string | null
          status: string | null
          supplier_code: string | null
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id?: string | null
          payment_terms?: string | null
          status?: string | null
          supplier_code?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string | null
          payment_terms?: string | null
          status?: string | null
          supplier_code?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          created_at: string
          data: Json
          error_message: string | null
          id: string
          operation: string
          organization_id: string | null
          record_id: string
          sync_attempted_at: string | null
          synced: boolean
          table_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          error_message?: string | null
          id?: string
          operation: string
          organization_id?: string | null
          record_id: string
          sync_attempted_at?: string | null
          synced?: boolean
          table_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          error_message?: string | null
          id?: string
          operation?: string
          organization_id?: string | null
          record_id?: string
          sync_attempted_at?: string | null
          synced?: boolean
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configurations: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          data_type: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          organization_id: string | null
          updated_at: string
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          data_type?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          organization_id?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          data_type?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          organization_id?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          created_at: string
          drop_point_id: string | null
          equipment_used: string | null
          id: string
          notes: string | null
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "test_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      test_results_files: {
        Row: {
          created_at: string | null
          drop_point_id: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          notes: string | null
          organization_id: string | null
          test_type: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          drop_point_id: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          test_type?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          drop_point_id?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          test_type?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_files_drop_point_id_fkey"
            columns: ["drop_point_id"]
            isOneToOne: false
            referencedRelation: "drop_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author_name: string
          author_title: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          quote: string
          rating: number | null
          sort_order: number | null
        }
        Insert: {
          author_name: string
          author_title?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          quote: string
          rating?: number | null
          sort_order?: number | null
        }
        Update: {
          author_name?: string
          author_title?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          quote?: string
          rating?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      tool_checkouts: {
        Row: {
          actual_return_date: string | null
          checkout_date: string
          condition_in: string | null
          condition_out: string | null
          created_at: string
          employee_id: string
          expected_return_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          project_id: string | null
          status: string
          tool_id: string
          updated_at: string
        }
        Insert: {
          actual_return_date?: string | null
          checkout_date?: string
          condition_in?: string | null
          condition_out?: string | null
          created_at?: string
          employee_id: string
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          project_id?: string | null
          status?: string
          tool_id: string
          updated_at?: string
        }
        Update: {
          actual_return_date?: string | null
          checkout_date?: string
          condition_in?: string | null
          condition_out?: string | null
          created_at?: string
          employee_id?: string
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          project_id?: string | null
          status?: string
          tool_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_checkouts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_checkouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_checkouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_checkouts_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      tradetube_content: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          file_size: number | null
          file_url: string
          folder_id: string | null
          id: string
          is_featured: boolean | null
          media_type: string
          organization_id: string
          sort_order: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          file_url: string
          folder_id?: string | null
          id?: string
          is_featured?: boolean | null
          media_type: string
          organization_id: string
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          file_url?: string
          folder_id?: string | null
          id?: string
          is_featured?: boolean | null
          media_type?: string
          organization_id?: string
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tradetube_content_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "tradetube_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tradetube_content_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tradetube_folders: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          organization_id: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tradetube_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tradetube_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tradetube_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      tradetube_views: {
        Row: {
          content_id: string
          id: string
          organization_id: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          content_id: string
          id?: string
          organization_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          content_id?: string
          id?: string
          organization_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tradetube_views_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "tradetube_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tradetube_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_settings: {
        Row: {
          created_at: string
          credentials_configured: boolean | null
          enabled: boolean | null
          id: string
          last_test_date: string | null
          last_test_status: string | null
          organization_id: string | null
          push_notifications_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credentials_configured?: boolean | null
          enabled?: boolean | null
          id?: string
          last_test_date?: string | null
          last_test_status?: string | null
          organization_id?: string | null
          push_notifications_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credentials_configured?: boolean | null
          enabled?: boolean | null
          id?: string
          last_test_date?: string | null
          last_test_status?: string | null
          organization_id?: string | null
          push_notifications_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "twilio_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          activity_description: string
          activity_type: string
          actor_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          organization_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_description: string
          activity_type: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_description?: string
          activity_type?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vlans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          organization_id: string | null
          security_zone: string | null
          subnet: unknown
          updated_at: string | null
          vlan_id: number
          vlan_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          organization_id?: string | null
          security_zone?: string | null
          subnet?: unknown
          updated_at?: string | null
          vlan_id: number
          vlan_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          organization_id?: string | null
          security_zone?: string | null
          subnet?: unknown
          updated_at?: string | null
          vlan_id?: number
          vlan_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vlans_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vlans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      walk_through_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          floor: number
          id: string
          location_id: string | null
          note_text: string | null
          organization_id: string | null
          updated_at: string | null
          voice_recording_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          floor: number
          id?: string
          location_id?: string | null
          note_text?: string | null
          organization_id?: string | null
          updated_at?: string | null
          voice_recording_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          floor?: number
          id?: string
          location_id?: string | null
          note_text?: string | null
          organization_id?: string | null
          updated_at?: string | null
          voice_recording_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "walk_through_notes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_through_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wire_paths: {
        Row: {
          cable_type: string
          color: string | null
          created_at: string
          created_by: string | null
          floor: number
          id: string
          label: string | null
          location_id: string | null
          notes: string | null
          organization_id: string | null
          path_points: Json
          status: string | null
          updated_at: string
        }
        Insert: {
          cable_type?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          floor?: number
          id?: string
          label?: string | null
          location_id?: string | null
          notes?: string | null
          organization_id?: string | null
          path_points?: Json
          status?: string | null
          updated_at?: string
        }
        Update: {
          cable_type?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          floor?: number
          id?: string
          label?: string | null
          location_id?: string | null
          notes?: string | null
          organization_id?: string | null
          path_points?: Json
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wire_paths_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wire_paths_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      workflow_configurations: {
        Row: {
          approval_rules: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          organization_id: string | null
          steps: Json
          updated_at: string
          workflow_name: string
          workflow_type: string
        }
        Insert: {
          approval_rules?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          steps?: Json
          updated_at?: string
          workflow_name: string
          workflow_type: string
        }
        Update: {
          approval_rules?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          steps?: Json
          updated_at?: string
          workflow_name?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aggregate_daily_analytics: {
        Args: { target_date?: string }
        Returns: undefined
      }
      generate_po_number: { Args: never; Returns: string }
      get_current_user_client_id: { Args: never; Returns: string }
      get_current_user_email: { Args: never; Returns: string }
      get_employee_directory: {
        Args: never
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
      get_user_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      get_user_organizations: { Args: { _user_id?: string }; Returns: string[] }
      get_user_room_ids: { Args: never; Returns: string[] }
      has_any_role: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      has_location_access: { Args: { p_location_id: string }; Returns: boolean }
      has_org_access: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_employee: { Args: { _user_id: string }; Returns: boolean }
      is_platform_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id?: string }; Returns: boolean }
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
        | "field_photographer"
        | "employee"
      org_role: "owner" | "admin" | "project_manager" | "technician" | "viewer"
      platform_role: "super_admin" | "support"
      trade_type:
        | "low_voltage"
        | "electrical"
        | "plumbing"
        | "hvac"
        | "fire_life_safety"
        | "access_control"
        | "security_surveillance"
        | "intrusion_alarm"
        | "building_automation"
        | "lighting_controls"
        | "energy_management"
        | "gas"
        | "medical_gas"
        | "water_treatment"
        | "elevator"
        | "escalator"
        | "av_pro"
        | "paging_notification"
        | "parking_systems"
        | "irrigation"
        | "refrigeration"
        | "commercial_kitchen"
        | "industrial_safety"
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
        "field_photographer",
        "employee",
      ],
      org_role: ["owner", "admin", "project_manager", "technician", "viewer"],
      platform_role: ["super_admin", "support"],
      trade_type: [
        "low_voltage",
        "electrical",
        "plumbing",
        "hvac",
        "fire_life_safety",
        "access_control",
        "security_surveillance",
        "intrusion_alarm",
        "building_automation",
        "lighting_controls",
        "energy_management",
        "gas",
        "medical_gas",
        "water_treatment",
        "elevator",
        "escalator",
        "av_pro",
        "paging_notification",
        "parking_systems",
        "irrigation",
        "refrigeration",
        "commercial_kitchen",
        "industrial_safety",
      ],
    },
  },
} as const
