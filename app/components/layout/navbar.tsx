"use client";

import { useState, useEffect, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { FilterPanel } from "./iconrail";

type Props = {
  email: string;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isMobile: boolean;
  session: Session;
  onAuthRequired: () => void;
  onReport: () => void;
  onLocate: () => void;
  filterTypes: string[];
  filterStatuses: string[];
  onFilterTypes: (types: string[]) => void;
  onFilterStatuses: (statuses: string[]) => void;
  activeRailItem: string | null;
  onSelectRailItem: (item: string | null) => void;
};

export default function Navbar({
  email,
  onLogout,
  searchQuery,
  onSearchChange,
  isMobile,
  onReport,
  onLocate,
  filterTypes,
  filterStatuses,
  onFilterTypes,
  onFilterStatuses,
  activeRailItem,
  onSelectRailItem,
}: Props) {
  const initials = email.charAt(0).toUpperCase();
  const [open, setOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [catPos, setCatPos] = useState({ x: 16, y: 80 });
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, catX: 0, catY: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const mobileActionsRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters = filterTypes.length > 0 || filterStatuses.length > 0;

  useEffect(() => {
    const saved = localStorage.getItem("whiskr-cat-pos");
    if (saved) {
      try {
        setCatPos(JSON.parse(saved));
      } catch {}
    }
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    draggingRef.current = true;
    movedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      catX: catPos.x,
      catY: catPos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Small movements shouldn't count as a drag — keeps a normal tap working
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      movedRef.current = true;
    }

    const nextX = Math.min(
      Math.max(0, dragStartRef.current.catX + dx),
      window.innerWidth - 40,
    );
    const nextY = Math.min(
      Math.max(0, dragStartRef.current.catY + dy),
      window.innerHeight - 40,
    );
    setCatPos({ x: nextX, y: nextY });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    localStorage.setItem("whiskr-cat-pos", JSON.stringify(catPos));

    // Only treat it as a tap (open the menu) if it wasn't dragged
    if (!movedRef.current) {
      setMobileActionsOpen((prev) => !prev);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
      if (
        mobileActionsRef.current &&
        !mobileActionsRef.current.contains(e.target as Node)
      ) {
        setMobileActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const pillStyle = (activeState: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: activeState ? "#8B80C9" : "white",
    color: activeState ? "white" : "#4A3F7A",
    borderRadius: 24,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 500,
    boxShadow: "0 2px 10px rgba(74,63,122,0.18)",
    border: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
    pointerEvents: "auto",
  });

  const mobileActionRow = (
    icon: string,
    label: string,
    onClick: () => void,
    active?: boolean,
  ) => (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "12px 16px",
        background: active ? "#F5EEF0" : "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        color: "#4A3F7A",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span> {label}
    </button>
  );

  return (
    <nav
      style={{
        background: "transparent",
        padding: 16,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "flex-start",
        gap: 12,
        zIndex: 10000,
        flexShrink: 0,
        position: "relative",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        {/* Logo pill — desktop only */}
        {!isMobile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              background: "white",
              borderRadius: 24,
              padding: "10px 16px",
              boxShadow: "0 2px 10px rgba(74,63,122,0.18)",
              pointerEvents: "auto",
            }}
          >
            <span style={{ fontSize: 18 }}>🐾</span>
            <span style={{ fontWeight: 700, color: "#4A3F7A", fontSize: 15 }}>
              whiskr
            </span>
          </div>
        )}

        {/* Search bar pill */}
        <div
          style={{
            width: isMobile ? 190 : 320,
            maxWidth: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "white",
            borderRadius: 24,
            padding: "10px 16px",
            boxShadow: "0 2px 10px rgba(74,63,122,0.18)",
            pointerEvents: "auto",
            flexShrink: 1,
          }}
        >
          <span style={{ fontSize: 14 }}>{isMobile ? "🐾" : "🔍"}</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="search reports..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
              color: "#4A3F7A",
              minWidth: 0,
            }}
          />
          {searchQuery && (
            <span
              onClick={() => onSearchChange("")}
              style={{ fontSize: 12, color: "#9CA3AF", cursor: "pointer" }}
            >
              ✕
            </span>
          )}
        </div>

        {/* Desktop action pills */}
        {!isMobile && (
          <>
            <button style={pillStyle(false)} onClick={onReport}>
              ➕ report a cat
            </button>

            <button style={pillStyle(false)} onClick={onLocate}>
              📍 locate me
            </button>

            <div ref={filterRef} style={{ position: "relative" }}>
              <button
                style={pillStyle(showFilter || hasActiveFilters)}
                onClick={() => setShowFilter(!showFilter)}
              >
                🔧 filter
              </button>
              {showFilter && (
                <FilterPanel
                  filterTypes={filterTypes}
                  filterStatuses={filterStatuses}
                  onFilterTypes={onFilterTypes}
                  onFilterStatuses={onFilterStatuses}
                  onClose={() => setShowFilter(false)}
                  style={{ position: "absolute", top: 52, left: 0 }}
                />
              )}
            </div>

            <button
              style={pillStyle(activeRailItem === "profile")}
              onClick={() =>
                onSelectRailItem(
                  activeRailItem === "profile" ? null : "profile",
                )
              }
            >
              👤 my reports
            </button>
          </>
        )}

        {/* push avatar to the right */}
        <div style={{ marginLeft: "auto" }} />

        {/* Avatar pill + dropdown */}
        <div ref={ref} style={{ position: "relative", pointerEvents: "auto" }}>
          <div
            onClick={() => setOpen(!open)}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#8B80C9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              userSelect: "none",
              boxShadow: "0 2px 10px rgba(74,63,122,0.25)",
            }}
          >
            {initials}
          </div>

          {open && (
            <div
              style={{
                position: "absolute",
                top: 44,
                right: 0,
                background: "white",
                borderRadius: 14,
                boxShadow: "0 4px 24px rgba(74,63,122,0.15)",
                border: "0.5px solid #E8E6F0",
                minWidth: 200,
                overflow: "hidden",
                zIndex: 9999,
              }}
            >
              <div
                style={{
                  padding: "14px 16px 10px",
                  borderBottom: "0.5px solid #E8E6F0",
                }}
              >
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>
                  signed in as
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#4A3F7A",
                    fontWeight: 500,
                    wordBreak: "break-all",
                  }}
                >
                  {email}
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  color: "#4A3F7A",
                  textAlign: "left",
                  borderBottom: "0.5px solid #E8E6F0",
                }}
              >
                <span>✏️</span> edit profile
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  color: "#EF4444",
                  textAlign: "left",
                }}
              >
                <span>🚪</span> log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: draggable cat-icon toggle for actions */}
      {isMobile && (
        <div ref={mobileActionsRef}>
          <button
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              position: "fixed",
              left: catPos.x,
              top: catPos.y,
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "none",
              background: "white",
              boxShadow: "0 2px 10px rgba(74,63,122,0.18)",
              cursor: "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
              touchAction: "none",
              zIndex: 10003,
              pointerEvents: "auto",
            }}
          >
            🐱
          </button>

          {mobileActionsOpen && (
            <div
              style={{
                position: "fixed",
                left: catPos.x,
                top: catPos.y + 48,
                background: "white",
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(74,63,122,0.15)",
                border: "0.5px solid #E8E6F0",
                width: 180,
                overflow: "hidden",
                zIndex: 99999,
                pointerEvents: "auto",
              }}
            >
              {mobileActionRow("➕", "report a cat", () => {
                onReport();
                setMobileActionsOpen(false);
              })}
              {mobileActionRow("📍", "locate me", () => {
                onLocate();
                setMobileActionsOpen(false);
              })}
              {mobileActionRow(
                "🔧",
                "filter",
                () => {
                  setShowFilter(!showFilter);
                },
                showFilter || hasActiveFilters,
              )}
              {mobileActionRow(
                "👤",
                "my reports",
                () => {
                  onSelectRailItem(
                    activeRailItem === "profile" ? null : "profile",
                  );
                  setMobileActionsOpen(false);
                },
                activeRailItem === "profile",
              )}
            </div>
          )}

          {showFilter && (
            <FilterPanel
              filterTypes={filterTypes}
              filterStatuses={filterStatuses}
              onFilterTypes={onFilterTypes}
              onFilterStatuses={onFilterStatuses}
              onClose={() => setShowFilter(false)}
              style={{
                position: "fixed",
                left: catPos.x,
                top: catPos.y + 48,
                pointerEvents: "auto",
              }}
            />
          )}
        </div>
      )}
    </nav>
  );
}
