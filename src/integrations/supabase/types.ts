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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          activity_date?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_results: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          note: string | null
          position: number | null
          student_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          note?: string | null
          position?: number | null
          student_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          note?: string | null
          position?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_results_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_inquiries: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          gender: string | null
          id: string
          message: string | null
          parent_email: string | null
          parent_name: string
          parent_phone: string
          program: string
          status: string
          student_name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          message?: string | null
          parent_email?: string | null
          parent_name: string
          parent_phone: string
          program: string
          status?: string
          student_name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          message?: string | null
          parent_email?: string | null
          parent_name?: string
          parent_phone?: string
          program?: string
          status?: string
          student_name?: string
        }
        Relationships: []
      }
      admissions: {
        Row: {
          address: string | null
          applicant_name: string
          converted_student_id: string | null
          created_at: string
          dob: string | null
          gender: string | null
          id: string
          notes: string | null
          parent_email: string | null
          parent_name: string
          parent_phone: string
          program: Database["public"]["Enums"]["program_type"]
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_inquiry_id: string | null
          status: Database["public"]["Enums"]["admission_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          applicant_name: string
          converted_student_id?: string | null
          created_at?: string
          dob?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          parent_email?: string | null
          parent_name: string
          parent_phone: string
          program: Database["public"]["Enums"]["program_type"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_inquiry_id?: string | null
          status?: Database["public"]["Enums"]["admission_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          applicant_name?: string
          converted_student_id?: string | null
          created_at?: string
          dob?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          parent_email?: string | null
          parent_name?: string
          parent_phone?: string
          program?: Database["public"]["Enums"]["program_type"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_inquiry_id?: string | null
          status?: Database["public"]["Enums"]["admission_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_converted_student_id_fkey"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_source_inquiry_id_fkey"
            columns: ["source_inquiry_id"]
            isOneToOne: false
            referencedRelation: "admission_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          action: Database["public"]["Enums"]["approval_action"]
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          entity_type: Database["public"]["Enums"]["approval_entity"]
          id: string
          payload: Json
          requested_by: string
          status: Database["public"]["Enums"]["approval_status"]
          target_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["approval_action"]
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          entity_type: Database["public"]["Enums"]["approval_entity"]
          id?: string
          payload?: Json
          requested_by: string
          status?: Database["public"]["Enums"]["approval_status"]
          target_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["approval_action"]
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          entity_type?: Database["public"]["Enums"]["approval_entity"]
          id?: string
          payload?: Json
          requested_by?: string
          status?: Database["public"]["Enums"]["approval_status"]
          target_id?: string | null
        }
        Relationships: []
      }
      attendance_entries: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          note: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["entry_status"]
          submitted_by: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          submitted_by: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          submitted_by?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_marks: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          remark: string | null
          status: Database["public"]["Enums"]["attendance_mark"]
          student_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          remark?: string | null
          status?: Database["public"]["Enums"]["attendance_mark"]
          student_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          remark?: string | null
          status?: Database["public"]["Enums"]["attendance_mark"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_marks_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "attendance_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          after: Json | null
          at: string
          before: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          academic_year: string
          created_at: string
          id: string
          name: string
          primary_teacher_id: string | null
          program: Database["public"]["Enums"]["program_type"]
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          academic_year?: string
          created_at?: string
          id?: string
          name: string
          primary_teacher_id?: string | null
          program: Database["public"]["Enums"]["program_type"]
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          id?: string
          name?: string
          primary_teacher_id?: string | null
          program?: Database["public"]["Enums"]["program_type"]
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_primary_teacher_id_fkey"
            columns: ["primary_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_marks: {
        Row: {
          created_at: string
          entry_id: string
          grade: Database["public"]["Enums"]["daily_grade"]
          id: string
          reason: string | null
          remark: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          grade: Database["public"]["Enums"]["daily_grade"]
          id?: string
          reason?: string | null
          remark?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          grade?: Database["public"]["Enums"]["daily_grade"]
          id?: string
          reason?: string | null
          remark?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_marks_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "daily_marks_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_marks_entries: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          note: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["entry_status"]
          subject_id: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          subject_id: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          subject_id?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_marks: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          is_absent: boolean
          marks_obtained: number | null
          student_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          is_absent?: boolean
          marks_obtained?: number | null
          student_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          is_absent?: boolean
          marks_obtained?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_marks_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "exam_marks_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_marks_entries: {
        Row: {
          class_id: string
          created_at: string
          exam_name: string
          id: string
          note: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["entry_status"]
          subject_id: string
          submitted_by: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          exam_name: string
          id?: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          subject_id: string
          submitted_by: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          exam_name?: string
          id?: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          subject_id?: string
          submitted_by?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: []
      }
      fee_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          month: string
          notes: string | null
          paid_on: string
          reference_no: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["entry_status"]
          student_id: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          month: string
          notes?: string | null
          paid_on?: string
          reference_no?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          student_id: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          month?: string
          notes?: string | null
          paid_on?: string
          reference_no?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          student_id?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          audience: string
          body: string | null
          class_id: string | null
          created_at: string
          created_by: string
          id: string
          parent_user_id: string | null
          student_id: string | null
          title: string
          type: string
        }
        Insert: {
          audience?: string
          body?: string | null
          class_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          parent_user_id?: string | null
          student_id?: string | null
          title: string
          type?: string
        }
        Update: {
          audience?: string
          body?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          parent_user_id?: string | null
          student_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      parent_links: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          parent_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          parent_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string
          relation: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone: string
          relation?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          relation?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ptm_reports: {
        Row: {
          action_items: string | null
          created_at: string
          created_by: string
          id: string
          improvements: string | null
          meeting_date: string | null
          period: string
          strengths: string | null
          student_id: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          action_items?: string | null
          created_at?: string
          created_by: string
          id?: string
          improvements?: string | null
          meeting_date?: string | null
          period: string
          strengths?: string | null
          student_id: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          action_items?: string | null
          created_at?: string
          created_by?: string
          id?: string
          improvements?: string | null
          meeting_date?: string | null
          period?: string
          strengths?: string | null
          student_id?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ptm_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      remarks_entries: {
        Row: {
          body: string
          category: string | null
          class_id: string
          created_at: string
          date: string
          id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scope: Database["public"]["Enums"]["remark_scope"]
          severity: string | null
          status: Database["public"]["Enums"]["entry_status"]
          student_id: string | null
          submitted_by: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string | null
          class_id: string
          created_at?: string
          date?: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope?: Database["public"]["Enums"]["remark_scope"]
          severity?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          student_id?: string | null
          submitted_by: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string | null
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope?: Database["public"]["Enums"]["remark_scope"]
          severity?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          student_id?: string | null
          submitted_by?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          academic_year: string | null
          contact_email: string | null
          contact_phone: string | null
          default_language: string | null
          grading_scale: Json
          id: number
          institution_logo_url: string | null
          institution_name: string
          late_fee_amount: number | null
          late_fee_grace_days: number | null
          primary_theme_id: string | null
          tagline: string | null
          themes: Json | null
          updated_at: string
          urdu_enabled: boolean | null
          verification_rules: Json
        }
        Insert: {
          academic_year?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          default_language?: string | null
          grading_scale?: Json
          id?: number
          institution_logo_url?: string | null
          institution_name?: string
          late_fee_amount?: number | null
          late_fee_grace_days?: number | null
          primary_theme_id?: string | null
          tagline?: string | null
          themes?: Json | null
          updated_at?: string
          urdu_enabled?: boolean | null
          verification_rules?: Json
        }
        Update: {
          academic_year?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          default_language?: string | null
          grading_scale?: Json
          id?: number
          institution_logo_url?: string | null
          institution_name?: string
          late_fee_amount?: number | null
          late_fee_grace_days?: number | null
          primary_theme_id?: string | null
          tagline?: string | null
          themes?: Json | null
          updated_at?: string
          urdu_enabled?: boolean | null
          verification_rules?: Json
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          assigned_teacher_id: string | null
          class_id: string | null
          cnic: string | null
          created_at: string
          dob: string | null
          enrollment_date: string
          father_name: string | null
          full_name: string
          gender: string | null
          id: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          previous_madrassah: string | null
          program: Database["public"]["Enums"]["program_type"]
          status: Database["public"]["Enums"]["entity_status"]
          student_code: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_teacher_id?: string | null
          class_id?: string | null
          cnic?: string | null
          created_at?: string
          dob?: string | null
          enrollment_date?: string
          father_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          previous_madrassah?: string | null
          program: Database["public"]["Enums"]["program_type"]
          status?: Database["public"]["Enums"]["entity_status"]
          student_code?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_teacher_id?: string | null
          class_id?: string | null
          cnic?: string | null
          created_at?: string
          dob?: string | null
          enrollment_date?: string
          father_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          previous_madrassah?: string | null
          program?: Database["public"]["Enums"]["program_type"]
          status?: Database["public"]["Enums"]["entity_status"]
          student_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_assigned_teacher_id_fkey"
            columns: ["assigned_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
          program: Database["public"]["Enums"]["program_type"]
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          program: Database["public"]["Enums"]["program_type"]
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          program?: Database["public"]["Enums"]["program_type"]
          sort_order?: number
        }
        Relationships: []
      }
      teacher_classes: {
        Row: {
          class_id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          cnic: string | null
          created_at: string
          dob: string | null
          emergency_contact: string | null
          employment_status: Database["public"]["Enums"]["employment_status"]
          experience_years: number | null
          father_name: string | null
          full_name: string
          gender: string | null
          id: string
          joining_date: string | null
          phone: string | null
          photo_url: string | null
          qualification: string | null
          specializations: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cnic?: string | null
          created_at?: string
          dob?: string | null
          emergency_contact?: string | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          experience_years?: number | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          joining_date?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cnic?: string | null
          created_at?: string
          dob?: string | null
          emergency_contact?: string | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          experience_years?: number | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          joining_date?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      verification_queue: {
        Row: {
          entity_id: string | null
          entity_type: string | null
          id: string | null
          label: string | null
          submitted_at: string | null
          submitted_by: string | null
          submitted_by_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      app_decide_submission: {
        Args: {
          _approve: boolean
          _entity_id: string
          _entity_type: string
          _note?: string
        }
        Returns: undefined
      }
      app_generate_student_code: { Args: never; Returns: string }
      app_promote_admission: {
        Args: {
          _admission_id: string
          _class_id: string
          _enrollment_date: string
          _teacher_id: string
        }
        Returns: string
      }
      app_submit_daily_marks_matrix: {
        Args: { _class_id: string; _date: string; _payload: Json }
        Returns: undefined
      }
      get_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      admission_status: "pending" | "approved" | "rejected" | "info_requested"
      app_role: "admin" | "operator" | "parent"
      approval_action: "create" | "delete"
      approval_entity: "student" | "user"
      approval_status: "pending" | "approved" | "rejected"
      attendance_mark: "present" | "absent" | "late" | "excused"
      audit_action: "insert" | "update" | "delete"
      daily_grade: "aala" | "behter" | "munasib" | "kamzore" | "naaga"
      employment_status: "active" | "on_leave" | "resigned"
      entity_status: "active" | "inactive" | "pending"
      entry_status: "pending" | "approved" | "rejected"
      payment_method: "cash" | "bank" | "other"
      program_type: "hifz" | "nazra"
      remark_scope: "individual" | "class"
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
      admission_status: ["pending", "approved", "rejected", "info_requested"],
      app_role: ["admin", "operator", "parent"],
      approval_action: ["create", "delete"],
      approval_entity: ["student", "user"],
      approval_status: ["pending", "approved", "rejected"],
      attendance_mark: ["present", "absent", "late", "excused"],
      audit_action: ["insert", "update", "delete"],
      daily_grade: ["aala", "behter", "munasib", "kamzore", "naaga"],
      employment_status: ["active", "on_leave", "resigned"],
      entity_status: ["active", "inactive", "pending"],
      entry_status: ["pending", "approved", "rejected"],
      payment_method: ["cash", "bank", "other"],
      program_type: ["hifz", "nazra"],
      remark_scope: ["individual", "class"],
    },
  },
} as const
