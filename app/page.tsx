"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Report } from "../types";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./components/map/mapcontainer"), {
  ssr: false,
});
import Navbar from "./components/layout/navbar";
import IconRail from "./components/layout/iconrail";
import DetailPanel from "./components/panel/detailpanel";
import AuthModal from "./components/auth/authmodal";
import Landing from "./components/auth/landing";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeRailItem, setActiveRailItem] = useState<string | null>(null);

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
        Loading...
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
        <IconRail
          active={activeRailItem}
          onSelect={setActiveRailItem}
          session={session}
          onAuthRequired={() => setShowAuth(true)}
        />
        <div style={{ flex: 1, position: "relative" }}>
          <Map
            onSelectReport={setSelectedReport}
            selectedReport={selectedReport}
          />
        </div>
        {selectedReport && (
          <DetailPanel
            report={selectedReport}
            session={session}
            onClose={() => setSelectedReport(null)}
            onAuthRequired={() => setShowAuth(true)}
          />
        )}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
