import { useEffect, useMemo, useRef, useState } from 'react';
import { rooms } from '../data/rooms.js';

const PAN_SENSITIVITY = 0.32;
const PAN_MAX_X_RATIO = 0.05;
const PAN_MAX_Y_RATIO = 0.045;
const PAN_IDLE_RETURN_DELAY = 140;
const PAN_IDLE_RETURN_EASING = 0.035;
const PAN_RENDER_SMOOTHING = 0.1;
const WHEEL_DELTA_LIMIT = 28;
const IDLE_DELAY_MS = 2600;
const IDLE_AMPLITUDE_X = 3.2;
const IDLE_AMPLITUDE_Y = 2.2;
const IDLE_SPEED = 0.00042;
const LAPTOP_EXPAND_DELAY_MS = 560;

const introContent = {
  title: 'Habitat',
  subtitle: 'A personal digital room interface',
  cta: 'Enter Room',
};

const panelConfig = {
  socialWall: {
    eyebrow: 'Content Hub',
    summary: 'Content hub for social updates, video, and shared moments.',
    actions: ['Feed', 'Video', 'Chat', 'Cards'],
  },
  musicCenter: {
    eyebrow: 'Media Control',
    summary: 'Media control for atmosphere, sound, and ambient playback.',
    actions: ['Prev', 'Play/Pause', 'Next'],
  },
  laptop: {
    eyebrow: 'Productivity Area',
    summary: 'Personal productivity space for tasks, notes, and communication.',
    actions: ['Notes', 'Tasks', 'Messages'],
  },
  telescope: {
    eyebrow: 'Discovery',
    summary: 'Discovery point for exploration and perspective-based experiences.',
    actions: ['Explore'],
  },
  doorPerson: {
    eyebrow: 'Identity Layer',
    summary: 'Identity layer for presence, profile, and room entry.',
    actions: ['Profile', 'Welcome'],
  },
  phone: {
    eyebrow: 'Communication',
    summary: 'Fast communication surface for personal updates and quick actions.',
    actions: ['Notifications', 'Messages', 'Calls'],
  },
  bookshelf: {
    eyebrow: 'Knowledge Space',
    summary: 'Knowledge space for saved content, learning, and reference.',
    actions: ['Library', 'Notes', 'Learning'],
  },
};

function ActivePanel({ room, hotspot, activeAction, onAction, onBack }) {
  if (!hotspot) {
    return (
      <aside className="room-panel room-panel--idle">
        <p className="room-panel__eyebrow">{room.title}</p>
        <h2>{room.subtitle}</h2>
        <p className="room-panel__description">
          A configurable interactive room system that adapts to different personalities without changing the product
          interaction model.
        </p>
      </aside>
    );
  }

  const config = panelConfig[hotspot.id];

  return (
    <aside className="room-panel">
      <div className="room-panel__header">
        <div>
          <p className="room-panel__eyebrow">{hotspot.type}</p>
          <h2>{hotspot.title}</h2>
        </div>
        <button type="button" className="room-panel__back" onClick={onBack}>
          Back to room
        </button>
      </div>

      <p className="room-panel__description">{hotspot.description}</p>

      <div className="room-panel__card">
        <p className="room-panel__eyebrow">{config.eyebrow}</p>
        <strong>{activeAction}</strong>
        <span>{config.summary}</span>
      </div>

      <div className="room-panel__actions">
        {config.actions.map((action) => (
          <button
            key={action}
            type="button"
            className={action === activeAction ? 'is-active' : ''}
            onClick={() => onAction(action)}
          >
            {action}
          </button>
        ))}
      </div>
    </aside>
  );
}

