"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase/client";
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
  rescue_accepted: { label: "volunteer assigned", color: "#3B82F6" },
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
  icon: React.ReactNode;
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

  // Who reported it — looked up from the profiles table
  const [reporterProfile, setReporterProfile] = useState<{
    display_name: string | null;
    avatar_url: string | null;
    created_at: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadReporter() {
      if (!report.reporter_id) {
        setReporterProfile(null);
        return;
      }
      const { data } = await supabase
        .from("public_profiles")
        .select("display_name, avatar_url, created_at")
        .eq("id", report.reporter_id)
        .single();
      if (!cancelled) setReporterProfile(data ?? null);
    }
    loadReporter();
    return () => {
      cancelled = true;
    };
  }, [report.reporter_id]);

  // Human-readable area name — reverse-geocoded from lat/lng via Nominatim
  const [areaName, setAreaName] = useState<string | null>(null);

 useEffect(() => {
   let cancelled = false;
   async function loadArea() {
     setAreaName(null);
     try {
       const res = await fetch(
         buildValidatedUrl(
           "https://nominatim.openstreetmap.org/reverse",
           report.lat,
           report.lng,
         ),
       );
      function buildValidatedUrl(
        baseUrl: string,
        lat: number | string,
        lon: number | string,
      ): string {
        try {
          const url = new URL(baseUrl);

          // Normalize to string
          const latStr = String(lat);
          const lonStr = String(lon);

          // Validate latitude and longitude parameters
          if (!/^-?[0-9]+(?:\.[0-9]+)?$/.test(latStr)) {
            throw new Error("Invalid parameter");
          }
          if (!/^-?[0-9]+(?:\.[0-9]+)?$/.test(lonStr)) {
            throw new Error("Invalid parameter");
          }

          // Add query parameters
          url.searchParams.set("format", "json");
          url.searchParams.set("lat", latStr);
          url.searchParams.set("lon", lonStr);
          url.searchParams.set("zoom", "14");

           return url.href;
         } catch {
           throw new Error("Invalid URL");
         }
       }

       const data = await res.json();
       if (cancelled) return;
       const addr = data.address ?? {};
       const area =
         addr.suburb ||
         addr.village ||
         addr.town ||
         addr.city_district ||
         addr.city ||
         addr.county ||
         data.display_name?.split(",")[0] ||
         null;
       setAreaName(area);
     } catch {
       if (!cancelled) setAreaName(null);
     }
   }
   loadArea();
   return () => {
     cancelled = true;
   };
 }, [report.lat, report.lng]);

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

  const reporterInfo = (reporterProfile || areaName) && (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      {reporterProfile?.avatar_url ? (
        <img
          src={reporterProfile.avatar_url}
          alt="reporter"
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#8B80C9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {(reporterProfile?.display_name || "A").charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, color: "#4A3F7A", fontWeight: 500 }}>
          reported by {reporterProfile?.display_name || "a Whiskr user"}
          {reporterProfile?.created_at && (
            <span style={{ color: "#9CA3AF", fontWeight: 400 }}>
              {" "}
              · member since{" "}
              {new Date(reporterProfile.created_at).toLocaleDateString(
                "en-US",
                { month: "short", year: "numeric" },
              )}
            </span>
          )}
        </p>
        {areaName && (
          <p style={{ fontSize: 11, color: "#9CA3AF" }}>
            <img
              src="/icons/pin-button.png"
              alt=""
              style={{ width: 11, height: 11, verticalAlign: "middle" }}
            />{" "}
            near {areaName}
          </p>
        )}
      </div>
    </div>
  );

  // Desktop content — unchanged icon-stack layout
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

      {reporterInfo}

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
          icon={
            <img
              src="/icons/save-button.png"
              alt=""
              style={{ width: 16, height: 16 }}
            />
          }
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

  // Mobile content — header row with icon buttons, framed photo with
  // caption overlay, and a horizontal scrollable pill action row
  const mobileContent = (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={handleSaveClick}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              background: isSaved ? "#8B80C9" : "#E7DBFF",
              color: isSaved ? "white" : "#4A3F7A",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/icons/save-button.png"
              alt=""
              style={{ width: 16, height: 16 }}
            />
          </button>
          <button
            onClick={handleShare}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              background: "#E7DBFF",
              color: "#4A3F7A",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {shareCopied ? "✓" : "🔗"}
          </button>
        </div>
      </div>

      {reporterInfo}

      {/* Horizontal scrollable pill action row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          paddingBottom: 16,
          borderBottom: "0.5px solid #E8E6F0",
          overflowX: "auto",
        }}
      >
        <button
          onClick={handleDirections}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 16px",
            borderRadius: 24,
            border: "none",
            background: "#8B80C9",
            color: "white",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          🧭 directions
        </button>
        <VoteButtons reportId={report.id} variant="pill" />
        <RescueActions
          report={report}
          session={session}
          onAuthRequired={onAuthRequired}
          variant="pill"
        />
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

      <p style={{ fontSize: 12, color: "#9CA3AF" }}>
        ✓ last confirmed {timeAgo(report.last_confirmed_at)}
      </p>
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
            zIndex: 10004,
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
            zIndex: 10005,
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

          <div style={{ padding: "0 16px", marginTop: 8, flexShrink: 0 }}>
            <div
              style={{
                position: "relative",
                borderRadius: 16,
                overflow: "hidden",
                height: 160 + openProgress * 60,
              }}
            >
              <img
                src={report.photo_url}
                alt="cat"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {/* Caption overlay — framed-card look, like Google's place photo */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "20px 12px 10px",
                  background:
                    "linear-gradient(to top, rgba(15,13,26,0.65), transparent)",
                }}
              >
                <p style={{ color: "white", fontSize: 11, fontWeight: 500 }}>
                  🕐 reported {timeAgo(report.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
            {mobileContent}
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
