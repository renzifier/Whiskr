"use client";

import { useState, useEffect } from "react";
import type { Report } from "../../../types";
import type { Session } from "@supabase/supabase-js";
import VoteButtons from "./votebuttons";
import RescueActions from "./rescueactions";

type Props = {
  report: Report;
  session: Session;
  onClose: () => void;
  onAuthRequired: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
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
  isSaved,
  onToggleSave,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const status = statusLabels[report.status] ?? statusLabels.active;

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setExpanded(false);
  }, [report.id]);

  const content = (
    <>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
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

        <button
          onClick={() => {
            if (!session) {
              onAuthRequired();
              return;
            }
            onToggleSave();
          }}
          title={isSaved ? "remove from saved" : "save this report"}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            padding: 0,
            opacity: isSaved ? 1 : 0.4,
          }}
        >
          🔖
        </button>
      </div>

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

      <VoteButtons reportId={report.id} />
      <RescueActions
        report={report}
        session={session}
        onAuthRequired={onAuthRequired}
      />
    </>
  );

  if (isMobile) {
    return (
      <div
        onTouchStart={(e) => setDragStartY(e.touches[0].clientY)}
        onTouchEnd={(e) => {
          if (dragStartY === null) return;
          const delta = e.changedTouches[0].clientY - dragStartY;
          if (delta < -40) setExpanded(true);
          else if (delta > 40) {
            if (expanded) setExpanded(false);
            else onClose();
          }
          setDragStartY(null);
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          background: "rgba(255,255,255,0.98)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 24px rgba(74,63,122,0.15)",
          overflow: "hidden",
          transition: "max-height 0.3s ease",
          maxHeight: expanded ? "90vh" : "60vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            padding: "12px 0 8px",
            cursor: "grab",
            flexShrink: 0,
            touchAction: "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              background: "#E8E6F0",
              borderRadius: 2,
              margin: "0 auto",
            }}
          />
        </div>

        {/* Photo */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img
            src={report.photo_url}
            alt="cat"
            style={{
              width: "100%",
              height: expanded ? 200 : 140,
              objectFit: "cover",
              transition: "height 0.3s ease",
            }}
          />
        </div>

        {/* Scrollable content */}
        <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>{content}</div>
      </div>
    );
  }

  // Desktop sidebar
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
      <div style={{ position: "relative" }}>
        <img
          src={report.photo_url}
          alt="cat"
          style={{ width: "100%", height: 180, objectFit: "cover" }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
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
            color: "#4A3F7A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>{content}</div>
    </div>
  );
}