function WorkspaceOverlay({ onClose }) {
  return (
    <div className="workspace-overlay" role="dialog" aria-modal="true" aria-label="Workspace">
      <div className="workspace-overlay__chrome">
        <div>
          <p className="workspace-overlay__eyebrow">Workspace</p>
          <h2>Personal productivity space</h2>
        </div>
        <button type="button" className="workspace-overlay__close" onClick={onClose}>
          Back to Room
        </button>
      </div>

      <div className="workspace-overlay__grid">
        <article className="workspace-overlay__card">
          <p className="workspace-overlay__label">Notes</p>
          <strong>Capture ideas, meeting points, and next steps.</strong>
          <div className="workspace-overlay__list">
            <span>Investor follow-up: sharpen value story around room identity.</span>
            <span>Product note: keep media, workspace, and profile surfaces tightly connected.</span>
            <span>Design pass: preserve calm ambient motion without dashboard noise.</span>
          </div>
        </article>

        <article className="workspace-overlay__card">
          <p className="workspace-overlay__label">Tasks</p>
          <strong>Track priorities and move execution forward.</strong>
          <div className="workspace-overlay__checklist">
            <span>Refine hotspot storytelling across core objects.</span>
            <span>Review premium motion timing for room entry.</span>
            <span>Prepare concise investor walkthrough flow.</span>
          </div>
        </article>

        <article className="workspace-overlay__card">
          <p className="workspace-overlay__label">Messages</p>
          <strong>Stay connected with lightweight communication.</strong>
          <div className="workspace-overlay__messages">
            <span><strong>Design:</strong> Updated hover treatment feels cleaner and more intentional.</span>
            <span><strong>Product:</strong> Workspace mode now reads like a surface, not a modal.</span>
            <span><strong>Founder:</strong> Keep this flow minimal, immersive, and investor-friendly.</span>
          </div>
        </article>
      </div>
    </div>
  );
}

