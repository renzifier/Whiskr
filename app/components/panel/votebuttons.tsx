"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

type Props = {
  reportId: string;
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

export default function VoteButtons({ reportId, variant = "icon" }: Props) {
  const [stillHere, setStillHere] = useState(0);
  const [notHere, setNotHere] = useState(0);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadVotes() {
      const { data } = await supabase
        .from("votes")
        .select("vote")
        .eq("report_id", reportId);

      if (data) {
        setStillHere(data.filter((v) => v.vote === "still_here").length);
        setNotHere(data.filter((v) => v.vote === "not_here").length);
      }
    }
    loadVotes();
  }, [reportId]);

  async function handleVote(vote: "still_here" | "not_here") {
    if (voted || loading) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      // redirect to auth modal / show login prompt instead of inserting
      return;
    }
    await supabase
      .from("votes")
      .insert({ report_id: reportId, vote, voter_id: user.id });

    if (vote === "still_here") setStillHere((p) => p + 1);
    else setNotHere((p) => p + 1);

    setVoted(true);
    setLoading(false);
  }

  const Button = variant === "pill" ? PillButton : ActionIcon;

  return (
    <>
      <Button
        icon="✓"
        label={`${stillHere} here`}
        color="#10B981"
        active={voted}
        disabled={voted || loading}
        onClick={() => handleVote("still_here")}
      />
      <Button
        icon="✗"
        label={`${notHere} gone`}
        color="#EF4444"
        active={voted}
        disabled={voted || loading}
        onClick={() => handleVote("not_here")}
      />
    </>
  );
}
