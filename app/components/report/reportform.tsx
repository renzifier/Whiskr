"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { CatType } from "../../../types";
import CropModal from "../auth/cropmodal";

type Props = {
  lat: number;
  lng: number;
  onClose: () => void;
  onSuccess: () => void;
};

const catTypes: { value: CatType; label: string; color: string }[] = [
  { value: "stray", label: "stray", color: "#8B80C9" },
  { value: "missing", label: "missing", color: "#EF4444" },
  { value: "injured", label: "injured", color: "#8B5CF6" },
  { value: "colony", label: "colony", color: "#10B981" },
];

export default function ReportForm({ lat, lng, onClose, onSuccess }: Props) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [catType, setCatType] = useState<CatType>("stray");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    // Reset the input so picking the same file again still fires onChange
    e.target.value = "";
  }

  async function handleSubmit() {
    if (!photo) {
      setError("please add a photo");
      return;
    }
    setLoading(true);
    setError("");

    const filename = `${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("report-photos")
      .upload(filename, photo);

    if (uploadError) {
      setError("photo upload failed, please try again");
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("report-photos")
      .getPublicUrl(filename);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: newReport, error: insertError } = await supabase
      .from("reports")
      .insert({
        lat,
        lng,
        cat_type: catType,
        description: description || null,
        photo_url: urlData.publicUrl,
        reporter_id: user?.id ?? null,
      })
      .select()
      .single();

    if (insertError || !newReport) {
      setError("failed to submit report");
      setLoading(false);
      return;
    }

    // Contact info lives in its own protected table now — it's never
    // broadcast over realtime and only readable by the reporter or the
    // rescuer who accepts this specific report.
    if (contact) {
      const { error: contactError } = await supabase
        .from("report_contacts")
        .insert({ report_id: newReport.id, contact });

      if (contactError) {
        // The report itself was created successfully — don't block on this,
        // but surface it so it's not silently lost.
        console.error("failed to save contact info:", contactError);
      }
    }

    setLoading(false);
    onSuccess();
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
            width: "100%",
            maxWidth: 400,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(74,63,122,0.15)",
          }}
        >
          <div
            style={{
              padding: "20px 20px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 16, color: "#4A3F7A" }}>
              report a cat
            </p>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#9CA3AF",
                fontSize: 18,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: "0 20px 20px" }}>
            <div
              onClick={() => document.getElementById("photo-input")?.click()}
              style={{
                width: "100%",
                height: 160,
                borderRadius: 16,
                border: "2px dashed #8B80C9",
                background: photoPreview
                  ? "transparent"
                  : "rgba(139,128,201,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginBottom: 16,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 28, marginBottom: 4 }}>📷</p>
                  <p style={{ fontSize: 12, color: "#8B80C9" }}>
                    tap to add photo
                  </p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>required</p>
                </div>
              )}
            </div>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhoto}
              style={{ display: "none" }}
            />

            <p
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              type of cat
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {catTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setCatType(t.value)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 10,
                    border: `1.5px solid ${t.color}`,
                    background: catType === t.value ? t.color : "transparent",
                    color: catType === t.value ? "white" : t.color,
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <p
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              location
            </p>
            <div
              style={{
                background: "white",
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 16,
                fontSize: 12,
                color: "#4A3F7A",
              }}
            >
              📍 {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>

            <p
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              description <span style={{ fontWeight: 400 }}>(optional)</span>
            </p>
            <textarea
              placeholder="e.g. orange tabby, friendly, near the sari-sari store"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E8E6F0",
                borderRadius: 10,
                fontSize: 13,
                color: "#4A3F7A",
                background: "white",
                outline: "none",
                resize: "none",
                marginBottom: 4,
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                textAlign: "right",
                marginBottom: 16,
              }}
            >
              {description.length}/300
            </p>

            <p
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              your contact{" "}
              <span style={{ fontWeight: 400 }}>
                {catType === "missing" ? "(required)" : "(optional)"}
              </span>
            </p>
            <input
              type="text"
              placeholder="email or phone number"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E8E6F0",
                borderRadius: 10,
                fontSize: 13,
                color: "#4A3F7A",
                background: "white",
                outline: "none",
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />

            {error && (
              <p
                style={{
                  fontSize: 12,
                  color: "#EF4444",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 0",
                background: "#4A3F7A",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "submitting..." : "submit report"}
            </button>
          </div>
        </div>
      </div>

      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          aspect={16 / 9}
          cropShape="rect"
          onCancel={() => setCropSrc(null)}
          onCropped={(file) => {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
            setCropSrc(null);
          }}
        />
      )}
    </>
  );
}
