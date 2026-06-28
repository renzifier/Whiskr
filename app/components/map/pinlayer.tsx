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

function createIcon(color: string, selected = false) {
  const size = selected ? 36 : 28;
  return L.divIcon({
    html: `<svg width="${size}" height="${size * 1.4}" viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg">
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
    </svg>`,
    className: "",
    iconSize: [size, size * 1.4],
    iconAnchor: [size / 2, size * 1.4],
    popupAnchor: [0, -size * 1.4],
  });
}

type Props = {
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report) => void;
};

export default function PinLayer({
  reports,
  selectedReport,
  onSelectReport,
}: Props) {
  return (
    <>
      {reports.map((report) => {
        const color =
          statusColors[report.status] ??
          pinColors[report.cat_type] ??
          "#8B80C9";
        const isSelected = selectedReport?.id === report.id;
        const icon = createIcon(color, isSelected);

        return (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={icon}
            eventHandlers={{ click: () => onSelectReport(report) }}
          />
        );
      })}
    </>
  );
}
