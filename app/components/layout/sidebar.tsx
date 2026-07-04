"use client";

import { useState, useRef, useEffect } from "react";
import type { Report, RecentlyViewed } from "../../../types";

type Props = {
  savedReports: Report[];
  recentlyViewed: RecentlyViewed[];
  onSelect: (report: Report | RecentlyViewed) => void;
  isMobile: boolean;
};

const typeLabels: Record<string, string> = {
  stray: "stray",
  missing: "missing",
  injured: "injured",
  colony: "colony",
};

const SIDEBAR_WIDTH = 88;
const DRAWER_WIDTH = 260;

function ItemRow({
  item,
  onSelect,
}: {
  item: Report | RecentlyViewed;
  onSelect: (item: Report | RecentlyViewed) => void;
}) {
  return (
    <div
      onClick={() => onSelect(item)}
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 16px",
        cursor: "pointer",
        borderBottom: "0.5px solid #F5EEF0",
        alignItems: "center",
      }}
    >
      <img
        src={item.photo_url}
        alt="cat"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#4A3F7A",
            marginBottom: 2,
          }}
        >
          {typeLabels[item.cat_type] ?? item.cat_type}
        </p>
        <p
          style={{
            fontSize: 11,
            color: "#9CA3AF",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.description ?? "no description"}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: 12,
        color: "#9CA3AF",
        padding: "20px 16px",
        textAlign: "center",
      }}
    >
      {text}
    </p>
  );
}

function ListPanel({
  title,
  items,
  emptyText,
  onSelect,
  onClose,
  style,
}: {
  title: string;
  items: (Report | RecentlyViewed)[];
  emptyText: string;
  onSelect: (item: Report | RecentlyViewed) => void;
  onClose: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: SIDEBAR_WIDTH,
        background: "white",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(74,63,122,0.15)",
        border: "0.5px solid #E8E6F0",
        width: 260,
        maxHeight: 400,
        overflowY: "auto",
        zIndex: 99999,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px",
          borderBottom: "0.5px solid #E8E6F0",
          position: "sticky",
          top: 0,
          background: "white",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "#4A3F7A" }}>
          {title}
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

      {items.length === 0 ? (
        <EmptyState text={emptyText} />
      ) : (
        items.map((item) => (
          <ItemRow key={item.id} item={item} onSelect={onSelect} />
        ))
      )}
    </div>
  );
}

function RailItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        width: "100%",
        padding: "12px 0",
        background: "transparent",
        border: "none",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 20, color: active ? "#4A3F7A" : "#9CA3AF" }}>
        {icon}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: active ? "#4A3F7A" : "#9CA3AF",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ---------- Desktop: static column, unchanged from before ----------
function DesktopSidebar({
  savedReports,
  recentlyViewed,
  onSelect,
}: Omit<Props, "isMobile">) {
  const [open, setOpen] = useState<"saved" | "recent" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: SIDEBAR_WIDTH,
        background: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 0",
        gap: 4,
        zIndex: 9998,
        flexShrink: 0,
        position: "relative",
      }}
    >
      <button
        title="menu"
        onClick={() => {
          setMenuOpen(!menuOpen);
          if (menuOpen) setOpen(null);
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          border: "none",
          background: menuOpen ? "#E7DBFF" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          color: "#4A3F7A",
          marginBottom: 12,
        }}
      >
        ☰
      </button>

      {menuOpen && (
        <>
          <RailItem
            icon="🔖"
            label="saved"
            active={open === "saved"}
            onClick={() => setOpen(open === "saved" ? null : "saved")}
          />

          <RailItem
            icon="🕐"
            label="recents"
            active={open === "recent"}
            onClick={() => setOpen(open === "recent" ? null : "recent")}
          />
        </>
      )}

      {open === "saved" && (
        <ListPanel
          title="saved reports"
          items={savedReports}
          emptyText="no saved reports yet — tap the bookmark icon on a report to save it"
          onSelect={onSelect}
          onClose={() => setOpen(null)}
        />
      )}

      {open === "recent" && (
        <ListPanel
          title="recently viewed"
          items={recentlyViewed}
          emptyText="reports you view will show up here"
          onSelect={onSelect}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

// ---------- Mobile: edge arrow tab that slides a drawer open ----------
function MobileSidebar({
  savedReports,
  recentlyViewed,
  onSelect,
}: Omit<Props, "isMobile">) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState<"saved" | "recent">("saved");
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (
        drawerOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node)
      ) {
        setDrawerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [drawerOpen]);

  const items = tab === "saved" ? savedReports : recentlyViewed;
  const emptyText =
    tab === "saved"
      ? "no saved reports yet — tap the bookmark icon on a report to save it"
      : "reports you view will show up here";

  return (
    <>
      {/* Arrow tab — always visible, fixed to the left edge */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        style={{
          position: "fixed",
          top: "50%",
          left: drawerOpen ? DRAWER_WIDTH : 0,
          transform: "translateY(-50%)",
          width: 22,
          height: 52,
          borderRadius: "0 12px 12px 0",
          border: "none",
          background: "white",
          boxShadow: "2px 0 8px rgba(74,63,122,0.15)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: "#8B80C9",
          zIndex: 10002,
          transition: "left 0.25s ease",
        }}
      >
        {drawerOpen ? "‹" : "›"}
      </button>

      {/* Sliding drawer */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          background: "white",
          boxShadow: "2px 0 16px rgba(74,63,122,0.2)",
          zIndex: 10001,
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "0.5px solid #E8E6F0",
            paddingTop: 20,
          }}
        >
          <button
            onClick={() => setTab("saved")}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "transparent",
              border: "none",
              borderBottom:
                tab === "saved" ? "2px solid #8B80C9" : "2px solid transparent",
              color: tab === "saved" ? "#4A3F7A" : "#9CA3AF",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            🔖 saved
          </button>
          <button
            onClick={() => setTab("recent")}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "transparent",
              border: "none",
              borderBottom:
                tab === "recent"
                  ? "2px solid #8B80C9"
                  : "2px solid transparent",
              color: tab === "recent" ? "#4A3F7A" : "#9CA3AF",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            🕐 recents
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {items.length === 0 ? (
            <EmptyState text={emptyText} />
          ) : (
            items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onSelect={(i) => {
                  onSelect(i);
                  setDrawerOpen(false);
                }}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default function Sidebar({
  savedReports,
  recentlyViewed,
  onSelect,
  isMobile,
}: Props) {
  if (isMobile) {
    return (
      <MobileSidebar
        savedReports={savedReports}
        recentlyViewed={recentlyViewed}
        onSelect={onSelect}
      />
    );
  }
  return (
    <DesktopSidebar
      savedReports={savedReports}
      recentlyViewed={recentlyViewed}
      onSelect={onSelect}
    />
  );
}
