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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_generation_cache: {
        Row: {
          created_at: string
          expires_at: string | null
          generation_type: Database["public"]["Enums"]["ai_generation_type"]
          id: string
          input_parameters_hash: string | null
          media_asset_id: string | null
          model_version: string
          prompt_hash: string
          text_output: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          generation_type: Database["public"]["Enums"]["ai_generation_type"]
          id?: string
          input_parameters_hash?: string | null
          media_asset_id?: string | null
          model_version: string
          prompt_hash: string
          text_output?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          generation_type?: Database["public"]["Enums"]["ai_generation_type"]
          id?: string
          input_parameters_hash?: string | null
          media_asset_id?: string | null
          model_version?: string
          prompt_hash?: string
          text_output?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_cache_media_asset_id_media_asset_id_fk"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_asset"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_history: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          invoice_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          invoice_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          invoice_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          user_id?: string
        }
        Relationships: []
      }
      channel: {
        Row: {
          access_token: string | null
          avatar_url: string | null
          created_at: string
          handle: string | null
          id: string
          last_synced_at: string | null
          name: string
          refresh_token: string | null
          status: Database["public"]["Enums"]["channel_status"]
          updated_at: string
          user_id: string
          youtube_channel_id: string
        }
        Insert: {
          access_token?: string | null
          avatar_url?: string | null
          created_at?: string
          handle?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["channel_status"]
          updated_at?: string
          user_id: string
          youtube_channel_id: string
        }
        Update: {
          access_token?: string | null
          avatar_url?: string | null
          created_at?: string
          handle?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["channel_status"]
          updated_at?: string
          user_id?: string
          youtube_channel_id?: string
        }
        Relationships: []
      }
      channel_video: {
        Row: {
          channel_id: string
          comment_count: number | null
          created_at: string
          description: string | null
          duration: string | null
          id: string
          like_count: number | null
          project_id: string | null
          published_at: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number | null
          youtube_video_id: string
        }
        Insert: {
          channel_id: string
          comment_count?: number | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          like_count?: number | null
          project_id?: string | null
          published_at?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
          youtube_video_id: string
        }
        Update: {
          channel_id?: string
          comment_count?: number | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          like_count?: number | null
          project_id?: string | null
          published_at?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_video_channel_id_channel_id_fk"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_video_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      label: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      media_asset: {
        Row: {
          created_at: string
          duration: number | null
          file_size: number
          height: number | null
          id: string
          mime_type: string
          project_id: string | null
          provider: Database["public"]["Enums"]["media_provider"]
          public_url: string
          storage_key: string
          type: Database["public"]["Enums"]["media_type"]
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          duration?: number | null
          file_size: number
          height?: number | null
          id?: string
          mime_type: string
          project_id?: string | null
          provider?: Database["public"]["Enums"]["media_provider"]
          public_url: string
          storage_key: string
          type: Database["public"]["Enums"]["media_type"]
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          duration?: number | null
          file_size?: number
          height?: number | null
          id?: string
          mime_type?: string
          project_id?: string | null
          provider?: Database["public"]["Enums"]["media_provider"]
          public_url?: string
          storage_key?: string
          type?: Database["public"]["Enums"]["media_type"]
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          twitter_handle: string | null
          updated_at: string
          username: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          twitter_handle?: string | null
          updated_at?: string
          username: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          twitter_handle?: string | null
          updated_at?: string
          username?: string
          website_url?: string | null
        }
        Relationships: []
      }
      project: {
        Row: {
          channel_id: string | null
          created_at: string
          description: string | null
          id: string
          status: Database["public"]["Enums"]["project_status"]
          title: string
          tone: Database["public"]["Enums"]["project_tone"] | null
          topic: string | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["project_visibility"]
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          tone?: Database["public"]["Enums"]["project_tone"] | null
          topic?: string | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          tone?: Database["public"]["Enums"]["project_tone"] | null
          topic?: string | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "project_channel_id_channel_id_fk"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channel"
            referencedColumns: ["id"]
          },
        ]
      }
      project_label: {
        Row: {
          label_id: string
          project_id: string
        }
        Insert: {
          label_id: string
          project_id: string
        }
        Update: {
          label_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_label_label_id_label_id_fk"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "label"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_label_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      project_pipeline: {
        Row: {
          current_phase: Database["public"]["Enums"]["pipeline_phase"]
          id: string
          last_accessed_step: string | null
          overall_progress: number | null
          project_id: string
          step_b_roll_status: Database["public"]["Enums"]["step_status"] | null
          step_coloring_status:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_export_status: Database["public"]["Enums"]["step_status"] | null
          step_rough_cut_status:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_scene_status: Database["public"]["Enums"]["step_status"] | null
          step_script_status: Database["public"]["Enums"]["step_status"] | null
          step_seo_status: Database["public"]["Enums"]["step_status"] | null
          step_storyboard_status:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_subtitles_status:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_thumbnail_status:
            | Database["public"]["Enums"]["step_status"]
            | null
          updated_at: string
        }
        Insert: {
          current_phase?: Database["public"]["Enums"]["pipeline_phase"]
          id?: string
          last_accessed_step?: string | null
          overall_progress?: number | null
          project_id: string
          step_b_roll_status?: Database["public"]["Enums"]["step_status"] | null
          step_coloring_status?:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_export_status?: Database["public"]["Enums"]["step_status"] | null
          step_rough_cut_status?:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_scene_status?: Database["public"]["Enums"]["step_status"] | null
          step_script_status?: Database["public"]["Enums"]["step_status"] | null
          step_seo_status?: Database["public"]["Enums"]["step_status"] | null
          step_storyboard_status?:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_subtitles_status?:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_thumbnail_status?:
            | Database["public"]["Enums"]["step_status"]
            | null
          updated_at?: string
        }
        Update: {
          current_phase?: Database["public"]["Enums"]["pipeline_phase"]
          id?: string
          last_accessed_step?: string | null
          overall_progress?: number | null
          project_id?: string
          step_b_roll_status?: Database["public"]["Enums"]["step_status"] | null
          step_coloring_status?:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_export_status?: Database["public"]["Enums"]["step_status"] | null
          step_rough_cut_status?:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_scene_status?: Database["public"]["Enums"]["step_status"] | null
          step_script_status?: Database["public"]["Enums"]["step_status"] | null
          step_seo_status?: Database["public"]["Enums"]["step_status"] | null
          step_storyboard_status?:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_subtitles_status?:
            | Database["public"]["Enums"]["step_status"]
            | null
          step_thumbnail_status?:
            | Database["public"]["Enums"]["step_status"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_pipeline_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      project_seo: {
        Row: {
          id: string
          last_analyzed_at: string | null
          project_id: string
          seo_score: number | null
          target_keyword: string
          updated_at: string
          youtube_description: string | null
          youtube_tags: string[] | null
          youtube_title: string | null
        }
        Insert: {
          id?: string
          last_analyzed_at?: string | null
          project_id: string
          seo_score?: number | null
          target_keyword: string
          updated_at?: string
          youtube_description?: string | null
          youtube_tags?: string[] | null
          youtube_title?: string | null
        }
        Update: {
          id?: string
          last_analyzed_at?: string | null
          project_id?: string
          seo_score?: number | null
          target_keyword?: string
          updated_at?: string
          youtube_description?: string | null
          youtube_tags?: string[] | null
          youtube_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_seo_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      settings_integration: {
        Row: {
          access_token: string | null
          account_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          provider: Database["public"]["Enums"]["integration_provider"]
          refresh_token: string | null
          status: Database["public"]["Enums"]["integration_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          provider: Database["public"]["Enums"]["integration_provider"]
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["integration_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          provider?: Database["public"]["Enums"]["integration_provider"]
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["integration_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings_mcp_server: {
        Row: {
          access_token: string | null
          created_at: string
          endpoint_url: string
          id: string
          last_connected_at: string | null
          name: string
          status: Database["public"]["Enums"]["mcp_status"] | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          endpoint_url: string
          id?: string
          last_connected_at?: string | null
          name: string
          status?: Database["public"]["Enums"]["mcp_status"] | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          endpoint_url?: string
          id?: string
          last_connected_at?: string | null
          name?: string
          status?: Database["public"]["Enums"]["mcp_status"] | null
          user_id?: string
        }
        Relationships: []
      }
      settings_notification: {
        Row: {
          email_marketing: boolean | null
          email_project_updates: boolean | null
          email_security: boolean | null
          id: string
          push_comments: boolean | null
          push_everything: boolean | null
          updated_at: string
        }
        Insert: {
          email_marketing?: boolean | null
          email_project_updates?: boolean | null
          email_security?: boolean | null
          id: string
          push_comments?: boolean | null
          push_everything?: boolean | null
          updated_at?: string
        }
        Update: {
          email_marketing?: boolean | null
          email_project_updates?: boolean | null
          email_security?: boolean | null
          id?: string
          push_comments?: boolean | null
          push_everything?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      settings_subscription: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"] | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          price: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          price?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          price?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_b_roll: {
        Row: {
          asset_id: string | null
          end_time: number | null
          id: string
          project_id: string
          source_provider: Database["public"]["Enums"]["b_roll_provider"]
          source_url: string | null
          start_time: number | null
          storyboard_id: string | null
        }
        Insert: {
          asset_id?: string | null
          end_time?: number | null
          id?: string
          project_id: string
          source_provider: Database["public"]["Enums"]["b_roll_provider"]
          source_url?: string | null
          start_time?: number | null
          storyboard_id?: string | null
        }
        Update: {
          asset_id?: string | null
          end_time?: number | null
          id?: string
          project_id?: string
          source_provider?: Database["public"]["Enums"]["b_roll_provider"]
          source_url?: string | null
          start_time?: number | null
          storyboard_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_b_roll_asset_id_media_asset_id_fk"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_asset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_b_roll_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_b_roll_storyboard_id_studio_storyboard_id_fk"
            columns: ["storyboard_id"]
            isOneToOne: false
            referencedRelation: "studio_storyboard"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_coloring_preset: {
        Row: {
          filter_parameters: Json
          id: string
          name: string
        }
        Insert: {
          filter_parameters: Json
          id: string
          name: string
        }
        Update: {
          filter_parameters?: Json
          id?: string
          name?: string
        }
        Relationships: []
      }
      studio_coloring_setting: {
        Row: {
          custom_parameters: Json | null
          id: string
          preset_id: string | null
          project_id: string
        }
        Insert: {
          custom_parameters?: Json | null
          id?: string
          preset_id?: string | null
          project_id: string
        }
        Update: {
          custom_parameters?: Json | null
          id?: string
          preset_id?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_coloring_setting_preset_id_studio_coloring_preset_id_fk"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "studio_coloring_preset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_coloring_setting_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_export_history: {
        Row: {
          completed_at: string | null
          format: Database["public"]["Enums"]["export_format"]
          id: string
          project_id: string
          resolution: Database["public"]["Enums"]["export_resolution"]
          status: Database["public"]["Enums"]["export_status"] | null
          upload_status: Database["public"]["Enums"]["upload_status"] | null
          video_asset_id: string | null
        }
        Insert: {
          completed_at?: string | null
          format?: Database["public"]["Enums"]["export_format"]
          id?: string
          project_id: string
          resolution?: Database["public"]["Enums"]["export_resolution"]
          status?: Database["public"]["Enums"]["export_status"] | null
          upload_status?: Database["public"]["Enums"]["upload_status"] | null
          video_asset_id?: string | null
        }
        Update: {
          completed_at?: string | null
          format?: Database["public"]["Enums"]["export_format"]
          id?: string
          project_id?: string
          resolution?: Database["public"]["Enums"]["export_resolution"]
          status?: Database["public"]["Enums"]["export_status"] | null
          upload_status?: Database["public"]["Enums"]["upload_status"] | null
          video_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_export_history_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_export_history_video_asset_id_media_asset_id_fk"
            columns: ["video_asset_id"]
            isOneToOne: false
            referencedRelation: "media_asset"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_rough_cut_timeline: {
        Row: {
          id: string
          playhead_position: number | null
          project_id: string
          updated_at: string | null
          zoom_scale: number | null
        }
        Insert: {
          id?: string
          playhead_position?: number | null
          project_id: string
          updated_at?: string | null
          zoom_scale?: number | null
        }
        Update: {
          id?: string
          playhead_position?: number | null
          project_id?: string
          updated_at?: string | null
          zoom_scale?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_rough_cut_timeline_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_rough_cut_timeline_segment: {
        Row: {
          duration: number
          id: string
          playback_speed: number | null
          resource_id: string
          resource_type: Database["public"]["Enums"]["timeline_resource_type"]
          start_time: number
          timeline_id: string
          track_id: string
          trim_end: number | null
          trim_start: number | null
          type: Database["public"]["Enums"]["timeline_track_type"]
          volume: number | null
          z_index: number | null
        }
        Insert: {
          duration: number
          id?: string
          playback_speed?: number | null
          resource_id: string
          resource_type: Database["public"]["Enums"]["timeline_resource_type"]
          start_time: number
          timeline_id: string
          track_id?: string
          trim_end?: number | null
          trim_start?: number | null
          type: Database["public"]["Enums"]["timeline_track_type"]
          volume?: number | null
          z_index?: number | null
        }
        Update: {
          duration?: number
          id?: string
          playback_speed?: number | null
          resource_id?: string
          resource_type?: Database["public"]["Enums"]["timeline_resource_type"]
          start_time?: number
          timeline_id?: string
          track_id?: string
          trim_end?: number | null
          trim_start?: number | null
          type?: Database["public"]["Enums"]["timeline_track_type"]
          volume?: number | null
          z_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_rough_cut_timeline_segment_timeline_id_studio_rough_cut_"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "studio_rough_cut_timeline"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_rough_cut_version: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          name: string
          project_id: string
          version_number: number
          video_asset_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          name: string
          project_id: string
          version_number: number
          video_asset_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          name?: string
          project_id?: string
          version_number?: number
          video_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_rough_cut_version_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_rough_cut_version_video_asset_id_media_asset_id_fk"
            columns: ["video_asset_id"]
            isOneToOne: false
            referencedRelation: "media_asset"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_script: {
        Row: {
          id: string
          project_id: string
          prompt: string | null
          saved_at: string | null
          target_duration: number | null
        }
        Insert: {
          id?: string
          project_id: string
          prompt?: string | null
          saved_at?: string | null
          target_duration?: number | null
        }
        Update: {
          id?: string
          project_id?: string
          prompt?: string | null
          saved_at?: string | null
          target_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_script_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_script_segment: {
        Row: {
          content: string
          estimated_duration: number | null
          id: string
          order_index: number
          script_id: string
          type: Database["public"]["Enums"]["script_segment_type"]
        }
        Insert: {
          content: string
          estimated_duration?: number | null
          id?: string
          order_index: number
          script_id: string
          type: Database["public"]["Enums"]["script_segment_type"]
        }
        Update: {
          content?: string
          estimated_duration?: number | null
          id?: string
          order_index?: number
          script_id?: string
          type?: Database["public"]["Enums"]["script_segment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "studio_script_segment_script_id_studio_script_id_fk"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "studio_script"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_storyboard: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_asset_id: string | null
          order_index: number
          project_id: string
          scene_number: number
          script_segment_id: string | null
          visual_prompt: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_asset_id?: string | null
          order_index?: number
          project_id: string
          scene_number: number
          script_segment_id?: string | null
          visual_prompt?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_asset_id?: string | null
          order_index?: number
          project_id?: string
          scene_number?: number
          script_segment_id?: string | null
          visual_prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_storyboard_image_asset_id_media_asset_id_fk"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_asset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_storyboard_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_storyboard_script_segment_id_studio_script_segment_id_fk"
            columns: ["script_segment_id"]
            isOneToOne: false
            referencedRelation: "studio_script_segment"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_subtitle: {
        Row: {
          created_at: string | null
          end_time: number
          id: string
          project_id: string
          start_time: number
          style_json: Json | null
          text: string
        }
        Insert: {
          created_at?: string | null
          end_time: number
          id?: string
          project_id: string
          start_time: number
          style_json?: Json | null
          text: string
        }
        Update: {
          created_at?: string | null
          end_time?: number
          id?: string
          project_id?: string
          start_time?: number
          style_json?: Json | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_subtitle_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_thumbnail: {
        Row: {
          id: string
          project_id: string
        }
        Insert: {
          id?: string
          project_id: string
        }
        Update: {
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_thumbnail_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_thumbnail_candidate: {
        Row: {
          created_at: string | null
          id: string
          image_asset_id: string
          is_favorite: boolean | null
          project_thumbnail_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_asset_id: string
          is_favorite?: boolean | null
          project_thumbnail_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_asset_id?: string
          is_favorite?: boolean | null
          project_thumbnail_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_thumbnail_candidate_image_asset_id_media_asset_id_fk"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_asset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_thumbnail_candidate_project_thumbnail_id_studio_thumbnai"
            columns: ["project_thumbnail_id"]
            isOneToOne: false
            referencedRelation: "studio_thumbnail"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_thumbnail_overlay: {
        Row: {
          id: string
          project_thumbnail_id: string
          properties: Json
          type: Database["public"]["Enums"]["thumbnail_overlay_type"]
        }
        Insert: {
          id?: string
          project_thumbnail_id: string
          properties: Json
          type: Database["public"]["Enums"]["thumbnail_overlay_type"]
        }
        Update: {
          id?: string
          project_thumbnail_id?: string
          properties?: Json
          type?: Database["public"]["Enums"]["thumbnail_overlay_type"]
        }
        Relationships: [
          {
            foreignKeyName: "studio_thumbnail_overlay_project_thumbnail_id_studio_thumbnail_"
            columns: ["project_thumbnail_id"]
            isOneToOne: false
            referencedRelation: "studio_thumbnail"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_video: {
        Row: {
          created_at: string | null
          duration: number | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["scene_video_status"] | null
          storyboard_id: string
          video_asset_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["scene_video_status"] | null
          storyboard_id: string
          video_asset_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["scene_video_status"] | null
          storyboard_id?: string
          video_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_video_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_video_storyboard_id_studio_storyboard_id_fk"
            columns: ["storyboard_id"]
            isOneToOne: false
            referencedRelation: "studio_storyboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_video_video_asset_id_media_asset_id_fk"
            columns: ["video_asset_id"]
            isOneToOne: false
            referencedRelation: "media_asset"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ai_generation_type: "image" | "video" | "script" | "seo"
      b_roll_provider: "pexels" | "pixabay" | "unsplash" | "custom"
      billing_cycle: "monthly" | "yearly"
      channel_status: "active" | "disconnected" | "error"
      export_format: "mp4" | "mov"
      export_resolution: "1080p" | "4k"
      export_status: "pending" | "completed" | "failed"
      integration_provider:
        | "youtube"
        | "gemini"
        | "pexels"
        | "openai"
        | "elevenlabs"
      integration_status: "active" | "inactive" | "error"
      mcp_status: "connected" | "disconnected" | "error"
      media_provider: "s3" | "r2" | "local"
      media_type: "image" | "video" | "audio"
      payment_status: "paid" | "pending" | "failed"
      pipeline_phase:
        | "planning"
        | "production"
        | "post_production"
        | "review"
        | "completed"
      project_status: "draft" | "in_progress" | "completed" | "archived"
      project_tone: "informative" | "funny" | "cinematic" | "vlog"
      project_type: "short" | "long"
      project_visibility: "public" | "private"
      scene_video_status: "generating" | "completed" | "failed"
      script_segment_type: "hook" | "intro" | "body" | "cta" | "outro"
      step_status: "pending" | "in_progress" | "completed"
      subscription_plan: "free" | "pro" | "enterprise"
      subscription_status: "active" | "canceled" | "past_due"
      thumbnail_overlay_type: "text" | "image"
      timeline_resource_type: "scene" | "b_roll" | "upload" | "audio"
      timeline_track_type: "video" | "audio"
      upload_status: "not_uploaded" | "uploaded"
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
      ai_generation_type: ["image", "video", "script", "seo"],
      b_roll_provider: ["pexels", "pixabay", "unsplash", "custom"],
      billing_cycle: ["monthly", "yearly"],
      channel_status: ["active", "disconnected", "error"],
      export_format: ["mp4", "mov"],
      export_resolution: ["1080p", "4k"],
      export_status: ["pending", "completed", "failed"],
      integration_provider: [
        "youtube",
        "gemini",
        "pexels",
        "openai",
        "elevenlabs",
      ],
      integration_status: ["active", "inactive", "error"],
      mcp_status: ["connected", "disconnected", "error"],
      media_provider: ["s3", "r2", "local"],
      media_type: ["image", "video", "audio"],
      payment_status: ["paid", "pending", "failed"],
      pipeline_phase: [
        "planning",
        "production",
        "post_production",
        "review",
        "completed",
      ],
      project_status: ["draft", "in_progress", "completed", "archived"],
      project_tone: ["informative", "funny", "cinematic", "vlog"],
      project_type: ["short", "long"],
      project_visibility: ["public", "private"],
      scene_video_status: ["generating", "completed", "failed"],
      script_segment_type: ["hook", "intro", "body", "cta", "outro"],
      step_status: ["pending", "in_progress", "completed"],
      subscription_plan: ["free", "pro", "enterprise"],
      subscription_status: ["active", "canceled", "past_due"],
      thumbnail_overlay_type: ["text", "image"],
      timeline_resource_type: ["scene", "b_roll", "upload", "audio"],
      timeline_track_type: ["video", "audio"],
      upload_status: ["not_uploaded", "uploaded"],
    },
  },
} as const
