"use client";

import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";

type Props = {
  active: string | null;
  onSelect: (item: string | null) => void;
  session: Session;
  onAuthRequired: () => void;
  onReport: () => void;
  filterTypes: string[];
  filterStatuses: string[];
  onFilterTypes: (types: string[]) => void;
  onFilterStatuses: (statuses: string[]) => void;
  onLocate: () => void;
};

export const typeOptions = [
  { value: "stray", label: "Stray", color: "#8B80C9" },
  { value: "missing", label: "Missing", color: "#EF4444" },
  { value: "injured", label: "Injured", color: "#8B5CF6" },
  { value: "colony", label: "Colony", color: "#10B981" },
];

export const statusOptions = [
  { value: "active", label: "Active", color: "#10B981" },
  { value: "stale", label: "Stale", color: "#9CA3AF" },
  { value: "rescue_accepted", label: "Volunteer Assigned", color: "#3B82F6" },
];

export function FilterPanel({
  filterTypes,
  filterStatuses,
  onFilterTypes,
  onFilterStatuses,
  onClose,
  style,
}: {
  filterTypes: string[];
  filterStatuses: string[];
  onFilterTypes: (t: string[]) => void;
  onFilterStatuses: (s: string[]) => void;
  onClose: () => void;
  style?: React.CSSProperties;
}) {
  function toggleType(value: string) {
    if (filterTypes.includes(value))
      onFilterTypes(filterTypes.filter((t) => t !== value));
    else onFilterTypes([...filterTypes, value]);
  }

  function toggleStatus(value: string) {
    if (filterStatuses.includes(value))
      onFilterStatuses(filterStatuses.filter((s) => s !== value));
    else onFilterStatuses([...filterStatuses, value]);
  }

  function clearAll() {
    onFilterTypes([]);
    onFilterStatuses([]);
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 60,
        left: 64,
        background: "#1A1628",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        padding: 16,
        width: 220,
        zIndex: 99999,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 600, color: "white" }}>
          Filter Pins
        </p>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        By Type
      </p>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}
      >
        {typeOptions.map((t) => (
          <button
            key={t.value}
            onClick={() => toggleType(t.value)}
            style={{
              padding: "5px 10px",
              borderRadius: 20,
              border: `1.5px solid ${t.color}`,
              background: filterTypes.includes(t.value)
                ? t.color
                : "transparent",
              color: filterTypes.includes(t.value) ? "white" : t.color,
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
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        By Status
      </p>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}
      >
        {statusOptions.map((s) => (
          <button
            key={s.value}
            onClick={() => toggleStatus(s.value)}
            style={{
              padding: "5px 10px",
              borderRadius: 20,
              border: `1.5px solid ${s.color}`,
              background: filterStatuses.includes(s.value)
                ? s.color
                : "transparent",
              color: filterStatuses.includes(s.value) ? "white" : s.color,
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        onClick={clearAll}
        style={{
          width: "100%",
          padding: "8px 0",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent",
          color: "rgba(255,255,255,0.5)",
          fontSize: 11,
          cursor: "pointer",
        }}
      >
        Clear Filters
      </button>
    </div>
  );
}

export default function IconRail({
  active,
  onSelect,
  onReport,
  filterTypes,
  filterStatuses,
  onFilterTypes,
  onFilterStatuses,
  onLocate,
}: Props) {
  const [fabOpen, setFabOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        left: 16,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <button
        onClick={() => setFabOpen(!fabOpen)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          border: "none",
          background: "#8B80C9",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          color: "white",
          transition: "transform 0.2s",
          transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        <img src="/icons/add.png" alt="" style={{ width: 20, height: 20 }} />
      </button>

      {fabOpen && (
        <>
          <button
            title="Report a Cat"
            onClick={() => {
              onReport();
              setFabOpen(false);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: "none",
              background: "#8B80C9",
              boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "white",
            }}
          >
            <img
              src="/icons/add.png"
              alt=""
              style={{ width: 20, height: 20 }}
            />
          </button>
          <button
            title="Locate Me"
            onClick={() => {
              onLocate();
              setFabOpen(false);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: "0.5px solid rgba(255,255,255,0.08)",
              background: "#1A1628",
              boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            <img
              src="/icons/pin-button.png"
              alt=""
              style={{ width: 20, height: 20 }}
            />
          </button>
          <button
            title="Filter"
            onClick={() => {
              setShowFilter(!showFilter);
              setFabOpen(false);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: "0.5px solid rgba(255,255,255,0.08)",
              background: showFilter ? "#8B80C9" : "#1A1628",
              boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            <img
              src="/icons/filter.png"
              alt=""
              style={{ width: 20, height: 20 }}
            />
          </button>
          <button
            title="My Reports"
            onClick={() => {
              onSelect(active === "profile" ? null : "profile");
              setFabOpen(false);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: "0.5px solid rgba(255,255,255,0.08)",
              background: active === "profile" ? "#8B80C9" : "#1A1628",
              boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            <img
              src="/icons/my-reports.png"
              alt=""
              style={{ width: 20, height: 20 }}
            />
          </button>
        </>
      )}

      {showFilter && (
        <FilterPanel
          filterTypes={filterTypes}
          filterStatuses={filterStatuses}
          onFilterTypes={onFilterTypes}
          onFilterStatuses={onFilterStatuses}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
