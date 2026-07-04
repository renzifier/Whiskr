"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onCropped: (file: File) => void;
};

// Draws the cropped region onto a canvas and returns it as a File.
async function getCroppedImageFile(
  imageSrc: string,
  cropPixels: Area,
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("could not get canvas context");

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("failed to create image blob");

  return new File([blob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export default function CropModal({ imageSrc, onCancel, onCropped }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixelsResult: Area) => {
      setCroppedAreaPixels(croppedAreaPixelsResult);
    },
    [],
  );

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels);
      onCropped(file);
    } catch {
      // If cropping somehow fails, just back out — the person can retry
      // picking a photo rather than getting stuck on a broken crop screen.
      onCancel();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,13,26,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#F5EEF0",
          borderRadius: 24,
          padding: 24,
          width: 320,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "#4A3F7A",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          adjust your photo
        </p>

        {/* Crop area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 260,
            borderRadius: 16,
            overflow: "hidden",
            background: "#0F0D1A",
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ margin: "16px 0" }}>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6 }}>
            zoom
          </p>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#8B80C9" }}
          />
        </div>

        <button
          onClick={handleConfirm}
          disabled={saving || !croppedAreaPixels}
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
            marginBottom: 8,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "applying..." : "use this photo"}
        </button>

        <p
          style={{
            fontSize: 12,
            textAlign: "center",
            color: "#9CA3AF",
            cursor: "pointer",
          }}
          onClick={onCancel}
        >
          cancel
        </p>
      </div>
    </div>
  );
}
