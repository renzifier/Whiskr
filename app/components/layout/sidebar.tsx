"use client";

import { useState, useRef, useEffect } from "react";
import type { Report, RecentlyViewed } from "../../../types";

type Props = {
  savedReports: Report[];
  recentlyViewed: RecentlyViewed[];
  onSelect: (report: Report | RecentlyViewed) => void;
  isMobile: boolean;
  collapsed: boolean;
};

const typeLabels: Record<string, string> = {
  stray: "Stray",
  missing: "Missing",
  injured: "Injured",
  colony: "Colony",
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
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        alignItems: "center",
      }}
    >
      <img
        src={item.photo_url}
        alt="Cat"
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
            color: "white",
            marginBottom: 2,
          }}
        >
          {typeLabels[item.cat_type] ?? item.cat_type}
        </p>
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.5)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.description ?? "No description"}
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
        color: "rgba(255,255,255,0.5)",
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
        background: "#1A1628",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        border: "0.5px solid rgba(255,255,255,0.08)",
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
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
          position: "sticky",
          top: 0,
          background: "#1A1628",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{title}</p>
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
  icon: React.ReactNode;
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
      <span
        style={{
          fontSize: 20,
          color: active ? "white" : "rgba(255,255,255,0.5)",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: active ? "white" : "rgba(255,255,255,0.5)",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ---------- Desktop: collapsible column ----------
function DesktopSidebar({
  savedReports,
  recentlyViewed,
  onSelect,
  collapsed,
}: Omit<Props, "isMobile"> & { collapsed: boolean }) {
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
        position: "fixed",
        top: 0,
        left: collapsed ? -SIDEBAR_WIDTH : 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        background: "#1A1628",
        boxShadow: "2px 0 10px rgba(0,0,0,0.35)",
        borderRight: "0.5px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 0",
        gap: 4,
        zIndex: 9998,
        transition: "left 0.25s ease",
      }}
    >
      <button
        title="Menu"
        onClick={() => {
          setMenuOpen(!menuOpen);
          if (menuOpen) setOpen(null);
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          border: "none",
          background: menuOpen ? "rgba(139,128,201,0.15)" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          color: "#8B80C9",
          marginBottom: 12,
        }}
      >
        ☰
      </button>

      {menuOpen && (
        <>
          <RailItem
            icon={
              <img
                src="/icons/save-button.png"
                alt=""
                style={{ width: 18, height: 18 }}
              />
            }
            label="Saved"
            active={open === "saved"}
            onClick={() => setOpen(open === "saved" ? null : "saved")}
          />

          <RailItem
            icon={
              <img
                src="/icons/recents-clock.png"
                alt=""
                style={{ width: 18, height: 18 }}
              />
            }
            label="Recents"
            active={open === "recent"}
            onClick={() => setOpen(open === "recent" ? null : "recent")}
          />
        </>
      )}

      {open === "saved" && (
        <ListPanel
          title="Saved Reports"
          items={savedReports}
          emptyText="No saved reports yet — tap the bookmark icon on a report to save it"
          onSelect={onSelect}
          onClose={() => setOpen(null)}
        />
      )}

      {open === "recent" && (
        <ListPanel
          title="Recently Viewed"
          items={recentlyViewed}
          emptyText="Reports you view will show up here"
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
}: Omit<Props, "isMobile" | "collapsed">) {
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
      ? "No saved reports yet — tap the bookmark icon on a report to save it"
      : "Reports you view will show up here";

  return (
    <>
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
          background: "var(--color-surface)",
          boxShadow: "2px 0 8px rgba(var(--color-shadow),0.15)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: "var(--color-accent)",
          zIndex: 10002,
          transition: "left 0.25s ease",
        }}
      >
        {drawerOpen ? "‹" : "›"}
      </button>

      <div
        ref={drawerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          background: "var(--color-surface)",
          boxShadow: "2px 0 16px rgba(var(--color-shadow),0.2)",
          zIndex: 10001,
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: "0.5px solid var(--color-border)",
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
                tab === "saved"
                  ? "2px solid var(--color-accent)"
                  : "2px solid transparent",
              color:
                tab === "saved"
                  ? "var(--color-text)"
                  : "var(--color-text-muted)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            🔖 Saved
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
                  ? "2px solid var(--color-accent)"
                  : "2px solid transparent",
              color:
                tab === "recent"
                  ? "var(--color-text)"
                  : "var(--color-text-muted)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <img
              src="/icons/recents-clock.png"
              alt=""
              style={{ width: 14, height: 14 }}
            />
            Recents
          </button>
        </div>

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
  collapsed,
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
      collapsed={collapsed}
    />
  );
}
