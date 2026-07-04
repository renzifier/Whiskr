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
  onLocate: (fn: () => void) => void;
  showMineOnly: boolean;
  userId: string;
  searchQuery: string;
};

export default function MapContainer({
  onSelectReport,
  selectedReport,
  onMapClick,
  filterTypes,
  filterStatuses,
  onLocate,
  showMineOnly,
  userId,
  searchQuery,
}: Props) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <WhiskrMap
        onSelectReport={onSelectReport}
        selectedReport={selectedReport}
        onMapClick={onMapClick}
        filterTypes={filterTypes}
        filterStatuses={filterStatuses}
        onLocate={onLocate}
        showMineOnly={showMineOnly}
        userId={userId}
        searchQuery={searchQuery}
      />
    </div>
  );
}
