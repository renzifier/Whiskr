"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  email: string;
  onLogout: () => void;
};

export default function Navbar({ email, onLogout }: Props) {
  const initials = email.charAt(0).toUpperCase();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <nav
      style={{
        background: "white",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "0.5px solid #E8E6F0",
        zIndex: 9998,
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>🐾</span>
        <span style={{ fontWeight: 700, color: "#4A3F7A", fontSize: 16 }}>
          whiskr
        </span>
      </div>

      {/* Avatar + dropdown */}
      <div ref={ref} style={{ position: "relative" }}>
        <div
          onClick={() => setOpen(!open)}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#8B80C9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {initials}
        </div>

        {open && (
          <div
            style={{
              position: "absolute",
              top: 44,
              right: 0,
              background: "white",
              borderRadius: 14,
              boxShadow: "0 4px 24px rgba(74,63,122,0.15)",
              border: "0.5px solid #E8E6F0",
              minWidth: 200,
              overflow: "hidden",
              zIndex: 9999,
            }}
          >
            {/* Email */}
            <div
              style={{
                padding: "14px 16px 10px",
                borderBottom: "0.5px solid #E8E6F0",
              }}
            >
              <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>
                signed in as
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#4A3F7A",
                  fontWeight: 500,
                  wordBreak: "break-all",
                }}
              >
                {email}
              </p>
            </div>

            {/* Edit profile */}
            <button
              onClick={() => setOpen(false)}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                color: "#4A3F7A",
                textAlign: "left",
                borderBottom: "0.5px solid #E8E6F0",
              }}
            >
              <span>✏️</span> edit profile
            </button>

            {/* Log out */}
            <button
              onClick={() => {
                onLogout();
                setOpen(false);
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                color: "#EF4444",
                textAlign: "left",
              }}
            >
              <span>🚪</span> log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
