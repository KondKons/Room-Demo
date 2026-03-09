import { useMemo, useState } from "react";

const hotspots = [
  {
    id: "socialWall",
    title: "Social Wall",
    description: "Центр социального контента, видео и карточек.",
    x: 22,
    y: 21,
    width: 47,
    height: 32,
    focusX: 46,
    focusY: 34,
    zoom: 1.75,
    type: "wall",
  },
  {
    id: "musicCenter",
    title: "Music Center",
    description: "Управление музыкой и атмосферой комнаты.",
    x: 54,
    y: 57,
    width: 22,
    height: 15,
    focusX: 64,
    focusY: 61,
    zoom: 2.15,
    type: "music",
  },
  {
    id: "laptop",
    title: "Workspace",
    description: "Рабочее пространство пользователя: заметки, задачи, сообщения.",
    x: 31,
    y: 63,
    width: 24,
    height: 18,
    focusX: 42,
    focusY: 70,
    zoom: 2.05,
    type: "workspace",
  },
  {
    id: "telescope",
    title: "Telescope",
    description: "Точка исследования и наблюдения.",
    x: 2,
    y: 39,
    width: 16,
    height: 28,
    focusX: 12,
    focusY: 49,
    zoom: 2.2,
    type: "explore",
  },
  {
    id: "doorPerson",
    title: "Profile",
    description: "Вход в персональный профиль и приветственный сценарий.",
    x: 77,
    y: 21,
    width: 17,
    height: 56,
    focusX: 85,
    focusY: 45,
    zoom: 1.9,
    type: "profile",
  },
];

const buttonStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
};

function panelContent(active, playing, setPlaying) {
  if (!active) return null;

  if (active.type === "music") {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)" }}>
          Now playing: Habitat Ambient Session
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={buttonStyle}>Prev</button>
          <button
            style={{ ...buttonStyle, background: "#fff", color: "#111" }}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button style={buttonStyle}>Next</button>
        </div>
      </div>
    );
  }

  if (active.type === "wall") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button style={buttonStyle}>Feed</button>
        <button style={buttonStyle}>Video</button>
        <button style={buttonStyle}>Chat</button>
        <button style={buttonStyle}>Cards</button>
      </div>
    );
  }

  if (active.type === "workspace") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button style={buttonStyle}>Notes</button>
        <button style={buttonStyle}>Tasks</button>
        <button style={buttonStyle}>Messages</button>
      </div>
    );
  }

  if (active.type === "explore") {
    return (
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)" }}>
        Explore mode for discovery and panoramic scenes.
      </div>
    );
  }

  return (
    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)" }}>
      Welcome back. This object can open profile and room entry actions.
    </div>
  );
}

export default function InteractiveRoom() {
  const [hovered, setHovered] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });

  const active = useMemo(
    () => hotspots.find((item) => item.id === activeId) ?? null,
    [activeId]
  );

  const transform = active
    ? `scale(${active.zoom}) translate(${-active.focusX + 50}%, ${-active.focusY + 50}%)`
    : `scale(1.06) translate(${(pointer.x - 0.5) * -2.2}%, ${(pointer.y - 0.5) * -2.2}%)`;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1a2233 0%, #0b0f17 55%, #06080d 100%)",
        color: "#fff",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Investor demo
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>Interactive Room</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.72)" }}>
            Hover and click objects to explore the room.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.45fr) 360px",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div
            onMouseMove={(e) => {
              if (active) return;
              const rect = e.currentTarget.getBoundingClientRect();
              setPointer({
                x: (e.clientX - rect.left) / rect.width,
                y: (e.clientY - rect.top) / rect.height,
              });
            }}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              overflow: "hidden",
              borderRadius: 28,
              background: "#111",
              boxShadow: "0 20px 80px rgba(0,0,0,0.45)",
            }}
          >
            <img
              src="/room.jpg"
              alt="Interactive room"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform,
                transformOrigin: "center center",
                transition: "transform 700ms cubic-bezier(.2,.8,.2,1)",
                userSelect: "none",
                pointerEvents: "none",
              }}
              draggable={false}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.22), rgba(0,0,0,0.04))",
              }}
            />

            {hotspots.map((spot) => {
              const isHovered = hovered === spot.id;
              const isActive = activeId === spot.id;

              return (
                <button
                  key={spot.id}
                  onMouseEnter={() => setHovered(spot.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setActiveId(spot.id)}
                  style={{
                    position: "absolute",
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    width: `${spot.width}%`,
                    height: `${spot.height}%`,
                    borderRadius: 24,
                    border: isActive
                      ? "1px solid rgba(125, 220, 255, 0.9)"
                      : "1px solid transparent",
                    background: isActive
                      ? "rgba(80,180,255,0.12)"
                      : isHovered
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                    boxShadow: isActive
                      ? "0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(108,211,255,0.55), inset 0 0 24px rgba(108,211,255,0.12)"
                      : isHovered
                        ? "0 0 24px rgba(255,255,255,0.28), inset 0 0 16px rgba(255,255,255,0.05)"
                        : "none",
                    cursor: "pointer",
                    transition: "all 220ms ease",
                  }}
                >
                  {(isHovered || isActive) && (
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.48)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.12)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {spot.title}
                    </span>
                  )}
                </button>
              );
            })}

            {active && (
              <button
                onClick={() => setActiveId(null)}
                style={{
                  position: "absolute",
                  right: 18,
                  bottom: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  borderRadius: 14,
                  padding: "12px 16px",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                }}
              >
                Back to room
              </button>
            )}
          </div>

          <div
            style={{
              minHeight: 240,
              borderRadius: 28,
              padding: 20,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
              backdropFilter: "blur(14px)",
            }}
          >
            {active ? (
              <>
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.45)",
                    marginBottom: 8,
                  }}
                >
                  Active object
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 10 }}>
                  {active.title}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.72)",
                    marginBottom: 18,
                  }}
                >
                  {active.description}
                </div>
                {panelContent(active, playing, setPlaying)}
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.45)",
                    marginBottom: 8,
                  }}
                >
                  Scene status
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>
                  Room overview
                </div>
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.72)",
                  }}
                >
                  This demo shows one personal interactive room. Each object acts as
                  an entry point into a different product function.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}