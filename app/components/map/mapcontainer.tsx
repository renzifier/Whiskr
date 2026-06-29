"use client";

import dynamic from "next/dynamic";
import type { Report } from "../../../types";

const WhiskrMap = dynamic(() => import("./whiskrmap"), { ssr: false });

type Props = {
  onSelectReport: (report: Report) => void;
  selectedReport: Report | null;
  onMapClick: (lat: number, lng: number) => void;
};

export default function MapContainer({
  onSelectReport,
  selectedReport,
  onMapClick,
}: Props) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <WhiskrMap
        onSelectReport={onSelectReport}
        selectedReport={selectedReport}
        onMapClick={onMapClick}
      />
    </div>
  );
}
