"use client";

type Props = {
  onLogin: () => void;
  onSignUp: () => void;
};

export default function Landing({ onLogin, onSignUp }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F0D1A",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Mobile: stacked, Desktop: split */}
      <div
        className="wh-landing-wrap"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Left / Top — content */}
        <div
          className="wh-landing-left"
          style={{
            background: "#0F0D1A",
            padding: "48px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: "0 0 auto",
          }}
        >
          <div style={{ maxWidth: 400, margin: "0 auto", width: "100%" }}>
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 40,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "rgba(139,128,201,0.2)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                🐾
              </div>
              <span style={{ color: "white", fontSize: 18, fontWeight: 600 }}>
                whiskr
              </span>
            </div>

            {/* Tag */}
            <div
              style={{
                display: "inline-block",
                background: "rgba(139,128,201,0.2)",
                color: "#8B80C9",
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 20,
                marginBottom: 20,
                letterSpacing: "0.5px",
              }}
            >
              live cat rescue map
            </div>

            {/* Headline */}
            <h1
              style={{
                color: "white",
                fontSize: 36,
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: 16,
                letterSpacing: "-1px",
              }}
            >
              every stray cat
              <br />
              deserves a <span style={{ color: "#8B80C9" }}>spotter</span>
            </h1>

            {/* Subheadline */}
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 14,
                lineHeight: 1.7,
                marginBottom: 36,
                maxWidth: 320,
              }}
            >
              drop a pin when you see one. the community confirms it. a
              volunteer goes. that's whiskr.
            </p>

            {/* Pin legend */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 36,
              }}
            >
              {[
                { color: "#8B80C9", label: "stray" },
                { color: "#EF4444", label: "missing" },
                { color: "#3B82F6", label: "rescue accepted" },
                { color: "#10B981", label: "colony" },
              ].map((pin) => (
                <div
                  key={pin.label}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: pin.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
                  >
                    {pin.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={onLogin}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 50,
                  border: "none",
                  background: "#8B80C9",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                log in
              </button>
              <button
                onClick={onSignUp}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 50,
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                sign up free
              </button>
            </div>

            <p
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 11,
                textAlign: "center",
                marginTop: 16,
              }}
            >
              browse and confirm sightings without an account
            </p>
          </div>
        </div>

        {/* Right / Bottom — map preview */}
        <div
          className="wh-landing-right"
          style={{
            background: "#1A1628",
            minHeight: 320,
            position: "relative",
            overflow: "hidden",
            flex: 1,
          }}
        >
          {/* Fake road grid */}
          <div style={{ position: "absolute", inset: 0 }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "42%",
                width: 3,
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "38%",
                height: 3,
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "65%",
                height: 2,
                background: "rgba(255,255,255,0.04)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "70%",
                width: 2,
                background: "rgba(255,255,255,0.04)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "20%",
                width: 2,
                background: "rgba(255,255,255,0.04)",
              }}
            />
          </div>

          {/* Live badge */}
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(139,128,201,0.3)",
              border: "0.5px solid rgba(139,128,201,0.4)",
              borderRadius: 20,
              padding: "4px 12px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10B981",
              }}
            />
            <span
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              live
            </span>
          </div>

          {/* Fake pins */}
          {[
            {
              top: "20%",
              left: "30%",
              color: "#8B80C9",
              label: "stray · active",
            },
            {
              top: "45%",
              left: "55%",
              color: "#3B82F6",
              label: "rescue accepted",
            },
            { top: "25%", left: "72%", color: "#EF4444", label: "missing" },
            {
              top: "60%",
              left: "25%",
              color: "#9CA3AF",
              label: "stale",
              opacity: 0.5,
            },
            { top: "35%", left: "82%", color: "#10B981", label: "colony" },
          ].map((pin, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: pin.top,
                left: pin.left,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: pin.opacity ?? 1,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50% 50% 50% 0",
                  transform: "rotate(-45deg)",
                  background: pin.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ transform: "rotate(45deg)", fontSize: 14 }}>
                  🐱
                </span>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(4px)",
                  borderRadius: 6,
                  padding: "3px 8px",
                  marginTop: 4,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>
                  {pin.label}
                </span>
              </div>
            </div>
          ))}

          {/* Bottom stat bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "rgba(15,13,26,0.85)",
              backdropFilter: "blur(8px)",
              borderTop: "0.5px solid rgba(255,255,255,0.06)",
              padding: "14px 24px",
              display: "flex",
              gap: 24,
            }}
          >
            {[
              { num: "2s", label: "pin goes live" },
              { num: "0", label: "account to report" },
              { num: "100%", label: "free forever" },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  style={{ color: "#8B80C9", fontSize: 18, fontWeight: 700 }}
                >
                  {stat.num}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 10,
                    marginTop: 2,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: override to side by side */}
      <style>{`
        @media (min-width: 768px) {
          .wh-landing-wrap {
            flex-direction: row !important;
          }
          .wh-landing-left {
            flex: 0 0 45% !important;
            min-height: 100vh !important;
          }
          .wh-landing-right {
            flex: 1 !important;
            min-height: 100vh !important;
          }
        }
      `}</style>
    </div>
  );
}
