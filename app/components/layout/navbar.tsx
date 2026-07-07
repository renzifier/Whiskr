"use client";

import { useState, useRef, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "../../../types";
import { FilterPanel } from "./iconrail";
import EditProfileModal from "../auth/editprofilemodal";

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
  onSelectPlace: (lat: number, lng: number) => void;
  profile: Profile | null;
  onProfileSaved: (profile: Profile) => void;
};

export default function Navbar({
  email,
  onLogout,
  searchQuery,
  onSearchChange,
  isMobile,
  session,
  onReport,
  onLocate,
  filterTypes,
  filterStatuses,
  onFilterTypes,
  onFilterStatuses,
  activeRailItem,
  onSelectRailItem,
  onSelectPlace,
  profile,
  onProfileSaved,
}: Props) {
  const initials = (profile?.display_name || email).charAt(0).toUpperCase();
  const [open, setOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [catPos, setCatPos] = useState({ x: 16, y: 80 });
  const [catFrame, setCatFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setCatFrame((f) => (f === 0 ? 1 : 0)),
      600,
    );
    return () => clearInterval(interval);
  }, []);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, catX: 0, catY: 0 });
  const [placeResults, setPlaceResults] = useState<
    {
      display_name: string;
      lat: string;
      lon: string;
    }[]
  >([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const mobileActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const query = searchQuery.trim();
    if (query.length < 2) {
      setPlaceResults([]);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchingPlaces(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query,
          )}&limit=5`,
        );
        const data = await res.json();
        setPlaceResults(Array.isArray(data) ? data : []);
      } catch {
        setPlaceResults([]);
      } finally {
        setSearchingPlaces(false);
      }
    }, 400);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  function handleSelectPlace(place: { lat: string; lon: string }) {
    onSelectPlace(parseFloat(place.lat), parseFloat(place.lon));
    setPlaceResults([]);
  }

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
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setPlaceResults([]);
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
    background: activeState ? "#8B80C9" : "#1A1628",
    color: activeState ? "white" : "rgba(255,255,255,0.85)",
    borderRadius: 24,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 500,
    boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
    border: "0.5px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    pointerEvents: "auto",
  });

  const mobileActionRow = (
    icon: React.ReactNode,
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
        background: active ? "rgba(139,128,201,0.15)" : "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        color: "rgba(255,255,255,0.85)",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 16, display: "flex" }}>{icon}</span> {label}
    </button>
  );

  return (
    <>
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
            width: "100%",
          }}
        >
          {!isMobile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
                background: "#1A1628",
                borderRadius: 24,
                padding: "10px 16px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                pointerEvents: "auto",
              }}
            >
              <img
                src="/icons/whiskr-icon.png"
                alt=""
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 700, color: "#8B80C9", fontSize: 15 }}>
                Whiskr
              </span>
            </div>
          )}

          <div ref={searchRef} style={{ position: "relative" }}>
            <div
              style={{
                width: isMobile ? 190 : 320,
                maxWidth: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#1A1628",
                borderRadius: 24,
                padding: "10px 16px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                pointerEvents: "auto",
                flexShrink: 1,
              }}
            >
              {isMobile ? (
                <img
                  src="/icons/whiskr-icon.png"
                  alt=""
                  style={{ width: 14, height: 14 }}
                />
              ) : (
                <img
                  src="/icons/magnifying-glass.png"
                  alt=""
                  style={{ width: 14, height: 14 }}
                />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search reports or places..."
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 13,
                  color: "white",
                  minWidth: 0,
                }}
              />
              {searchQuery && (
                <span
                  onClick={() => {
                    onSearchChange("");
                    setPlaceResults([]);
                  }}
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </span>
              )}
            </div>

            {(placeResults.length > 0 || searchingPlaces) && (
              <div
                style={{
                  position: "absolute",
                  top: 48,
                  left: 0,
                  width: "100%",
                  minWidth: 240,
                  background: "#1A1628",
                  borderRadius: 16,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  zIndex: 99999,
                  pointerEvents: "auto",
                }}
              >
                {searchingPlaces && placeResults.length === 0 && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.5)",
                      padding: "12px 16px",
                    }}
                  >
                    Searching places...
                  </p>
                )}
                {placeResults.map((place, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectPlace(place)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 16px",
                      background: "transparent",
                      border: "none",
                      borderBottom:
                        i < placeResults.length - 1
                          ? "0.5px solid rgba(255,255,255,0.08)"
                          : "none",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    <img
                      src="/icons/pin-button.png"
                      alt=""
                      style={{ width: 12, height: 12, marginRight: 4 }}
                    />{" "}
                    {place.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isMobile && (
            <>
              <button style={pillStyle(false)} onClick={onReport}>
                <img
                  src="/icons/add.png"
                  alt=""
                  style={{ width: 14, height: 14 }}
                />{" "}
                Report a Cat
              </button>

              <button style={pillStyle(false)} onClick={onLocate}>
                <img
                  src="/icons/pin-button.png"
                  alt=""
                  style={{ width: 14, height: 14 }}
                />{" "}
                Locate Me
              </button>

              <div ref={filterRef} style={{ position: "relative" }}>
                <button
                  style={pillStyle(showFilter || hasActiveFilters)}
                  onClick={() => setShowFilter(!showFilter)}
                >
                  <img
                    src="/icons/filter.png"
                    alt=""
                    style={{ width: 14, height: 14 }}
                  />{" "}
                  Filter
                </button>
                {showFilter && (
                  <FilterPanel
                    filterTypes={filterTypes}
                    filterStatuses={filterStatuses}
                    onFilterTypes={onFilterTypes}
                    onFilterStatuses={onFilterStatuses}
                    onClose={() => setShowFilter(false)}
                    style={{
                      position: "absolute",
                      top: 52,
                      left: 0,
                      pointerEvents: "auto",
                    }}
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
                <img
                  src="/icons/my-reports.png"
                  alt=""
                  style={{ width: 14, height: 14 }}
                />{" "}
                My Reports
              </button>
            </>
          )}

          <div style={{ marginLeft: "auto" }} />

          <div
            ref={ref}
            style={{ position: "relative", pointerEvents: "auto" }}
          >
            <div
              onClick={() => setOpen(!open)}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "#8B80C9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
                boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  onError={(e) => {
                    console.error(
                      "Avatar image failed to load:",
                      profile.avatar_url,
                    );
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                initials
              )}
            </div>

            {open && (
              <div
                style={{
                  position: "absolute",
                  top: 44,
                  right: 0,
                  background: "#1A1628",
                  borderRadius: 14,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  minWidth: 200,
                  overflow: "hidden",
                  zIndex: 9999,
                }}
              >
                <div
                  style={{
                    padding: "14px 16px 10px",
                    borderBottom: "0.5px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: 2,
                    }}
                  >
                    Signed in as
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "white",
                      fontWeight: 500,
                      wordBreak: "break-all",
                    }}
                  >
                    {profile?.display_name || email}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowEditProfile(true);
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
                    color: "rgba(255,255,255,0.85)",
                    textAlign: "left",
                    borderBottom: "0.5px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span>✏️</span> Edit Profile
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
                  <span>🚪</span> Log Out
                </button>
              </div>
            )}
          </div>
        </div>

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
                border: "0.5px solid rgba(255,255,255,0.08)",
                background: "#1A1628",
                boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
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
              <img
                src={`/icons/cat-${catFrame + 1}.png`}
                alt=""
                style={{ width: 28, height: 28 }}
              />
            </button>

            {mobileActionsOpen && (
              <div
                style={{
                  position: "fixed",
                  left: catPos.x,
                  top: catPos.y + 48,
                  background: "#1A1628",
                  borderRadius: 16,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  width: 180,
                  overflow: "hidden",
                  zIndex: 99999,
                  pointerEvents: "auto",
                }}
              >
                {mobileActionRow(
                  <img
                    src="/icons/add.png"
                    alt=""
                    style={{ width: 16, height: 16 }}
                  />,
                  "Report a Cat",
                  () => {
                    onReport();
                    setMobileActionsOpen(false);
                  },
                )}
                {mobileActionRow(
                  <img
                    src="/icons/pin-button.png"
                    alt=""
                    style={{ width: 16, height: 16 }}
                  />,
                  "Locate Me",
                  () => {
                    onLocate();
                    setMobileActionsOpen(false);
                  },
                )}
                {mobileActionRow(
                  <img
                    src="/icons/filter.png"
                    alt=""
                    style={{ width: 16, height: 16 }}
                  />,
                  "Filter",
                  () => {
                    setShowFilter(!showFilter);
                  },
                  showFilter || hasActiveFilters,
                )}
                {mobileActionRow(
                  <img
                    src="/icons/my-reports.png"
                    alt=""
                    style={{ width: 16, height: 16 }}
                  />,
                  "My Reports",
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

      {showEditProfile && (
        <EditProfileModal
          session={session}
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onSaved={(updated) => {
            onProfileSaved(updated);
            setShowEditProfile(false);
          }}
        />
      )}
    </>
  );
}
