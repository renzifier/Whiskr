"use client";

import { useState, useEffect, useRef } from "react";
import type { Report } from "../../../types";
import type { Session } from "@supabase/supabase-js";
import VoteButtons from "./votebuttons";
import RescueActions from "./rescueactions";

type Props = {
  report: Report;
  session: Session;
  onClose: () => void;
  onCollapseSidebar: () => void;
  onAuthRequired: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  isMobile: boolean;
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

function QuickActionIcon({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#E7DBFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          color: "#4A3F7A",
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontSize: 10,
          color: "#4A3F7A",
          fontWeight: 500,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </button>
  );
}

export default function DetailPanel({
  report,
  session,
  onClose,
  onCollapseSidebar,
  onAuthRequired,
  isSaved,
  onToggleSave,
  isMobile,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const status = statusLabels[report.status] ?? statusLabels.active;

  // --- Mobile bottom sheet: transform-based drag + snap animation ---
  const COLLAPSED_RATIO = 0.45;
  const EXPANDED_RATIO = 0.88;
  const CLOSE_DRAG_THRESHOLD = 90; // px dragged past collapsed before it closes

  function computeMetrics() {
    if (typeof window === "undefined") {
      return { expandedHeight: 0, collapsedTranslate: 0 };
    }
    const expandedHeight = window.innerHeight * EXPANDED_RATIO;
    const collapsedHeight = window.innerHeight * COLLAPSED_RATIO;
    return {
      expandedHeight,
      collapsedTranslate: expandedHeight - collapsedHeight,
    };
  }

  const [sheetPhase, setSheetPhase] = useState<
    "collapsed" | "expanded" | "closing"
  >("collapsed");
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startY: 0, startTranslate: 0 });
  const sheetHeightRef = useRef(computeMetrics().expandedHeight);
  const collapsedTranslateRef = useRef(computeMetrics().collapsedTranslate);
  // Start already snapped to the peek position — no top-to-bottom jump on mount
  const [translateY, setTranslateY] = useState(
    () => computeMetrics().collapsedTranslate,
  );

  useEffect(() => {
    function measure() {
      const { expandedHeight, collapsedTranslate } = computeMetrics();
      sheetHeightRef.current = expandedHeight;
      collapsedTranslateRef.current = collapsedTranslate;
      // Keep the sheet snapped to its current phase after a resize
      setTranslateY(sheetPhase === "expanded" ? 0 : collapsedTranslate);
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // New report opened — always re-open at the collapsed (peek) height
    setSheetPhase("collapsed");
    setTranslateY(collapsedTranslateRef.current);
  }, [report.id]);

  function handleSheetTouchStart(e: React.TouchEvent) {
    dragStartRef.current = {
      startY: e.touches[0].clientY,
      startTranslate: translateY,
    };
    setIsDragging(true);
  }

  function handleSheetTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - dragStartRef.current.startY;
    const next = Math.min(
      Math.max(0, dragStartRef.current.startTranslate + delta),
      sheetHeightRef.current,
    );
    setTranslateY(next);
  }

  function handleSheetTouchEnd() {
    setIsDragging(false);

    if (translateY < collapsedTranslateRef.current / 2) {
      // Dragged up past the halfway point to peek — snap fully open
      setSheetPhase("expanded");
      setTranslateY(0);
    } else if (
      translateY >
      collapsedTranslateRef.current + CLOSE_DRAG_THRESHOLD
    ) {
      // Dragged well below the peek height — slide all the way down,
      // then actually close once the animation finishes
      setSheetPhase("closing");
      setTranslateY(sheetHeightRef.current);
      setTimeout(onClose, 300);
    } else {
      // Snap back to the peek height
      setSheetPhase("collapsed");
      setTranslateY(collapsedTranslateRef.current);
    }
  }

  // How "open" the sheet currently is, 0 (peek) to 1 (fully expanded) —
  // drives the backdrop's dimming so it fades in smoothly as you drag up
  const openProgress =
    collapsedTranslateRef.current > 0
      ? 1 - translateY / collapsedTranslateRef.current
      : 0;

  useEffect(() => {
    if (isMobile) return; // mobile already closes via swipe-down

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as HTMLElement;
      // Don't fight with clicking a different pin — its own click handler
      // already manages switching the selection.
      if (target.closest(".leaflet-marker-icon")) return;

      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobile, onClose]);

  function handleDirections() {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${report.lat},${report.lng}`,
      "_blank",
    );
  }

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?report=${report.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    });
  }

  function handleSaveClick() {
    if (!session) {
      onAuthRequired();
      return;
    }
    onToggleSave();
  }

  const content = (
    <>
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

      {/* Quick action row — Google Maps style: icon above label */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 16,
          paddingBottom: 16,
          borderBottom: "0.5px solid #E8E6F0",
          flexWrap: "wrap",
        }}
      >
        <QuickActionIcon
          icon="🧭"
          label="directions"
          onClick={handleDirections}
        />
        <QuickActionIcon
          icon="🔖"
          label={isSaved ? "saved" : "save"}
          onClick={handleSaveClick}
        />
        <VoteButtons reportId={report.id} />
        <QuickActionIcon
          icon="🔗"
          label={shareCopied ? "copied!" : "share"}
          onClick={handleShare}
        />
      </div>

      <RescueActions
        report={report}
        session={session}
        onAuthRequired={onAuthRequired}
      />
    </>
  );

  if (isMobile) {
    const sheetTransition = isDragging
      ? "none"
      : "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)";

    return (
      <>
        {/* Dimming backdrop — fades in as the sheet gets dragged up */}
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: `rgba(15,13,26,${0.35 * Math.max(0, Math.min(1, openProgress))})`,
            zIndex: 499,
            pointerEvents: openProgress > 0.05 ? "auto" : "none",
            transition: isDragging ? "none" : "background 0.32s ease",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: sheetHeightRef.current || "88vh",
            zIndex: 500,
            background: "rgba(255,255,255,0.98)",
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -4px 24px rgba(74,63,122,0.18)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transform: `translateY(${translateY}px)`,
            transition: sheetTransition,
            willChange: "transform",
          }}
        >
          <div
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
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
                background: isDragging ? "#8B80C9" : "#E8E6F0",
                borderRadius: 2,
                margin: "0 auto",
                transition: "background 0.15s ease",
              }}
            />
          </div>

          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={report.photo_url}
              alt="cat"
              style={{
                width: "100%",
                height: 160 + openProgress * 60,
                objectFit: "cover",
              }}
            />
          </div>

          <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
            {content}
          </div>
        </div>
      </>
    );
  }

  // Desktop: slides in from the left, docked right after the Sidebar rail
  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: 80,
        left: 88,
        bottom: 0,
        width: 320,
        zIndex: 9999,
        animation: "whiskr-panel-slide-in 0.25s ease",
      }}
    >
      <style>{`
        @keyframes whiskr-panel-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          height: "100%",
          background: "rgba(255,255,255,0.98)",
          boxShadow: "4px 0 24px rgba(74,63,122,0.15)",
          borderRadius: "16px 0 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative" }}>
          <img
            src={report.photo_url}
            alt="cat"
            style={{ width: "100%", height: 180, objectFit: "cover" }}
          />
        </div>
        <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>{content}</div>
      </div>

      {/* Arrow tab — closes the panel AND collapses the sidebar */}
      <button
        onClick={() => {
          onClose();
          onCollapseSidebar();
        }}
        style={{
          position: "absolute",
          top: "50%",
          right: -22,
          transform: "translateY(-50%)",
          width: 22,
          height: 52,
          borderRadius: "0 12px 12px 0",
          border: "none",
          background: "white",
          boxShadow: "2px 0 8px rgba(74,63,122,0.15)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: "#8B80C9",
        }}
      >
        ‹
      </button>
    </div>
  );
}
