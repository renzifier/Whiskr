"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Report, RecentlyViewed, Profile } from "../types";
import dynamic from "next/dynamic";
import Navbar from "./components/layout/navbar";
import Sidebar from "./components/layout/sidebar";
import DetailPanel from "./components/panel/detailpanel";
import AuthModal from "./components/auth/authmodal";
import Landing from "./components/auth/landing";
import ReportForm from "./components/report/reportform";

const Map = dynamic(() => import("./components/map/mapcontainer"), {
  ssr: false,
});

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showReport, setShowReport] = useState(false);
  const [reportPos, setReportPos] = useState<[number, number] | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeRailItem, setActiveRailItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const locateFnRef = useRef<(() => void) | null>(null);
  const searchNavigateRef = useRef<((lat: number, lng: number) => void) | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [savedReports, setSavedReports] = useState<Report[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewed[]>([]);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (selectedReport) setSidebarCollapsed(false);
  }, [selectedReport]);

  useEffect(() => {
    function handleRescueCompleted(e: Event) {
      const { reportId } = (e as CustomEvent).detail;
      setSelectedReport((prev) => (prev?.id === reportId ? null : prev));
    }
    window.addEventListener("rescue-completed", handleRescueCompleted);
    return () =>
      window.removeEventListener("rescue-completed", handleRescueCompleted);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("whiskr-recently-viewed");
    if (saved) {
      try {
        setRecentlyViewed(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Track a view every time a report is opened
  useEffect(() => {
    if (!selectedReport) return;
    setRecentlyViewed((prev) => {
      const snapshot: RecentlyViewed = {
        id: selectedReport.id,
        cat_type: selectedReport.cat_type,
        description: selectedReport.description,
        photo_url: selectedReport.photo_url,
        lat: selectedReport.lat,
        lng: selectedReport.lng,
        viewed_at: new Date().toISOString(),
      };
      const deduped = prev.filter((r) => r.id !== snapshot.id);
      const next = [snapshot, ...deduped].slice(0, 10);
      localStorage.setItem("whiskr-recently-viewed", JSON.stringify(next));
      return next;
    });
  }, [selectedReport]);

  // Load saved (bookmarked) reports for the logged-in user
  async function loadSavedReports(userId: string) {
    const { data } = await supabase
      .from("saved_reports")
      .select("report_id, reports(*)")
      .eq("user_id", userId);

    if (data) {
      const reports = data
        .map((row: any) => row.reports as Report)
        .filter(Boolean);
      setSavedReports(reports);
    }
  }

  useEffect(() => {
    if (session?.user.id) {
      loadSavedReports(session.user.id);
    }
  }, [session?.user.id]);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (data) setProfile(data);
    }
    loadProfile();
  }, [session?.user.id]);

  async function handleToggleSave() {
    if (!session || !selectedReport) return;
    const alreadySaved = savedReports.some((r) => r.id === selectedReport.id);

    if (alreadySaved) {
      await supabase
        .from("saved_reports")
        .delete()
        .eq("user_id", session.user.id)
        .eq("report_id", selectedReport.id);
      setSavedReports((prev) => prev.filter((r) => r.id !== selectedReport.id));
    } else {
      await supabase
        .from("saved_reports")
        .insert({ user_id: session.user.id, report_id: selectedReport.id });
      setSavedReports((prev) => [...prev, selectedReport]);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSelectedReport(null);
  }

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#E8E6F0",
          color: "#4A3F7A",
          fontSize: 14,
        }}
      >
        loading...
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Landing
          onLogin={() => {
            setAuthMode("login");
            setShowAuth(true);
          }}
          onSignUp={() => {
            setAuthMode("signup");
            setShowAuth(true);
          }}
        />
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            defaultMode={authMode}
          />
        )}
      </>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Floating navbar overlay — sits on top of the map, doesn't push it down */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: isMobile ? 0 : 88,
          right: 0,
          zIndex: 10001,
        }}
      >
        <Navbar
          email={session.user.email ?? ""}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isMobile={isMobile}
          session={session}
          onAuthRequired={() => setShowAuth(true)}
          onReport={() => setShowReport(true)}
          onLocate={() => {
            console.log("locate clicked, fn:", locateFnRef.current);
            locateFnRef.current?.();
          }}
          filterTypes={filterTypes}
          filterStatuses={filterStatuses}
          onFilterTypes={setFilterTypes}
          onFilterStatuses={setFilterStatuses}
          activeRailItem={activeRailItem}
          onSelectRailItem={setActiveRailItem}
          onSelectPlace={(lat, lng) => searchNavigateRef.current?.(lat, lng)}
          profile={profile}
          onProfileSaved={setProfile}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Sidebar
          savedReports={savedReports}
          recentlyViewed={recentlyViewed}
          isMobile={isMobile}
          collapsed={sidebarCollapsed}
          onSelect={(item) => {
            // RecentlyViewed items are lightweight snapshots; if the full
            // report is still loaded on the map, prefer that richer object.
            const full = savedReports.find((r) => r.id === item.id);
            setSelectedReport((full ?? item) as Report);
          }}
        />

        <div style={{ flex: 1, position: "relative" }}>
          <Map
            onSelectReport={setSelectedReport}
            selectedReport={selectedReport}
            onMapClick={(lat, lng) => setReportPos([lat, lng])}
            filterTypes={filterTypes}
            filterStatuses={filterStatuses}
            searchQuery={searchQuery}
            onLocate={(fn) => {
              locateFnRef.current = fn;
            }}
            onSearchNavigate={(fn) => {
              searchNavigateRef.current = fn;
            }}
            showMineOnly={activeRailItem === "profile"}
            userId={session.user.id}
          />

          {isMobile && selectedReport && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 500,
              }}
            >
              <DetailPanel
                report={selectedReport}
                session={session}
                onClose={() => setSelectedReport(null)}
                onCollapseSidebar={() => {}}
                onAuthRequired={() => setShowAuth(true)}
                isSaved={savedReports.some((r) => r.id === selectedReport.id)}
                onToggleSave={handleToggleSave}
                isMobile={isMobile}
              />
            </div>
          )}
        </div>

        {!isMobile && selectedReport && (
          <DetailPanel
            report={selectedReport}
            session={session}
            onClose={() => setSelectedReport(null)}
            onCollapseSidebar={() => setSidebarCollapsed(true)}
            onAuthRequired={() => setShowAuth(true)}
            isSaved={savedReports.some((r) => r.id === selectedReport.id)}
            onToggleSave={handleToggleSave}
            isMobile={isMobile}
          />
        )}
      </div>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} defaultMode={authMode} />
      )}

      {showReport && reportPos && (
        <ReportForm
          lat={reportPos[0]}
          lng={reportPos[1]}
          onClose={() => {
            setShowReport(false);
            setReportPos(null);
          }}
          onSuccess={() => {
            setShowReport(false);
            setReportPos(null);
          }}
        />
      )}
    </div>
  );
}
