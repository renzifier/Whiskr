"use client";

import { Marker } from "react-leaflet";
import L from "leaflet";
import type { Report, CatType, ReportStatus } from "../../../types";

const pinColors: Record<CatType, string> = {
  stray: "#8B80C9",
  missing: "#EF4444",
  injured: "#8B5CF6",
  colony: "#10B981",
};

const statusColors: Partial<Record<ReportStatus, string>> = {
  rescue_accepted: "#3B82F6",
  stale: "#9CA3AF",
};

const typeLabels: Record<CatType, string> = {
  stray: "Stray",
  missing: "Missing",
  injured: "Injured",
  colony: "Colony",
};

const statusLabels: Partial<Record<ReportStatus, string>> = {
  rescue_accepted: "Volunteer assigned",
};

function createIcon(color: string, label: string, selected = false) {
  const size = selected ? 36 : 28;
  const pinHeight = size * 1.4;
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <svg width="${size}" height="${pinHeight}" viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C9 0 0 9 0 20c0 14 20 36 20 36S40 34 40 20C40 9 31 0 20 0z" fill="${color}" opacity="${selected ? 1 : 0.9}"/>
        <circle cx="20" cy="19" r="11" fill="white"/>
        <polygon points="12,11 15,17 9,17" fill="${color}"/>
        <polygon points="28,11 25,17 31,17" fill="${color}"/>
        <circle cx="16" cy="19" r="2" fill="${color}"/>
        <circle cx="24" cy="19" r="2" fill="${color}"/>
        <ellipse cx="20" cy="23" rx="1.5" ry="1" fill="${color}"/>
        <line x1="9" y1="21" x2="15" y2="22" stroke="${color}" stroke-width="0.8"/>
        <line x1="9" y1="23" x2="15" y2="23" stroke="${color}" stroke-width="0.8"/>
        <line x1="25" y1="22" x2="31" y2="21" stroke="${color}" stroke-width="0.8"/>
        <line x1="25" y1="23" x2="31" y2="23" stroke="${color}" stroke-width="0.8"/>
      </svg>
      <span style="
        margin-top:2px;
        background:#1a1826;
        color:#f0eefa;
        font-size:11px;
        font-weight:500;
        padding:2px 8px;
        border-radius:8px;
        white-space:nowrap;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
      ">${label}</span>
    </div>`,
    className: "",
    iconSize: [size + 60, pinHeight + 22],
    iconAnchor: [(size + 60) / 2, pinHeight],
    popupAnchor: [0, -pinHeight],
  });
}

type Props = {
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report) => void;
  filterTypes: string[];
  filterStatuses: string[];
  showMineOnly: boolean;
  userId: string;
  searchQuery: string;
};

export default function PinLayer({
  reports,
  selectedReport,
  onSelectReport,
  filterTypes,
  filterStatuses,
  showMineOnly,
  userId,
  searchQuery,
}: Props) {
  const filtered = reports.filter((r) => {
    const typeMatch =
      filterTypes.length === 0 || filterTypes.includes(r.cat_type);
    const statusMatch =
      filterStatuses.length === 0 || filterStatuses.includes(r.status);
    const mineMatch = !showMineOnly || r.reporter_id === userId;
    const searchMatch =
      !searchQuery.trim() ||
      (r.description
        ?.toLowerCase()
        .includes(searchQuery.trim().toLowerCase()) ??
        false);
    return typeMatch && statusMatch && mineMatch && searchMatch;
  });

  return (
    <>
      {filtered.map((report) => {
        const color =
          statusColors[report.status] ??
          pinColors[report.cat_type] ??
          "#8B80C9";
        const isSelected = selectedReport?.id === report.id;
        const label =
          statusLabels[report.status] ??
          typeLabels[report.cat_type] ??
          report.cat_type;
        const icon = createIcon(color, label, isSelected);

        return (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={icon}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation();
                onSelectReport(report);
              },
            }}
          />
        );
      })}
    </>
  );
}
