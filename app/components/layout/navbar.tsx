"use client";

type Props = {
  email: string;
  onLogout: () => void;
};

export default function Navbar({ email, onLogout }: Props) {
  const initials = email.charAt(0).toUpperCase();

  return (
    <nav
      style={{
        background: "white",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "0.5px solid #E8E6F0",
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>🐾</span>
        <span style={{ fontWeight: 700, color: "#4A3F7A", fontSize: 16 }}>
          Whiskr
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{email}</span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#8B80C9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {initials}
        </div>
        <button
          onClick={onLogout}
          style={{
            fontSize: 12,
            color: "#4A3F7A",
            border: "1px solid #8B80C9",
            padding: "4px 12px",
            borderRadius: 20,
            cursor: "pointer",
            background: "transparent",
          }}
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
