"use client";

type Props = {
  onLogin: () => void;
  onSignUp: () => void;
};

export default function Landing({ onLogin, onSignUp }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#E8E6F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#F5EEF0",
          borderRadius: 24,
          padding: 40,
          width: "100%",
          maxWidth: 360,
          textAlign: "center",
          boxShadow: "0 8px 32px rgba(74,63,122,0.1)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#4A3F7A",
            marginBottom: 8,
          }}
        >
          welcome to whiskr
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#9CA3AF",
            marginBottom: 32,
          }}
        >
          find stray cats nearby or report a cat
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={onLogin}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 50,
              border: "1.5px solid #4A3F7A",
              background: "#4A3F7A",
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            log in
          </button>
          <button
            onClick={onSignUp}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 50,
              border: "1.5px solid #4A3F7A",
              background: "transparent",
              color: "#4A3F7A",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            sign up
          </button>
          <button
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 50,
              border: "1.5px solid rgba(74,63,122,0.2)",
              background: "transparent",
              color: "rgba(74,63,122,0.4)",
              fontSize: 14,
              cursor: "default",
            }}
          >
            how it works
          </button>
        </div>
      </div>
    </div>
  );
}
