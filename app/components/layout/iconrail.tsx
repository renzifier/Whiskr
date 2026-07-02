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

const typeOptions = [
  { value: "stray", label: "stray", color: "#8B80C9" },
  { value: "missing", label: "missing", color: "#EF4444" },
  { value: "injured", label: "injured", color: "#8B5CF6" },
  { value: "colony", label: "colony", color: "#10B981" },
];

const statusOptions = [
  { value: "active", label: "active", color: "#10B981" },
  { value: "stale", label: "stale", color: "#9CA3AF" },
  { value: "rescue_accepted", label: "rescue accepted", color: "#3B82F6" },
];

function FilterPanel({
  filterTypes,
  filterStatuses,
  onFilterTypes,
  onFilterStatuses,
  onClose,
}: {
  filterTypes: string[];
  filterStatuses: string[];
  onFilterTypes: (t: string[]) => void;
  onFilterStatuses: (s: string[]) => void;
  onClose: () => void;
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
        background: "white",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(74,63,122,0.15)",
        border: "0.5px solid #E8E6F0",
        padding: 16,
        width: 220,
        zIndex: 99999,
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
        <p style={{ fontSize: 12, fontWeight: 600, color: "#4A3F7A" }}>
          filter pins
        </p>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9CA3AF",
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      <p
        style={{
          fontSize: 11,
          color: "#9CA3AF",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        by type
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
          color: "#9CA3AF",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        by status
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
          border: "1px solid #E8E6F0",
          background: "transparent",
          color: "#9CA3AF",
          fontSize: 11,
          cursor: "pointer",
        }}
      >
        clear filters
      </button>
    </div>
  );
}

const railButtons = [
  { id: "locate", icon: "📍", label: "locate me" },
  { id: "filter", icon: "🔧", label: "filter" },
  { id: "profile", icon: "👤", label: "my reports" },
];

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
  const [isMobile, setIsMobile] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const hasActiveFilters = filterTypes.length > 0 || filterStatuses.length > 0;

  if (isMobile) {
    return (
      <div
        style={{
          position: "absolute",
          top: 16,
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
            background: "#4A3F7A",
            boxShadow: "0 4px 16px rgba(74,63,122,0.35)",
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
          ➕
        </button>

        {fabOpen && (
          <>
            <button
              title="report a cat"
              onClick={() => {
                onReport();
                setFabOpen(false);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: "none",
                background: "#4A3F7A",
                boxShadow: "0 2px 12px rgba(74,63,122,0.3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                color: "white",
              }}
            >
              ➕
            </button>
            <button
              title="locate me"
              onClick={() => {
                onLocate();
                setFabOpen(false);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: "none",
                background: "rgba(255,255,255,0.95)",
                boxShadow: "0 2px 12px rgba(74,63,122,0.2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              📍
            </button>
            <button
              title="filter"
              onClick={() => {
                setShowFilter(!showFilter);
                setFabOpen(false);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: "none",
                background: showFilter ? "#8B80C9" : "rgba(255,255,255,0.95)",
                boxShadow: "0 2px 12px rgba(74,63,122,0.2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              🔧
            </button>
            <button
              title="my reports"
              onClick={() => {
                onSelect(active === "profile" ? null : "profile");
                setFabOpen(false);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: "none",
                background:
                  active === "profile" ? "#8B80C9" : "rgba(255,255,255,0.95)",
                boxShadow: "0 2px 12px rgba(74,63,122,0.2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              👤
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

  return (
    <div
      style={{
        width: 56,
        background: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(8px)",
        borderRight: "0.5px solid rgba(255,255,255,0.6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 0",
        gap: 8,
        zIndex: 9998,
        flexShrink: 0,
        position: "relative",
        overflow: "visible",
      }}
    >
      <button
        title="report a cat"
        onClick={onReport}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        ➕
      </button>

      <div
        style={{
          width: 24,
          height: 0.5,
          background: "rgba(74,63,122,0.2)",
          margin: "4px 0",
        }}
      />

      {railButtons.map((btn) => (
        <button
          key={btn.id}
          title={btn.label}
          onClick={() => {
            if (btn.id === "locate") {
              onLocate();
              return;
            }
            if (btn.id === "filter") {
              setShowFilter(!showFilter);
              return;
            }
            onSelect(active === btn.id ? null : btn.id);
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "none",
            background:
              (btn.id === "filter" && showFilter) || active === btn.id
                ? "#8B80C9"
                : "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            transition: "background 0.15s",
          }}
        >
          {btn.icon}
        </button>
      ))}

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
