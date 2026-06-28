export type CatType = "stray" | "missing" | "injured" | "colony";

export type ReportStatus =
  | "active"
  | "stale"
  | "rescue_accepted"
  | "rescued"
  | "not_found"
  | "resolved";

export type Report = {
  id: string;
  lat: number;
  lng: number;
  cat_type: CatType;
  description: string | null;
  photo_url: string;
  status: ReportStatus;
  last_confirmed_at: string;
  reporter_id: string | null;
  reporter_contact: string | null;
  rescuer_id: string | null;
  rescue_accepted_at: string | null;
  rescue_outcome_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Vote = {
  id: string;
  report_id: string;
  vote: "still_here" | "not_here";
  voter_id: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  created_at: string;
};
