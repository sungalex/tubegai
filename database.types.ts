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
      audit_log: {
        Row: {
          action: string
          changes: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      channel: {
        Row: {
          access_token: string | null
          avatar_url: string | null
          banner_url: string | null
          created_at: string
          description: string | null
          handle: string | null
          id: string
          last_synced_at: string | null
          name: string
          refresh_token: string | null
          status: Database["public"]["Enums"]["channel_status"]
          subscriber_count: number | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          video_count: number | null
          view_count: number | null
          youtube_channel_id: string
        }
        Insert: {
          access_token?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          handle?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["channel_status"]
          subscriber_count?: number | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          video_count?: number | null
          view_count?: number | null
          youtube_channel_id: string
        }
        Update: {
          access_token?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          handle?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["channel_status"]
          subscriber_count?: number | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          video_count?: number | null
          view_count?: number | null
          youtube_channel_id?: string
        }
        Relationships: []
      }
      idea: {
        Row: {
          category: string | null
          content_tones: string[] | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["idea_difficulty"] | null
          estimated_views: string | null
          expires_at: string | null
          growth_rate: string | null
          hooks: string[] | null
          id: string
          is_saved: boolean
          is_used: boolean
          reason: string | null
          reference_url: string | null
          score: number | null
          source: Database["public"]["Enums"]["idea_source"]
          target_audience: string | null
          title: string
          updated_at: string
          used_for_project_id: string | null
          user_id: string
          video_types: string[] | null
        }
        Insert: {
          category?: string | null
          content_tones?: string[] | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["idea_difficulty"] | null
          estimated_views?: string | null
          expires_at?: string | null
          growth_rate?: string | null
          hooks?: string[] | null
          id?: string
          is_saved?: boolean
          is_used?: boolean
          reason?: string | null
          reference_url?: string | null
          score?: number | null
          source: Database["public"]["Enums"]["idea_source"]
          target_audience?: string | null
          title: string
          updated_at?: string
          used_for_project_id?: string | null
          user_id: string
          video_types?: string[] | null
        }
        Update: {
          category?: string | null
          content_tones?: string[] | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["idea_difficulty"] | null
          estimated_views?: string | null
          expires_at?: string | null
          growth_rate?: string | null
          hooks?: string[] | null
          id?: string
          is_saved?: boolean
          is_used?: boolean
          reason?: string | null
          reference_url?: string | null
          score?: number | null
          source?: Database["public"]["Enums"]["idea_source"]
          target_audience?: string | null
          title?: string
          updated_at?: string
          used_for_project_id?: string | null
          user_id?: string
          video_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_used_for_project_id_project_id_fk"
            columns: ["used_for_project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_trend: {
        Row: {
          created_at: string
          idea_id: string
          is_primary: boolean
          trend_id: string
        }
        Insert: {
          created_at?: string
          idea_id: string
          is_primary?: boolean
          trend_id: string
        }
        Update: {
          created_at?: string
          idea_id?: string
          is_primary?: boolean
          trend_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_trend_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_trend_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "trend"
            referencedColumns: ["id"]
          },
        ]
      }
      label: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
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
          ai_context: Json | null
          based_on_trend: string | null
          based_on_trend_id: number | null
          based_on_trend_uuid: string | null
          channel_id: string | null
          content_tone: Database["public"]["Enums"]["content_tone"] | null
          created_at: string
          current_step: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["idea_difficulty"] | null
          estimated_views: string | null
          hooks: string[] | null
          id: string
          progress: number
          reference_url: string | null
          script_guidelines: Json | null
          source_idea_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          target_audience: string | null
          thumbnail_url: string | null
          title: string
          tone: Database["public"]["Enums"]["project_tone"] | null
          topic: string | null
          trend_snapshot: Json | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
          user_id: string
          video_length: Database["public"]["Enums"]["video_length"] | null
          visibility: Database["public"]["Enums"]["project_visibility"]
        }
        Insert: {
          ai_context?: Json | null
          based_on_trend?: string | null
          based_on_trend_id?: number | null
          based_on_trend_uuid?: string | null
          channel_id?: string | null
          content_tone?: Database["public"]["Enums"]["content_tone"] | null
          created_at?: string
          current_step?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["idea_difficulty"] | null
          estimated_views?: string | null
          hooks?: string[] | null
          id?: string
          progress?: number
          reference_url?: string | null
          script_guidelines?: Json | null
          source_idea_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_audience?: string | null
          thumbnail_url?: string | null
          title?: string
          tone?: Database["public"]["Enums"]["project_tone"] | null
          topic?: string | null
          trend_snapshot?: Json | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id: string
          video_length?: Database["public"]["Enums"]["video_length"] | null
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Update: {
          ai_context?: Json | null
          based_on_trend?: string | null
          based_on_trend_id?: number | null
          based_on_trend_uuid?: string | null
          channel_id?: string | null
          content_tone?: Database["public"]["Enums"]["content_tone"] | null
          created_at?: string
          current_step?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["idea_difficulty"] | null
          estimated_views?: string | null
          hooks?: string[] | null
          id?: string
          progress?: number
          reference_url?: string | null
          script_guidelines?: Json | null
          source_idea_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_audience?: string | null
          thumbnail_url?: string | null
          title?: string
          tone?: Database["public"]["Enums"]["project_tone"] | null
          topic?: string | null
          trend_snapshot?: Json | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id?: string
          video_length?: Database["public"]["Enums"]["video_length"] | null
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "project_based_on_trend_uuid_fkey"
            columns: ["based_on_trend_uuid"]
            isOneToOne: false
            referencedRelation: "trend"
            referencedColumns: ["id"]
          },
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
          frame_rate: number | null
          hardware_acceleration: boolean | null
          id: string
          privacy: string | null
          project_id: string
          quality: string | null
          resolution: Database["public"]["Enums"]["export_resolution"]
          scheduled_at: string | null
          status: Database["public"]["Enums"]["export_status"] | null
          upload_status: Database["public"]["Enums"]["upload_status"] | null
          video_asset_id: string | null
        }
        Insert: {
          completed_at?: string | null
          format?: Database["public"]["Enums"]["export_format"]
          frame_rate?: number | null
          hardware_acceleration?: boolean | null
          id?: string
          privacy?: string | null
          project_id: string
          quality?: string | null
          resolution?: Database["public"]["Enums"]["export_resolution"]
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["export_status"] | null
          upload_status?: Database["public"]["Enums"]["upload_status"] | null
          video_asset_id?: string | null
        }
        Update: {
          completed_at?: string | null
          format?: Database["public"]["Enums"]["export_format"]
          frame_rate?: number | null
          hardware_acceleration?: boolean | null
          id?: string
          privacy?: string | null
          project_id?: string
          quality?: string | null
          resolution?: Database["public"]["Enums"]["export_resolution"]
          scheduled_at?: string | null
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
      studio_seo: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          project_id: string
          tags: string[] | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          project_id: string
          tags?: string[] | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string
          tags?: string[] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_seo_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_storyboard: {
        Row: {
          created_at: string
          description: string | null
          duration: number | null
          id: string
          image_asset_id: string | null
          order_index: number
          project_id: string
          scene_number: number
          script_segment_id: string
          visual_prompt: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          image_asset_id?: string | null
          order_index?: number
          project_id: string
          scene_number: number
          script_segment_id: string
          visual_prompt?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          image_asset_id?: string | null
          order_index?: number
          project_id?: string
          scene_number?: number
          script_segment_id?: string
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
          text: string
        }
        Insert: {
          created_at?: string | null
          end_time: number
          id?: string
          project_id: string
          start_time: number
          text: string
        }
        Update: {
          created_at?: string | null
          end_time?: number
          id?: string
          project_id?: string
          start_time?: number
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
      studio_video_part: {
        Row: {
          created_at: string
          duration: number
          end_time: number
          id: string
          part_number: number
          start_time: number
          status: Database["public"]["Enums"]["scene_video_status"]
          video_asset_id: string | null
          video_id: string
        }
        Insert: {
          created_at?: string
          duration: number
          end_time: number
          id?: string
          part_number: number
          start_time: number
          status?: Database["public"]["Enums"]["scene_video_status"]
          video_asset_id?: string | null
          video_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          end_time?: number
          id?: string
          part_number?: number
          start_time?: number
          status?: Database["public"]["Enums"]["scene_video_status"]
          video_asset_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_video_part_video_asset_id_media_asset_id_fk"
            columns: ["video_asset_id"]
            isOneToOne: false
            referencedRelation: "media_asset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_video_part_video_id_studio_video_id_fk"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "studio_video"
            referencedColumns: ["id"]
          },
        ]
      }
      trend: {
        Row: {
          category: string
          comment_count: number | null
          created_at: string
          description: string | null
          external_id: string | null
          external_url: string | null
          fetched_at: string | null
          growth_rate: string | null
          id: string
          is_saved: boolean | null
          language_code: string | null
          last_used_at: string | null
          like_count: number | null
          published_at: string | null
          region_code: string | null
          saved_at: string | null
          saved_by_user_id: string | null
          source: Database["public"]["Enums"]["trend_source"]
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          usage_count: number | null
          used_for_project_id: string | null
          user_id: string | null
          video_duration: string | null
          view_count: number | null
          views_count: string | null
        }
        Insert: {
          category: string
          comment_count?: number | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          external_url?: string | null
          fetched_at?: string | null
          growth_rate?: string | null
          id?: string
          is_saved?: boolean | null
          language_code?: string | null
          last_used_at?: string | null
          like_count?: number | null
          published_at?: string | null
          region_code?: string | null
          saved_at?: string | null
          saved_by_user_id?: string | null
          source?: Database["public"]["Enums"]["trend_source"]
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          usage_count?: number | null
          used_for_project_id?: string | null
          user_id?: string | null
          video_duration?: string | null
          view_count?: number | null
          views_count?: string | null
        }
        Update: {
          category?: string
          comment_count?: number | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          external_url?: string | null
          fetched_at?: string | null
          growth_rate?: string | null
          id?: string
          is_saved?: boolean | null
          language_code?: string | null
          last_used_at?: string | null
          like_count?: number | null
          published_at?: string | null
          region_code?: string | null
          saved_at?: string | null
          saved_by_user_id?: string | null
          source?: Database["public"]["Enums"]["trend_source"]
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          usage_count?: number | null
          used_for_project_id?: string | null
          user_id?: string | null
          video_duration?: string | null
          view_count?: number | null
          views_count?: string | null
        }
        Relationships: []
      }
      trendtube_media: {
        Row: {
          created_at: string
          id: string
          media_asset_id: string | null
          media_type: Database["public"]["Enums"]["trendtube_media_type"]
          metadata: Json | null
          public_url: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_asset_id?: string | null
          media_type: Database["public"]["Enums"]["trendtube_media_type"]
          metadata?: Json | null
          public_url?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_asset_id?: string | null
          media_type?: Database["public"]["Enums"]["trendtube_media_type"]
          metadata?: Json | null
          public_url?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trendtube_media_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_asset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trendtube_media_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "trendtube_session"
            referencedColumns: ["id"]
          },
        ]
      }
      trendtube_result: {
        Row: {
          created_at: string
          extracted_trends: string | null
          id: string
          narration_script: string | null
          session_id: string
          video_ideas: string | null
        }
        Insert: {
          created_at?: string
          extracted_trends?: string | null
          id?: string
          narration_script?: string | null
          session_id: string
          video_ideas?: string | null
        }
        Update: {
          created_at?: string
          extracted_trends?: string | null
          id?: string
          narration_script?: string | null
          session_id?: string
          video_ideas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trendtube_result_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "trendtube_session"
            referencedColumns: ["id"]
          },
        ]
      }
      trendtube_session: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number
          error_message: string | null
          id: string
          project_id: string
          reference_image_url: string | null
          status: Database["public"]["Enums"]["trendtube_pipeline_status"]
          trends_url: string
          user_id: string
          user_idea: string
          voice_option: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          error_message?: string | null
          id?: string
          project_id: string
          reference_image_url?: string | null
          status?: Database["public"]["Enums"]["trendtube_pipeline_status"]
          trends_url: string
          user_id: string
          user_idea: string
          voice_option?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          error_message?: string | null
          id?: string
          project_id?: string
          reference_image_url?: string | null
          status?: Database["public"]["Enums"]["trendtube_pipeline_status"]
          trends_url?: string
          user_id?: string
          user_idea?: string
          voice_option?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trendtube_session_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
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
      channel_status: "active" | "error" | "syncing"
      content_tone:
        | "informative"
        | "funny"
        | "dramatic"
        | "casual"
        | "professional"
      export_format: "mp4" | "mov" | "webm"
      export_resolution: "720p" | "1080p" | "4k"
      export_status: "pending" | "completed" | "failed"
      idea_difficulty: "easy" | "medium" | "hard"
      idea_source: "ai_generated" | "user_created"
      media_provider: "s3" | "r2" | "local"
      media_type: "image" | "video" | "audio"
      project_status: "draft" | "in_progress" | "completed" | "archived"
      project_tone: "informative" | "funny" | "cinematic" | "vlog"
      project_type: "short" | "long"
      project_visibility: "public" | "private"
      scene_video_status: "pending" | "generating" | "completed" | "failed"
      script_segment_type: "hook" | "intro" | "body" | "cta" | "outro"
      thumbnail_overlay_type: "text" | "image"
      timeline_resource_type: "scene" | "b_roll" | "upload" | "audio"
      timeline_track_type: "video" | "audio"
      trend_source: "youtube_api" | "ai_generated" | "manual"
      trendtube_media_type:
        | "video_image"
        | "background_music"
        | "voiceover"
        | "generated_video"
        | "composited_video"
      trendtube_pipeline_status:
        | "pending"
        | "extracting"
        | "generating_ideas"
        | "generating_media"
        | "compositing"
        | "completed"
        | "failed"
      upload_status: "not_uploaded" | "uploaded"
      video_length: "short" | "medium" | "long"
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
      channel_status: ["active", "error", "syncing"],
      content_tone: [
        "informative",
        "funny",
        "dramatic",
        "casual",
        "professional",
      ],
      export_format: ["mp4", "mov", "webm"],
      export_resolution: ["720p", "1080p", "4k"],
      export_status: ["pending", "completed", "failed"],
      idea_difficulty: ["easy", "medium", "hard"],
      idea_source: ["ai_generated", "user_created"],
      media_provider: ["s3", "r2", "local"],
      media_type: ["image", "video", "audio"],
      project_status: ["draft", "in_progress", "completed", "archived"],
      project_tone: ["informative", "funny", "cinematic", "vlog"],
      project_type: ["short", "long"],
      project_visibility: ["public", "private"],
      scene_video_status: ["pending", "generating", "completed", "failed"],
      script_segment_type: ["hook", "intro", "body", "cta", "outro"],
      thumbnail_overlay_type: ["text", "image"],
      timeline_resource_type: ["scene", "b_roll", "upload", "audio"],
      timeline_track_type: ["video", "audio"],
      trend_source: ["youtube_api", "ai_generated", "manual"],
      trendtube_media_type: [
        "video_image",
        "background_music",
        "voiceover",
        "generated_video",
        "composited_video",
      ],
      trendtube_pipeline_status: [
        "pending",
        "extracting",
        "generating_ideas",
        "generating_media",
        "compositing",
        "completed",
        "failed",
      ],
      upload_status: ["not_uploaded", "uploaded"],
      video_length: ["short", "medium", "long"],
    },
  },
} as const
