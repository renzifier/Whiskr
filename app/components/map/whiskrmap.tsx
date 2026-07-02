"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../../../lib/supabase/client";
import type { Report } from "../../../types";
import PinLayer from "./pinlayer";

const DEFAULT_POS: [number, number] = [11.5754, 122.7435];

function createPreviewIcon() {
  return L.divIcon({
    html: `<div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #4A3F7A;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(74,63,122,0.4);
      animation: pulse 1.5s infinite;
    "></div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

function SaveMapPosition() {
  useMapEvents({
    moveend(e) {
      const center = e.target.getCenter();
      localStorage.setItem(
        "whiskr-map-pos",
        JSON.stringify({
          lat: center.lat,
          lng: center.lng,
        }),
      );
    },
  });
  return null;
}

function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (
        (e.originalEvent.target as HTMLElement).closest(".leaflet-marker-icon")
      )
        return;
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Props = {
  onSelectReport: (report: Report) => void;
  selectedReport: Report | null;
  onMapClick: (lat: number, lng: number) => void;
};

export default function WhiskrMap({
  onSelectReport,
  selectedReport,
  onMapClick,
}: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [gpsPos, setGpsPos] = useState<[number, number] | null>(null);
  const [clickPos, setClickPos] = useState<[number, number] | null>(null);
  const selectedReportRef = useRef<Report | null>(null);
  const hasCentered = useRef(false);

  const [initialCenter] = useState<[number, number]>(() => {
    if (typeof window === "undefined") return DEFAULT_POS;
    const saved = localStorage.getItem("whiskr-map-pos");
    if (saved) {
      const { lat, lng } = JSON.parse(saved);
      return [lat, lng];
    }
    return DEFAULT_POS;
  });

  useEffect(() => {
    function handleRescueCompleted(e: Event) {
      const { reportId } = (e as CustomEvent).detail;
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
    window.addEventListener("rescue-completed", handleRescueCompleted);
    return () =>
      window.removeEventListener("rescue-completed", handleRescueCompleted);
  }, []);

  useEffect(() => {
    selectedReportRef.current = selectedReport;
  }, [selectedReport]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .in("status", ["active", "stale", "rescue_accepted"]);
      if (data) setReports(data);
    }
    load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("reports-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          setReports((prev) => [...prev, payload.new as Report]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        (payload) => {
          const updated = payload.new as Report;
          if (["rescued", "not_found", "resolved"].includes(updated.status)) {
            setReports((prev) => prev.filter((r) => r.id !== updated.id));
          } else {
            setReports((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
            );
            if (selectedReportRef.current?.id === updated.id) {
              onSelectReport({
                ...selectedReportRef.current,
                ...updated,
              } as Report);
            }
          }
        },
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        if (!hasCentered.current) {
          const saved = localStorage.getItem("whiskr-map-pos");
          if (!saved) {
            setGpsPos([p.coords.latitude, p.coords.longitude]);
          }
          hasCentered.current = true;
        }
      });
    }
  }, []);

  return (
    <MapContainer
      center={initialCenter}
      zoom={14}
      doubleClickZoom={false}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>'
      />
      <SaveMapPosition />
      {gpsPos && <RecenterMap lat={gpsPos[0]} lng={gpsPos[1]} />}
      <ClickHandler
        onClick={(lat, lng) => {
          setClickPos([lat, lng]);
          onMapClick(lat, lng);
        }}
      />
      <PinLayer
        reports={reports}
        selectedReport={selectedReport}
        onSelectReport={onSelectReport}
      />
      {clickPos && <Marker position={clickPos} icon={createPreviewIcon()} />}
    </MapContainer>
  );
}
