"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { Report } from "../../../types";
import type { Session } from "@supabase/supabase-js";

type Props = {
  report: Report;
  session: Session;
  onAuthRequired: () => void;
};

export default function RescueActions({
  report,
  session,
  onAuthRequired,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isRescuer = report.rescuer_id === session.user.id;

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
    // Manually trigger UI update since Realtime may not fire
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
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {contact && (
          <div
            style={{
              background: "#E7DBFF",
              borderRadius: 10,
              padding: 12,
              marginBottom: 4,
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
        <button
          onClick={() => handleComplete("rescued")}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            background: "#10B981",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          mark rescued ✓
        </button>
        <button
          onClick={() => handleComplete("not_found")}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            background: "white",
            color: "#EF4444",
            border: "1.5px solid #EF4444",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          not found ✗
        </button>
        <button
          onClick={handleRelease}
          disabled={loading}
          style={{
            width: "100%",
            padding: "8px 0",
            background: "transparent",
            color: "#9CA3AF",
            border: "1px solid #E8E6F0",
            borderRadius: 10,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          release rescue
        </button>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {error && (
        <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>
          {error}
        </p>
      )}
      <button
        onClick={handleAccept}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px 0",
          background: "#4A3F7A",
          color: "white",
          border: "none",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {loading ? "accepting..." : "accept rescue"}
      </button>
    </div>
  );
}
