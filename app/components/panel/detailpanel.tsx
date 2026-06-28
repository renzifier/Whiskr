"use client";

import type { Report } from "../../../types";
import type { Session } from "@supabase/supabase-js";
import VoteButtons from "./votebuttons";
import RescueActions from "./rescueactions";

type Props = {
  report: Report;
  session: Session;
  onClose: () => void;
  onAuthRequired: () => void;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "active", color: "#10B981" },
  stale: { label: "stale", color: "#9CA3AF" },
  rescue_accepted: { label: "rescue accepted", color: "#3B82F6" },
  rescued: { label: "rescued", color: "#10B981" },
  not_found: { label: "not found", color: "#9CA3AF" },
  resolved: { label: "resolved", color: "#9CA3AF" },
};

const typeLabels: Record<string, string> = {
  stray: "stray",
  missing: "missing",
  injured: "injured",
  colony: "colony",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DetailPanel({
  report,
  session,
  onClose,
  onAuthRequired,
}: Props) {
  const status = statusLabels[report.status] ?? statusLabels.active;

  return (
    <div
      style={{
        width: 300,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderLeft: "0.5px solid #E8E6F0",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Photo */}
      <div style={{ position: "relative" }}>
        <img
          src={report.photo_url}
          alt="cat"
          style={{
            width: "100%",
            height: 180,
            objectFit: "cover",
          }}
        />
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "none",
            background: "rgba(255,255,255,0.9)",
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4A3F7A",
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
        {/* Status + type badges */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              background: "#E7DBFF",
              color: "#4A3F7A",
            }}
          >
            {typeLabels[report.cat_type]}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              background: `${status.color}20`,
              color: status.color,
            }}
          >
            {status.label}
          </span>
        </div>

        {/* Description */}
        {report.description && (
          <p
            style={{
              fontSize: 13,
              color: "#4A3F7A",
              marginBottom: 12,
              lineHeight: 1.5,
            }}
          >
            {report.description}
          </p>
        )}

        {/* Meta */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>
            🕐 reported {timeAgo(report.created_at)}
          </p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>
            ✓ last confirmed {timeAgo(report.last_confirmed_at)}
          </p>
        </div>

        {/* Votes */}
        <VoteButtons reportId={report.id} />

        {/* Rescue actions */}
        <RescueActions
          report={report}
          session={session}
          onAuthRequired={onAuthRequired}
        />
      </div>
    </div>
  );
}
