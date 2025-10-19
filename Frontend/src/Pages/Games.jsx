import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Star, Play, Info } from "lucide-react";
import { Offcanvas, Badge, Button, Collapse } from "react-bootstrap";
import { useTheme } from "../Context/ThemeContext";
import API from "../api";

const Games = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showDetails, setShowDetails] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const [showHowTo, setShowHowTo] = useState(false);

  const { color, theme } = useTheme();
  const isDark = theme === "dark";

  // Dynamic color palette
  const colorMap = {
    blue: "#3b82f6",
    purple: "#8b5cf6",
    green: "#22c55e",
    yellow: "#eab308",
    red: "#ef4444",
    orange: "#f97316",
    pink: "#ec4899",
    cyan: "#06b6d4",
  };

  const chosenColor = colorMap[color] || color || "#3b82f6";
  const lighterColor = `${chosenColor}33`; // 20% opacity hex suffix

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get("/games/all");
        setGames(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching games:", err);
        setError("Unable to load games from server.");
        setGames([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const categories = ["All", ...Array.from(new Set(games.map((g) => g.category).filter(Boolean)))];

  const handleShow = (game) => {
    setActiveGame(game);
    setShowHowTo(false);
    setShowDetails(true);
  };
  const handleClose = () => setShowDetails(false);

  const filteredGames = games.filter((game) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (game.title && game.title.toLowerCase().includes(term)) ||
      (game.description && game.description.toLowerCase().includes(term));
    const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const parseSteps = (text) => {
    if (!text) return [];
    return text
      .split(".")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const steps = parseSteps(activeGame?.howTo);

  return (
    <div
      className="min-vh-100"
      style={{
        backgroundColor: isDark ? "#0b1220" : "#f9fafb",
        color: isDark ? "#f8f9fa" : "#111827",
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      <main className="container py-5">
        <div className="text-center mb-5">
          <h1
            className="fw-bold display-5 mb-3"
            style={{ color: chosenColor, transition: "color 0.3s" }}
          >
            🎮 Cognitive Development Games
          </h1>
          <p className="fs-5" color={isDark ? "#f8f9fa" : "#1f2937"} >
            Discover engaging games designed to sharpen memory, focus, and logic
          </p>
        </div>

        {/* Search + Category Filters */}
        <div className="row justify-content-center mb-4">
          <div className="col-md-8 d-flex flex-column gap-3 align-items-center">
            <div className="w-100">
              <div
                className="input-group shadow-sm rounded overflow-hidden"
                style={{
                  backgroundColor: isDark ? "#1f2937" : "#fff",
                  border: `1px solid ${lighterColor}`,
                }}
              >
                <span
                  className="input-group-text border-0"
                  style={{
                    backgroundColor: "transparent",
                    color: chosenColor,
                  }}
                >
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-control border-0"
                  placeholder="Search games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    backgroundColor: "transparent",
                    color: isDark ?"#fff" : "#000" ,
                  }}
                />
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className="btn btn-sm fw-semibold rounded-pill"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor: selectedCategory === cat ? chosenColor : "transparent",
                    color: selectedCategory === cat ? "#fff" : chosenColor,
                    border: `1.5px solid ${chosenColor}`,
                    transition: "all 0.3s",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading, Error, or Game Cards */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border" role="status" style={{ color: chosenColor }} />
            <p className="mt-3">Loading games...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-5">
            <div className="display-4 mb-3">🎮</div>
            <h5 className="fw-bold">{error}</h5>
            <p className="text-muted">Please check your backend or try again later.</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {filteredGames.length === 0 ? (
              <div className="text-center py-5">
                <div className="display-4 mb-3">🎮</div>
                <h5 className="fw-bold">No games found</h5>
                <p className="text-muted">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="row g-4">
                {filteredGames.map((game, idx) => {
                  const id = game.id ?? game._id ?? String(idx + 1);
                  return (
                    <div key={id} className="col-md-6 col-lg-4">
                      <div
                        className="card h-100 border-0 shadow-sm rounded-4"
                        onClick={() => handleShow(game)}
                        style={{
                          backgroundColor: isDark ? "#1f2937" : "#fff",
                          color: isDark ? "#f8f9fa" : "#111827",
                          cursor: "pointer",
                          transition: "transform 0.3s, box-shadow 0.3s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-6px)";
                          e.currentTarget.style.boxShadow = `0 8px 20px ${lighterColor}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div className="card-body text-center d-flex flex-column">
                          <div className="display-3 mb-3">
                            {game.imageurl ? (
                              <img
                                src={game.imageurl}
                                alt={game.title}
                                style={{
                                  width: 80,
                                  height: 80,
                                  objectFit: "cover",
                                  borderRadius: 12,
                                  border: `2px solid ${lighterColor}`,
                                }}
                              />
                            ) : (
                              "🎮"
                            )}
                          </div>
                          <h5 className="fw-bold mb-1">{game.title}</h5>
                          <Badge
                            className="mb-2"
                            style={{
                              backgroundColor: chosenColor,
                              borderRadius: "12px",
                            }}
                          >
                            {game.category || "General"}
                          </Badge>
                          <p className="small flex-grow-1 " style={{ color: isDark ? "#fff" : "#000" }}>
                            {game.description ? `${game.description.substring(0, 80)}...` : ""}
                          </p>
                          <div className="d-flex justify-content-center align-items-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className="me-1"
                                style={{
                                  color:
                                    i < Math.round(game.rating || 0)
                                      ? "#facc15"
                                      : isDark
                                      ? "#6b7280"
                                      : "#d1d5db",
                                }}
                              />
                            ))}
                          </div>
                          <span className="small">{game.duration || ""}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Offcanvas for Game Details */}
        <Offcanvas
          show={showDetails}
          onHide={handleClose}
          placement="end"
          className="shadow-lg"
          style={{
            backgroundColor: isDark ? "#111827" : "#fff",
            color: isDark ? "#f8f9fa" : "#111827",
          }}
        >
          <Offcanvas.Header
            closeButton
            style={{
              background: chosenColor,
              color: "#fff",
            }}
          >
            <Offcanvas.Title className="fw-bold">{activeGame?.title}</Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body>
            {activeGame && (
              <div>
                <div className="text-center mb-3">
                  {activeGame.imageurl ? (
                    <img
                      src={activeGame.imageurl}
                      alt={activeGame.title}
                      style={{
                        width: 90,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 12,
                        border: `2px solid ${lighterColor}`,
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 48 }}>🎮</div>
                  )}
                </div>

                <p>{activeGame.description}</p>
                <p>
                  <strong>Category:</strong> {activeGame.category || "General"}
                </p>
                <p>
                  <strong>Difficulty:</strong> {activeGame.difficulty || "N/A"}
                </p>
                <p>
                  <strong>Duration:</strong> {activeGame.duration || "N/A"}
                </p>

                <div className="d-flex mb-3 align-items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      style={{
                        color:
                          i < Math.round(activeGame.rating || 0)
                            ? "#facc15"
                            : isDark
                            ? "#6b7280"
                            : "#d1d5db",
                      }}
                    />
                  ))}
                  <span className="ms-2 fw-bold">{activeGame.rating ?? "0"}</span>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">How to Play</h6>
                    <Button
                      size="sm"
                      onClick={() => setShowHowTo((s) => !s)}
                      style={{
                        backgroundColor: "transparent",
                        border: `1px solid ${chosenColor}`,
                        color: chosenColor,
                      }}
                    >
                      <Info size={14} className="me-1 text-white" /> {showHowTo ? "Hide" : "Show"}Info
                    </Button>
                  </div>

                  <Collapse in={showHowTo}>
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        background: isDark ? "#1f2937" : "#f8f9fa",
                        padding: "0.75rem",
                        borderRadius: 6,
                      }}
                    >
                      {steps.length === 0 ? (
                        <div className="text-muted">No how-to steps available.</div>
                      ) : (
                        <ol style={{ paddingLeft: 18, margin: 0 }}>
                          {steps.map((step, i) => (
                            <li key={i} style={{ marginBottom: 8 }}>
                              {step}.
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </Collapse>
                </div>

                <Link
                  to={`/play/${activeGame.id ?? activeGame._id}`}
                  state={{
                    gameInfo: { ...activeGame, startTime: new Date().toISOString() },
                  }}
                  className="btn w-100 rounded-pill fw-semibold mt-3"
                  style={{
                    background: chosenColor,
                    color: "#fff",
                    border: `2px solid ${chosenColor}`,
                    transition: "0.3s",
                  }}
                >
                  <Play size={18} className="me-2" /> Play Now
                </Link>
              </div>
            )}
          </Offcanvas.Body>
        </Offcanvas>
      </main>
    </div>
  );
};

export default Games;