"use client";

import type { Session } from "@supabase/supabase-js";

type Props = {
  active: string | null;
  onSelect: (item: string | null) => void;
  session: Session;
  onAuthRequired: () => void;
};

const buttons = [
  { id: "report", icon: "➕", label: "Report a cat" },
  { id: "locate", icon: "📍", label: "Locate me" },
  { id: "divider1", icon: "", label: "" },
  { id: "filter", icon: "🔧", label: "Filter" },
  { id: "divider2", icon: "", label: "" },
  { id: "profile", icon: "👤", label: "My reports" },
];

export default function IconRail({ active, onSelect }: Props) {
  return (
    <div
      style={{
        width: 56,
        background: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(8px)",
        borderRight: "0.5px solid rgba(255,255,255,0.6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 0",
        gap: 8,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {buttons.map((btn) => {
        if (btn.id.startsWith("divider")) {
          return (
            <div
              key={btn.id}
              style={{
                width: 24,
                height: 0.5,
                background: "rgba(74,63,122,0.2)",
                margin: "4px 0",
              }}
            />
          );
        }

        return (
          <button
            key={btn.id}
            title={btn.label}
            onClick={() => onSelect(active === btn.id ? null : btn.id)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "none",
              background: active === btn.id ? "#8B80C9" : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              transition: "background 0.15s",
            }}
          >
            {btn.icon}
          </button>
        );
      })}
    </div>
  );
}
