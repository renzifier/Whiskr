"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { Report } from "../../../types";
import type { Session } from "@supabase/supabase-js";

type Props = {
  report: Report;
  session: Session;
  onAuthRequired: () => void;
  variant?: "icon" | "pill";
};

function ActionIcon({
  icon,
  label,
  onClick,
  active,
  disabled,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        background: "transparent",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        flex: 1,
        minWidth: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: active ? (color ?? "#8B80C9") : "rgba(139,128,201,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          color: active ? "white" : (color ?? "#8B80C9"),
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.55)",
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

function PillButton({
  icon,
  label,
  onClick,
  active,
  disabled,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 16px",
        borderRadius: 24,
        border: "none",
        background: active ? (color ?? "#8B80C9") : "rgba(139,128,201,0.18)",
        color: active ? "white" : (color ?? "#8B80C9"),
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "default" : "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

export default function RescueActions({
  report,
  session,
  onAuthRequired,
  variant = "icon",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [volunteerProfile, setVolunteerProfile] = useState<{
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [volunteerRescueCount, setVolunteerRescueCount] = useState<
    number | null
  >(null);

  const isRescuer = report.rescuer_id === session.user.id;

  useEffect(() => {
    let cancelled = false;
    async function loadVolunteer() {
      const relevantStatus =
        report.status === "rescue_accepted" || report.status === "rescued";
      if (!relevantStatus || !report.rescuer_id) {
        setVolunteerProfile(null);
        setVolunteerRescueCount(null);
        return;
      }
      const { data } = await supabase
        .from("public_profiles")
        .select("display_name, avatar_url")
        .eq("id", report.rescuer_id)
        .single();
      if (!cancelled) setVolunteerProfile(data ?? null);

      const { count } = await supabase
        .from("public_reports")
        .select("id", { count: "exact", head: true })
        .eq("rescuer_id", report.rescuer_id)
        .eq("status", "rescued");
      if (!cancelled) setVolunteerRescueCount(count ?? 0);
    }
    loadVolunteer();
    return () => {
      cancelled = true;
    };
  }, [report.status, report.rescuer_id]);

  // Refetch the contact whenever this component mounts/remounts while the
  // current user is the assigned rescuer — previously this only ever got
  // set right after clicking accept, so reopening the panel later showed
  // nothing even though RLS would still allow reading it.
  useEffect(() => {
    let cancelled = false;
    async function loadContact() {
      if (!isRescuer || report.status !== "rescue_accepted") {
        return;
      }
      const { data } = await supabase
        .from("report_contacts")
        .select("contact")
        .eq("report_id", report.id)
        .maybeSingle();
      if (!cancelled) setContact(data?.contact ?? null);
    }
    loadContact();
    return () => {
      cancelled = true;
    };
  }, [report.id, report.status, isRescuer]);

  const Button = variant === "pill" ? PillButton : ActionIcon;

  async function handleAccept() {
    if (!session) {
      onAuthRequired();
      return;
    }
    setLoading(true);
    setError("");

    const { data, error } = await supabase.rpc("accept_rescue", {
      p_report_id: report.id,
    });

    if (error || !data?.success) {
      setError(data?.error ?? "Failed to volunteer for this rescue");
    } else {
      setContact(data.contact);
    }
    setLoading(false);
  }

  async function handleComplete(outcome: "rescued" | "not_found") {
    setLoading(true);
    const { data, error } = await supabase.rpc("complete_rescue", {
      p_report_id: report.id,
      p_outcome: outcome,
    });

    if (error) {
      setError("Failed to complete rescue");
      setLoading(false);
      return;
    }

    setLoading(false);
    window.dispatchEvent(
      new CustomEvent("rescue-completed", {
        detail: { reportId: report.id },
      }),
    );
  }

  async function handleRelease() {
    setLoading(true);
    await supabase.rpc("release_rescue", { p_report_id: report.id });
    setLoading(false);
  }

  if (report.status === "rescued" || report.status === "not_found") {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "12px 0",
          color: "rgba(255,255,255,0.55)",
          fontSize: 13,
        }}
      >
        {report.status === "rescued"
          ? "🐱 This cat was rescued"
          : "😔 Cat was not found"}
      </div>
    );
  }

  if (report.status === "rescue_accepted" && isRescuer) {
    return (
      <div style={{ width: variant === "pill" ? "auto" : "100%" }}>
        {contact && variant !== "pill" && (
          <div
            style={{
              background: "rgba(139,128,201,0.18)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#8B80C9",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Reporter Contact
            </p>
            <p style={{ fontSize: 13, color: "white" }}>{contact}</p>
          </div>
        )}
        <div style={{ display: "flex", gap: variant === "pill" ? 8 : 4 }}>
          <Button
            icon={
              <img
                src="/icons/still-here.png"
                alt=""
                style={{ width: 16, height: 16 }}
              />
            }
            label="Rescued"
            color="#10B981"
            disabled={loading}
            onClick={() => handleComplete("rescued")}
          />
          <Button
            icon={
              <img
                src="/icons/not-here.png"
                alt=""
                style={{ width: 16, height: 16 }}
              />
            }
            label="Not Found"
            color="#EF4444"
            disabled={loading}
            onClick={() => handleComplete("not_found")}
          />
          <Button
            icon="↩"
            label="Release"
            color="rgba(255,255,255,0.55)"
            disabled={loading}
            onClick={handleRelease}
          />
        </div>
      </div>
    );
  }

  if (report.status === "rescue_accepted" && !isRescuer) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          background: "rgba(59,130,246,0.14)",
          borderRadius: 12,
        }}
      >
        {volunteerProfile?.avatar_url ? (
          <img
            src={volunteerProfile.avatar_url}
            alt="Volunteer"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#3B82F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {(volunteerProfile?.display_name || "V").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p style={{ fontSize: 13, color: "#3B82F6", fontWeight: 500 }}>
            {volunteerProfile?.display_name || "A volunteer"} is on the way
          </p>
          {volunteerRescueCount !== null && volunteerRescueCount > 0 && (
            <p style={{ fontSize: 11, color: "#60A5FA" }}>
              Helped with {volunteerRescueCount}{" "}
              {volunteerRescueCount === 1 ? "rescue" : "rescues"}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: variant === "pill" ? "auto" : "100%" }}>
      {error && (
        <p
          style={{
            fontSize: 12,
            color: "#EF4444",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {error}
        </p>
      )}
      <Button
        icon={
          <img
            src="/icons/whiskr-icon.png"
            alt=""
            style={{ width: 16, height: 16 }}
          />
        }
        label={loading ? "Volunteering..." : "Volunteer to Help"}
        color="#4A3F7A"
        active
        disabled={loading}
        onClick={handleAccept}
      />
    </div>
  );
}
