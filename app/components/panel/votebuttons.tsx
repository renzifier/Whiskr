"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";

type Props = {
  reportId: string;
};

export default function VoteButtons({ reportId }: Props) {
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

    await supabase.from("votes").insert({ report_id: reportId, vote });

    if (vote === "still_here") setStillHere((p) => p + 1);
    else setNotHere((p) => p + 1);

    setVoted(true);
    setLoading(false);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <p
        style={{
          fontSize: 11,
          color: "#9CA3AF",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        community confirmation
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => handleVote("still_here")}
          disabled={voted || loading}
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: 10,
            border: "1.5px solid #10B981",
            background: voted ? "#10B98120" : "transparent",
            color: "#10B981",
            fontSize: 12,
            fontWeight: 500,
            cursor: voted ? "default" : "pointer",
          }}
        >
          ✓ still here ({stillHere})
        </button>
        <button
          onClick={() => handleVote("not_here")}
          disabled={voted || loading}
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: 10,
            border: "1.5px solid #EF4444",
            background: voted ? "#EF444420" : "transparent",
            color: "#EF4444",
            fontSize: 12,
            fontWeight: 500,
            cursor: voted ? "default" : "pointer",
          }}
        >
          ✗ not here ({notHere})
        </button>
      </div>
    </div>
  );
}
