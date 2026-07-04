"use client";

import dynamic from "next/dynamic";
import type { Report } from "../../../types";

const WhiskrMap = dynamic(() => import("./whiskrmap"), { ssr: false });

type Props = {
  onSelectReport: (report: Report) => void;
  selectedReport: Report | null;
  onMapClick: (lat: number, lng: number) => void;
  filterTypes: string[];
  filterStatuses: string[];
  searchQuery: string;
  onLocate: (fn: () => void) => void;
  onSearchNavigate: (fn: (lat: number, lng: number) => void) => void;
  showMineOnly: boolean;
  userId: string;
};

export default function MapContainer({
  onSelectReport,
  selectedReport,
  onMapClick,
  filterTypes,
  filterStatuses,
  searchQuery,
  onLocate,
  onSearchNavigate,
  showMineOnly,
  userId,
}: Props) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <WhiskrMap
        onSelectReport={onSelectReport}
        selectedReport={selectedReport}
        onMapClick={onMapClick}
        filterTypes={filterTypes}
        filterStatuses={filterStatuses}
        searchQuery={searchQuery}
        onLocate={onLocate}
        onSearchNavigate={onSearchNavigate}
        showMineOnly={showMineOnly}
        userId={userId}
      />
    </div>
  );
}
