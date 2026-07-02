"use client";

import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";

type Props = {
  active: string | null;
  onSelect: (item: string | null) => void;
  session: Session;
  onAuthRequired: () => void;
  onReport: () => void;
};

const railButtons = [
  { id: "locate", icon: "📍", label: "locate me" },
  { id: "filter", icon: "🔧", label: "filter" },
  { id: "profile", icon: "👤", label: "my reports" },
];

export default function IconRail({ active, onSelect, onReport }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return (
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Main FAB — always on top */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            border: "none",
            background: "#4A3F7A",
            boxShadow: "0 4px 16px rgba(74,63,122,0.35)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: "white",
            transition: "transform 0.2s",
            transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          ➕
        </button>

        {/* Expanded icons below FAB */}
        {fabOpen && (
          <>
            <button
              title="report a cat"
              onClick={() => {
                onReport();
                setFabOpen(false);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: "none",
                background: "#4A3F7A",
                boxShadow: "0 2px 12px rgba(74,63,122,0.3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                color: "white",
              }}
            >
              ➕
            </button>
            {railButtons.map((btn) => (
              <button
                key={btn.id}
                title={btn.label}
                onClick={() => {
                  onSelect(active === btn.id ? null : btn.id);
                  setFabOpen(false);
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  border: "none",
                  background:
                    active === btn.id ? "#8B80C9" : "rgba(255,255,255,0.95)",
                  boxShadow: "0 2px 12px rgba(74,63,122,0.2)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                {btn.icon}
              </button>
            ))}
          </>
        )}
      </div>
    );
  }

  // Desktop rail
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
      <button
        title="report a cat"
        onClick={onReport}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        ➕
      </button>

      {railButtons.map((btn, i) => (
        <div key={btn.id}>
          {i === 0 && (
            <div
              style={{
                width: 24,
                height: 0.5,
                background: "rgba(74,63,122,0.2)",
                margin: "4px 0 12px",
              }}
            />
          )}
          <button
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
        </div>
      ))}
    </div>
  );
}