export function InteractiveRoom() {
  const roomRef = useRef(null);
  const rafRef = useRef(0);
  const laptopExpandTimeoutRef = useRef(0);
  const panRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const manualPanRef = useRef({ x: 0, y: 0 });
  const manualPanDisplayRef = useRef({ x: 0, y: 0 });
  const lastPanInputAtRef = useRef(0);
  const lastInteractionAtRef = useRef(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('creator');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [manualPan, setManualPan] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [hoveredId, setHoveredId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [activeAction, setActiveAction] = useState('');
  const [expandedObject, setExpandedObject] = useState(null);
  const [showHotspots, setShowHotspots] = useState(false);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0],
    [selectedRoomId],
  );

  const activeHotspot = useMemo(
    () => selectedRoom.hotspots.find((item) => item.id === activeId) ?? null,
    [activeId, selectedRoom.hotspots],
  );

  useEffect(() => () => window.clearTimeout(laptopExpandTimeoutRef.current), []);

  useEffect(() => {
    const node = roomRef.current;
    if (!node) {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const animate = () => {
      const now = performance.now();
      const idleTime = now - lastInteractionAtRef.current;
      const idleMotion =
        hasEntered && !activeHotspot && idleTime > IDLE_DELAY_MS
          ? {
              x: Math.sin(now * IDLE_SPEED) * IDLE_AMPLITUDE_X,
              y: Math.cos(now * IDLE_SPEED * 0.78) * IDLE_AMPLITUDE_Y,
            }
          : { x: 0, y: 0 };

      panRef.current.x += (targetRef.current.x - panRef.current.x) * 0.07;
      panRef.current.y += (targetRef.current.y - panRef.current.y) * 0.07;

      if (hasEntered && !activeHotspot && now - lastPanInputAtRef.current > PAN_IDLE_RETURN_DELAY) {
        const easedTarget = {
          x: Math.abs(manualPanRef.current.x) < 0.2 ? 0 : manualPanRef.current.x * (1 - PAN_IDLE_RETURN_EASING),
          y: Math.abs(manualPanRef.current.y) < 0.2 ? 0 : manualPanRef.current.y * (1 - PAN_IDLE_RETURN_EASING),
        };

        if (easedTarget.x !== manualPanRef.current.x || easedTarget.y !== manualPanRef.current.y) {
          manualPanRef.current = easedTarget;
          setManualPan(easedTarget);
        }
      }

      manualPanDisplayRef.current.x += (manualPanRef.current.x - manualPanDisplayRef.current.x) * PAN_RENDER_SMOOTHING;
      manualPanDisplayRef.current.y += (manualPanRef.current.y - manualPanDisplayRef.current.y) * PAN_RENDER_SMOOTHING;

      setPan({
        x: panRef.current.x + idleMotion.x,
        y: panRef.current.y + idleMotion.y,
      });
      rafRef.current = window.requestAnimationFrame(animate);
    };

    rafRef.current = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafRef.current);
  }, [activeHotspot, hasEntered]);

  useEffect(() => {
    if (!activeHotspot) {
      setActiveAction('');
      return;
    }

    setActiveAction(panelConfig[activeHotspot.id].actions[0]);
  }, [activeHotspot]);

  const updateManualPan = (nextPan) => {
    manualPanRef.current = nextPan;
    setManualPan(nextPan);
  };

  const markInteraction = () => {
    lastInteractionAtRef.current = performance.now();
  };

  const clearRoomState = () => {
    window.clearTimeout(laptopExpandTimeoutRef.current);
    setExpandedObject(null);
    setActiveId(null);
    setHoveredId(null);
    targetRef.current = { x: 0, y: 0 };
    panRef.current = { x: 0, y: 0 };
    lastPanInputAtRef.current = 0;
    updateManualPan({ x: 0, y: 0 });
  };

  const resetView = () => {
    markInteraction();
    clearRoomState();
  };

  const handleEnterRoom = () => {
    markInteraction();
    setHasEntered(true);
  };

  const handleRoomSwitch = (roomId) => {
    if (roomId === selectedRoomId) {
      return;
    }

    resetView();
    setSelectedRoomId(roomId);
  };

  const handleMouseMove = (event) => {
    if (!hasEntered || expandedObject) {
      return;
    }

    markInteraction();

    if (activeHotspot) {
      targetRef.current = { x: 0, y: 0 };
      return;
    }

    const rect = roomRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const normalizedX = (event.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (event.clientY - rect.top) / rect.height - 0.5;

    targetRef.current = {
      x: normalizedX * -18,
      y: normalizedY * -14,
    };
  };

  const clampManualPan = (nextPan, size) => {
    const maxX = Math.max(26, size.width * PAN_MAX_X_RATIO);
    const maxY = Math.max(22, size.height * PAN_MAX_Y_RATIO);

    return {
      x: Math.min(maxX, Math.max(-maxX, nextPan.x)),
      y: Math.min(maxY, Math.max(-maxY, nextPan.y)),
    };
  };

  const handleWheel = (event) => {
    event.preventDefault();

    if (!hasEntered || expandedObject) {
      return;
    }

    markInteraction();

    if (activeHotspot) {
      return;
    }

    lastPanInputAtRef.current = performance.now();

    const limitedDeltaX = Math.max(-WHEEL_DELTA_LIMIT, Math.min(WHEEL_DELTA_LIMIT, event.deltaX));
    const limitedDeltaY = Math.max(-WHEEL_DELTA_LIMIT, Math.min(WHEEL_DELTA_LIMIT, event.deltaY));

    updateManualPan(
      clampManualPan(
        {
          x: manualPanRef.current.x - limitedDeltaX * PAN_SENSITIVITY,
          y: manualPanRef.current.y - limitedDeltaY * PAN_SENSITIVITY,
        },
        viewport,
      ),
    );
  };

  const sceneTransform = useMemo(() => {
    if (activeHotspot && viewport.width && viewport.height) {
      const focusX = (activeHotspot.focusX / 100) * viewport.width;
      const focusY = (activeHotspot.focusY / 100) * viewport.height;
      const translateX = viewport.width / 2 - focusX * activeHotspot.zoom;
      const translateY = viewport.height / 2 - focusY * activeHotspot.zoom;

      return `translate3d(${translateX}px, ${translateY}px, 0) scale(${activeHotspot.zoom})`;
    }

    const combinedX = pan.x + manualPanDisplayRef.current.x;
    const combinedY = pan.y + manualPanDisplayRef.current.y;

    return `translate3d(${combinedX}px, ${combinedY}px, 0) scale(1)`;
  }, [activeHotspot, pan.x, pan.y, viewport.height, viewport.width, manualPan.x, manualPan.y]);

  const openHotspot = (spotId) => {
    markInteraction();
    window.clearTimeout(laptopExpandTimeoutRef.current);
    setExpandedObject(null);
    setActiveId(spotId);

    if (spotId === 'laptop') {
      laptopExpandTimeoutRef.current = window.setTimeout(() => {
        setExpandedObject('laptop');
      }, LAPTOP_EXPAND_DELAY_MS);
    }
  };

  const closeExpandedObject = () => {
    markInteraction();
    window.clearTimeout(laptopExpandTimeoutRef.current);
    setExpandedObject(null);
    setHoveredId(null);
  };

  return (
    <main
      className={`room-demo ${hasEntered ? 'is-entered' : 'is-intro'} ${expandedObject ? 'has-expanded-object' : ''}`}
    >
      <section className="room-demo__stage">
        <div className="room-demo__intro" aria-hidden={hasEntered}>
          <div className="room-demo__intro-card">
            <p className="room-demo__intro-kicker">Spatial Product Demo</p>
            <h1>{introContent.title}</h1>
            <p>{introContent.subtitle}</p>
            <button type="button" className="room-demo__enter" onClick={handleEnterRoom}>
              {introContent.cta}
            </button>
          </div>
        </div>

        <div className="room-demo__shell">
          <div className="room-demo__chrome">
            <div>
              <p className="room-demo__kicker">Habitat</p>
              <p className="room-demo__lede">{selectedRoom.subtitle}</p>
            </div>

            <div className="room-switcher" role="tablist" aria-label="Room switcher">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  className={`room-switcher__button ${room.id === selectedRoomId ? 'is-active' : ''}`}
                  onClick={() => handleRoomSwitch(room.id)}
                >
                  {room.title}
                </button>
              ))}
            </div>
          </div>

          <div className="room-demo__layout">
            <div className="room-demo__viewport" ref={roomRef}>
              <div
                className={`room-demo__scene ${activeHotspot ? 'is-focused' : ''} ${expandedObject ? 'is-dimmed' : ''}`}
                style={{ transform: sceneTransform }}
                onMouseMove={handleMouseMove}
                onWheel={handleWheel}
                onMouseLeave={() => {
                  targetRef.current = { x: 0, y: 0 };
                }}
              >
                <img className="room-demo__image" src={selectedRoom.image} alt={selectedRoom.title} draggable={false} />

                <div className="room-demo__glow room-demo__glow--left" />
                <div className="room-demo__glow room-demo__glow--right" />

                {selectedRoom.hotspots.map((spot) => {
                  const isHovered = hoveredId === spot.id;
                  const isActive = activeId === spot.id;
                  const isLaptop = spot.id === 'laptop';

                  return (
                    <button
                      key={`${selectedRoom.id}-${spot.id}`}
                      type="button"
                      className={`room-demo__hotspot room-hotspot ${isLaptop ? 'is-laptop' : ''} ${showHotspots ? 'is-debug-visible' : ''} ${isHovered ? 'is-hovered' : ''} ${isActive ? 'is-active' : ''}`}
                      style={{
                        left: `${spot.x}%`,
                        top: `${spot.y}%`,
                        width: `${spot.width}%`,
                        height: `${spot.height}%`,
                      }}
                      onMouseEnter={() => {
                        markInteraction();
                        setHoveredId(spot.id);
                      }}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => openHotspot(spot.id)}
                      aria-label={spot.title}
                      disabled={Boolean(expandedObject)}
                    >
                      <span className="room-demo__hotspot-hit" />
                      <span className="room-demo__hotspot-outline room-hotspot-outline" />
                      <span className="room-demo__hotspot-ring" />
                      <span className="room-demo__hotspot-label">{spot.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="room-demo__hud">
                {activeHotspot ? (
                  <>
                    <span>Focused object</span>
                    <span>Use Back to return to overview</span>
                  </>
                ) : (
                  <>
                    <span>{selectedRoom.title}</span>
                    <span>{selectedRoom.subtitle}</span>
                  </>
                )}
                <button
                  type="button"
                  className="room-demo__debug-toggle"
                  onClick={() => setShowHotspots((value) => !value)}
                >
                  {showHotspots ? 'Hide Hotspots' : 'Show Hotspots'}
                </button>
              </div>

              {activeHotspot ? (
                <button type="button" className="room-demo__floating-back" onClick={resetView}>
                  Back to room
                </button>
              ) : null}

              {expandedObject === 'laptop' ? <WorkspaceOverlay onClose={closeExpandedObject} /> : null}
            </div>

            <ActivePanel
              room={selectedRoom}
              hotspot={activeHotspot}
              activeAction={activeAction}
              onAction={setActiveAction}
              onBack={resetView}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
