export type Department =
  | "digital_marketing"
  | "tech_operations"
  | "customer_experience"
  | "data_decision_making"
  | "team_readiness";

export type ResolutionPath = "diy" | "refer" | "auto";
export type RoadmapStatus = "open" | "in_progress" | "done";
export type InviteStatus = "pending" | "accepted" | "declined";
export type UserRole = "owner" | "member";
export type TeamSize = "1-5" | "6-15" | "16-50" | "50+";
export type DeepDiveSource = "seed" | "freeform";
export type GapStatus = "open" | "in_progress" | "resolved";
export type GapFixPath = "diy" | "vetted_provider" | "gaplens_executes";
export type GapPriority = "high" | "medium" | "low";
export type GapEffort = "low" | "medium" | "high";
export type FreeformChatRole = "user" | "assistant";
export type VisualConsultationType = "visual_identity";
export type FeatureInterestEventType = "click" | "submit";
export type PriceBand = "none" | "low" | "mid" | "high";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          sector: string | null;
          size: string | null;
          logo_url: string | null;
          freeform_chat_summary: string | null;
          freeform_chat_summarized_count: number;
          onboarding_completed_at: string | null;
          currency: string;
          avg_hourly_cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sector?: string | null;
          size?: string | null;
          logo_url?: string | null;
          freeform_chat_summary?: string | null;
          freeform_chat_summarized_count?: number;
          onboarding_completed_at?: string | null;
          currency?: string;
          avg_hourly_cost?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          company_id: string | null;
          name: string | null;
          role: UserRole;
          email: string;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          company_id?: string | null;
          name?: string | null;
          role?: UserRole;
          email: string;
          phone?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      assessment_sessions: {
        Row: {
          id: string;
          company_id: string;
          team_size: TeamSize | null;
          started_at: string;
          completed_at: string | null;
          overall_gap: number | null;
          scan_answers: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          team_size?: TeamSize | null;
          started_at?: string;
          completed_at?: string | null;
          overall_gap?: number | null;
          scan_answers?: Record<string, unknown> | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["assessment_sessions"]["Insert"]
        >;
        Relationships: [];
      };
      department_scores: {
        Row: {
          id: string;
          session_id: string;
          department: Department;
          score: number;
          answers: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          department: Department;
          score?: number;
          answers?: Record<string, unknown>;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["department_scores"]["Insert"]
        >;
        Relationships: [];
      };
      tools: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          catalog_id: string | null;
          is_connected: boolean;
          importance: number;
          position_x: number | null;
          position_y: number | null;
          monthly_cost: number | null;
          currency: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          catalog_id?: string | null;
          is_connected?: boolean;
          importance?: number;
          position_x?: number | null;
          position_y?: number | null;
          monthly_cost?: number | null;
          currency?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tools"]["Insert"]>;
        Relationships: [];
      };
      roadmap_items: {
        Row: {
          id: string;
          session_id: string;
          gap_title: string;
          priority: number;
          resolution_path: ResolutionPath | null;
          status: RoadmapStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          gap_title: string;
          priority?: number;
          resolution_path?: ResolutionPath | null;
          status?: RoadmapStatus;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["roadmap_items"]["Insert"]
        >;
        Relationships: [];
      };
      team_invites: {
        Row: {
          id: string;
          session_id: string;
          department: Department;
          token: string;
          invitee_name: string | null;
          email: string | null;
          status: InviteStatus;
          invited_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          department: Department;
          token?: string;
          invitee_name?: string | null;
          email?: string | null;
          status?: InviteStatus;
          invited_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["team_invites"]["Insert"]
        >;
        Relationships: [];
      };
      deep_dive_responses: {
        Row: {
          id: string;
          session_id: string;
          invite_id: string | null;
          department: Department;
          question_key: string;
          answer_text: string;
          source: DeepDiveSource;
          attempt: number;
          started_at: string;
          answered_at: string;
          response_length: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          invite_id?: string | null;
          department: Department;
          question_key: string;
          answer_text: string;
          source?: DeepDiveSource;
          attempt?: number;
          started_at?: string;
          answered_at?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["deep_dive_responses"]["Insert"]
        >;
        Relationships: [];
      };
      roadmap_versions: {
        Row: {
          id: string;
          session_id: string;
          version: number;
          generated_at: string;
          based_on_departments: Department[];
          roadmap_json: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          version: number;
          generated_at?: string;
          based_on_departments?: Department[];
          roadmap_json: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["roadmap_versions"]["Insert"]
        >;
        Relationships: [];
      };
      gap_status_overrides: {
        Row: {
          id: string;
          session_id: string;
          gap_title: string;
          status: GapStatus;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          gap_title: string;
          status: GapStatus;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["gap_status_overrides"]["Insert"]
        >;
        Relationships: [];
      };
      visual_consultations: {
        Row: {
          id: string;
          session_id: string;
          type: VisualConsultationType;
          result_gaps: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          type: VisualConsultationType;
          result_gaps: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["visual_consultations"]["Insert"]
        >;
        Relationships: [];
      };
      feature_interest_signals: {
        Row: {
          id: string;
          company_id: string;
          event_type: FeatureInterestEventType;
          price_band: PriceBand | null;
          platforms: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          event_type: FeatureInterestEventType;
          price_band?: PriceBand | null;
          platforms?: string[] | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["feature_interest_signals"]["Insert"]
        >;
        Relationships: [];
      };
      freeform_chat_messages: {
        Row: {
          id: string;
          company_id: string;
          role: FreeformChatRole;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          role: FreeformChatRole;
          content: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["freeform_chat_messages"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
