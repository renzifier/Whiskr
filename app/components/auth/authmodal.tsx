"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";

type Props = {
  onClose: () => void;
  defaultMode?: "login" | "signup";
};

export default function AuthModal({ onClose, defaultMode = "login" }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(defaultMode === "signup");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError("");

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else onClose();
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else onClose();
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(74,63,122,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: "#F5EEF0",
          borderRadius: 24,
          padding: 28,
          width: 320,
          boxShadow: "0 8px 32px rgba(74,63,122,0.15)",
        }}
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#4A3F7A",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {isSignup ? "create an account" : "log in"}
        </p>

        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 10,
            border: "1px solid #E8E6F0",
            borderRadius: 10,
            fontSize: 14,
            color: "#4A3F7A",
            background: "white",
            outline: "none",
            boxSizing: "border-box",
            WebkitTextFillColor: "#4A3F7A",
          }}
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 10,
            border: "1px solid #E8E6F0",
            borderRadius: 10,
            fontSize: 14,
            color: "#4A3F7A",
            background: "white",
            outline: "none",
            boxSizing: "border-box",
            WebkitTextFillColor: "#4A3F7A",
          }}
        />

        {error && (
          <p style={{ color: "#E24B4A", fontSize: 12, marginBottom: 8 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 0",
            background: "#4A3F7A",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          {loading ? "please wait..." : isSignup ? "sign up" : "log in"}
        </button>

        <p
          style={{
            fontSize: 12,
            marginTop: 12,
            textAlign: "center",
            color: "#9CA3AF",
          }}
        >
          {isSignup ? "already have an account?" : "don't have an account?"}{" "}
          <span
            style={{ color: "#4A3F7A", cursor: "pointer", fontWeight: 600 }}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "log in" : "sign up"}
          </span>
        </p>

        <p
          style={{
            fontSize: 12,
            marginTop: 12,
            textAlign: "center",
            color: "#9CA3AF",
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          cancel
        </p>
      </div>
    </div>
  );
}
