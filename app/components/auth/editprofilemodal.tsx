"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "../../../types";
import CropModal from "./cropmodal";

type Props = {
  session: Session;
  profile: Profile | null;
  onClose: () => void;
  onSaved: (profile: Profile) => void;
};

export default function EditProfileModal({
  session,
  profile,
  onClose,
  onSaved,
}: Props) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile?.avatar_url ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    // Reset the input so picking the same file again still fires onChange
    e.target.value = "";
  }

  async function handleSave() {
    setLoading(true);
    setError("");

    let avatarUrl = profile?.avatar_url ?? null;

    if (avatarFile) {
      const filename = `${session.user.id}-${Date.now()}.jpg`;
      if (filename.includes("..")) {
        throw new Error("Invalid filename");
      }
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filename, avatarFile, { upsert: true });

      if (uploadError) {
        console.error("avatar upload error:", uploadError);
        setError(`Photo upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filename);
      avatarUrl = urlData.publicUrl;
    }

    const { data, error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: session.user.id,
        email: session.user.email,
        display_name: displayName || null,
        avatar_url: avatarUrl,
      })
      .select()
      .single();

    if (upsertError || !data) {
      console.error("profile upsert error:", upsertError);
      setError(
        `Failed to save profile: ${upsertError?.message ?? "Unknown error"}`,
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    onSaved(data as Profile);
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(74,63,122,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: 16,
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
            Edit Profile
          </p>

          {/* Avatar picker */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <div
              onClick={() => document.getElementById("avatar-input")?.click()}
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                backgroundColor: "#8B80C9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 13,
                cursor: "pointer",
                position: "relative",
                border: "2px dashed #8B80C9",
                overflow: "hidden",
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                "Tap to Add Photo"
              )}
            </div>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
          </div>

          <p
            style={{
              fontSize: 12,
              color: "#9CA3AF",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Display Name
          </p>
          <input
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 16,
              border: "1px solid #E8E6F0",
              borderRadius: 10,
              fontSize: 14,
              color: "#4A3F7A",
              background: "white",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {error && (
            <p style={{ color: "#E24B4A", fontSize: 12, marginBottom: 8 }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
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
            {loading ? "Saving..." : "Save Changes"}
          </button>

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
            Cancel
          </p>
        </div>
      </div>

      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onCancel={() => setCropSrc(null)}
          onCropped={(file) => {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setCropSrc(null);
          }}
        />
      )}
    </>
  );
}
