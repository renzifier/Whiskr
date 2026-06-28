"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../../lib/supabase/client";
import type { Report } from "../../../types";
import PinLayer from "./pinlayer";

const DEFAULT_POS: [number, number] = [11.5754, 122.7435];

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Props = {
  onSelectReport: (report: Report) => void;
  selectedReport: Report | null;
};

export default function WhiskrMap({ onSelectReport, selectedReport }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [gpsPos, setGpsPos] = useState<[number, number] | null>(null);

  // Load existing reports
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

  // Realtime subscription
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
          setReports((prev) =>
            prev.map((r) =>
              r.id === payload.new.id ? { ...r, ...payload.new } : r,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        setGpsPos([p.coords.latitude, p.coords.longitude]);
      });
    }
  }, []);

  return (
    <MapContainer
      center={DEFAULT_POS}
      zoom={14}
      doubleClickZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>'
      />
      {gpsPos && <RecenterMap lat={gpsPos[0]} lng={gpsPos[1]} />}
      <ClickHandler onClick={(lat, lng) => console.log(lat, lng)} />
      <PinLayer
        reports={reports}
        selectedReport={selectedReport}
        onSelectReport={onSelectReport}
      />
    </MapContainer>
  );
}
