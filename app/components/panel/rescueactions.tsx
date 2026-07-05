"use client";

import { useState } from "react";
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
  icon: string;
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
          background: active ? (color ?? "#8B80C9") : "#E7DBFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          color: active ? "white" : (color ?? "#4A3F7A"),
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

function PillButton({
  icon,
  label,
  onClick,
  active,
  disabled,
  color,
}: {
  icon: string;
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
        background: active ? (color ?? "#8B80C9") : "#E7DBFF",
        color: active ? "white" : (color ?? "#4A3F7A"),
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

  const isRescuer = report.rescuer_id === session.user.id;
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
      setError(data?.error ?? "failed to accept rescue");
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
      setError("failed to complete rescue");
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
          color: "#9CA3AF",
          fontSize: 13,
        }}
      >
        {report.status === "rescued"
          ? "🐱 this cat was rescued"
          : "😔 cat was not found"}
      </div>
    );
  }

  if (report.status === "rescue_accepted" && isRescuer) {
    return (
      <div style={{ width: variant === "pill" ? "auto" : "100%" }}>
        {contact && variant !== "pill" && (
          <div
            style={{
              background: "#E7DBFF",
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#4A3F7A",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              reporter contact
            </p>
            <p style={{ fontSize: 13, color: "#4A3F7A" }}>{contact}</p>
          </div>
        )}
        <div style={{ display: "flex", gap: variant === "pill" ? 8 : 4 }}>
          <Button
            icon="✓"
            label="rescued"
            color="#10B981"
            disabled={loading}
            onClick={() => handleComplete("rescued")}
          />
          <Button
            icon="✗"
            label="not found"
            color="#EF4444"
            disabled={loading}
            onClick={() => handleComplete("not_found")}
          />
          <Button
            icon="↩"
            label="release"
            color="#9CA3AF"
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
          textAlign: "center",
          padding: "12px 0",
          color: "#3B82F6",
          fontSize: 13,
        }}
      >
        🔵 a volunteer is on the way
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
        icon="🐾"
        label={loading ? "accepting..." : "accept rescue"}
        color="#4A3F7A"
        active
        disabled={loading}
        onClick={handleAccept}
      />
    </div>
  );
}
