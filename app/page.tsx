"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Report } from "../types";
import dynamic from "next/dynamic";
import Navbar from "./components/layout/navbar";
import IconRail from "./components/layout/iconrail";
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
  const [showReport, setShowReport] = useState(false);
  const [reportPos, setReportPos] = useState<[number, number] | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeRailItem, setActiveRailItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const locateFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
          onLogin={() => setShowAuth(true)}
          onSignUp={() => setShowAuth(true)}
        />
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
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
      }}
    >
      <Navbar email={session.user.email ?? ""} onLogout={handleLogout} />

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {!isMobile && (
          <IconRail
            active={activeRailItem}
            onSelect={setActiveRailItem}
            session={session}
            onAuthRequired={() => setShowAuth(true)}
            onReport={() => setShowReport(true)}
            filterTypes={filterTypes}
            filterStatuses={filterStatuses}
            onFilterTypes={setFilterTypes}
            onFilterStatuses={setFilterStatuses}
            onLocate={() => {
              console.log("locate clicked, fn:", locateFnRef.current);
              locateFnRef.current?.();
            }}
          />
        )}

        <div style={{ flex: 1, position: "relative" }}>
          <Map
            onSelectReport={setSelectedReport}
            selectedReport={selectedReport}
            onMapClick={(lat, lng) => setReportPos([lat, lng])}
            filterTypes={filterTypes}
            filterStatuses={filterStatuses}
            onLocate={(fn) => {
              locateFnRef.current = fn;
            }}
            showMineOnly={activeRailItem === "profile"}
            userId={session.user.id}
          />

          {isMobile && (
            <IconRail
              active={activeRailItem}
              onSelect={setActiveRailItem}
              session={session}
              onAuthRequired={() => setShowAuth(true)}
              onReport={() => setShowReport(true)}
              filterTypes={filterTypes}
              filterStatuses={filterStatuses}
              onFilterTypes={setFilterTypes}
              onFilterStatuses={setFilterStatuses}
              onLocate={() => {
                console.log("locate clicked, fn:", locateFnRef.current);
                locateFnRef.current?.();
              }}
            />
          )}

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
                onAuthRequired={() => setShowAuth(true)}
              />
            </div>
          )}
        </div>

        {!isMobile && selectedReport && (
          <DetailPanel
            report={selectedReport}
            session={session}
            onClose={() => setSelectedReport(null)}
            onAuthRequired={() => setShowAuth(true)}
          />
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

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
