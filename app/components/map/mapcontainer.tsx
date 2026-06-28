"use client";

import dynamic from "next/dynamic";
import type { Report } from "../../../types";

const WhiskrMap = dynamic(() => import("./whiskrmap"), { ssr: false });

type Props = {
  onSelectReport: (report: Report) => void;
  selectedReport: Report | null;
};

export default function MapContainer({
  onSelectReport,
  selectedReport,
}: Props) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <WhiskrMap
        onSelectReport={onSelectReport}
        selectedReport={selectedReport}
      />
    </div>
  );
}
