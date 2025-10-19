import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  ProgressBar,
  Tabs,
  Tab,
  Pagination,
} from "react-bootstrap";
import {
  Trophy,
  TrendingUp,
  LogIn,
  Gamepad,
  Users,
  Award,
} from "lucide-react";
import { useTheme } from "../Context/ThemeContext";
import API from "../api";

const PAGE_SIZE = 10;

const Profile = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { color, theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState({
    name: "",
    photo: "",
    email: "",
    level: 1,
  });

  const [profile, setProfile] = useState({
    points: 0,
    totalLogins: 0,
    gamesPlayed: 0,
    chatMessages: 0,
    achievements: [],
    activities: [],
  });

  const [todayCounts, setTodayCounts] = useState({
    logins: 0,
    games: 0,
    chats: 0,
    points: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/auth/profile");
        const p = res.data || {};
        setProfile((prev) => ({ ...prev, ...p }));
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    computeTodayCounts(profile.activities || []);
  }, [profile.activities]);

  const isToday = (iso) => {
    if (!iso) return false;
    const today = new Date();
    const d = new Date(iso);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const computeTodayCounts = (activities = []) => {
    let logins = 0,
      games = 0,
      chats = 0,
      points = 0;
    activities.forEach((a) => {
      if (!a) return;
      if (isToday(a.time)) {
        points += Number(a.points || 0);
        if (a.type === "login") logins++;
        if (a.type === "game") games++;
        if (a.type === "chat") chats++;
      }
    });

    setTodayCounts({ logins, games, chats, points });
  };

  const overallActivities = profile.activities ? [...profile.activities] : [];
  const todayActivities = overallActivities.filter((a) => isToday(a.time));

  const totalPages = Math.max(1, Math.ceil(overallActivities.length / PAGE_SIZE));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [overallActivities.length, totalPages, currentPage]);

  const pagedOverall = overallActivities
    .slice()
    .reverse()
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const colorMap = {
    blue: "#3b82f6",
    purple: "#8b5cf6",
    green: "#22c55e",
    yellow: "#eab308",
    red: "#ef4444",
    orange: "#f97316",
  };
  const accent = colorMap[color] || "#3b82f6";

  const totalPoints = profile.points || 0;

  const getBadge = (points) => {
    if (points >= 3000)
      return { title: "Gold Badge", color: "#FFD700", emoji: "🥇", level: 4 };
    if (points >= 2000)
      return { title: "Silver Badge", color: "#C0C0C0", emoji: "🥈", level: 3 };
    if (points >= 1000)
      return { title: "Bronze Badge", color: "#CD7F32", emoji: "🥉", level: 2 };
    return null;
  };

  const badge = getBadge(totalPoints);

  const nextLevelPoints = badge
    ? badge.level === 2
      ? 2000
      : badge.level === 3
      ? 3000
      : 3000
    : 1000;

  const progress = badge
    ? badge.level === 4
      ? 100
      : Math.min(
          Math.round(((totalPoints % nextLevelPoints) / nextLevelPoints) * 100),
          100
        )
    : Math.min(Math.round((totalPoints / 1000) * 100), 100);

  return (
    <Container
      fluid
      className={`py-5 min-vh-100 ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}
    >
      <Card className={`mb-4 shadow-sm ${isDark ? "bg-black text-light" : "bg-white text-dark"}`}>
        <Card.Body>
          <Row className="align-items-center text-center text-md-start">
            <Col md={4} className="d-flex flex-column flex-md-row align-items-center justify-content-center justify-content-md-start">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt="Profile"
                  className="rounded-circle mb-3 mb-md-0"
                  style={{
                    width: 90,
                    height: 90,
                    objectFit: "cover",
                    border: `3px solid ${accent}`,
                  }}
                />
              ) : (
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3 mb-md-0"
                  style={{
                    width: 90,
                    height: 90,
                    fontSize: "2rem",
                    background: accent,
                    color: "#fff",
                    border: `3px solid ${isDark ? "#444" : "#ddd"}`,
                  }}
                >
                  {user.name ? user.name[0] : "?"}
                </div>
              )}

              <div className="ms-md-3 text-center text-md-start">
                <h3 className="fw-bold mb-1">{user.name || "Unnamed User"}</h3>
                <p className={`mb-1 ${isDark ? "text-light-emphasis" : "text-muted"}`}>{user.email}</p>

                {badge && (
                  <div className="d-flex justify-content-center justify-content-md-start align-items-center gap-2 mb-2">
                    <Badge style={{ background: badge.color, fontSize: "0.9rem", padding: "0.45rem 0.7rem" }}>
                      {badge.emoji} {badge.title}
                    </Badge>
                  </div>
                )}

                <Badge style={{ background: accent }}>Level {badge ? badge.level : 1}</Badge>
                <Badge bg="success" className="ms-2">Active</Badge>
              </div>
            </Col>

            {[
              { label: "Connections", value: todayCounts.logins },
              { label: "Games Played", value: todayCounts.games },
              { label: "Interactions", value: todayCounts.chats },
              { label: "Points Today", value: todayCounts.points },
            ].map((item, i) => (
              <Col xs={6} md={2} className="text-center mt-3 mt-md-0" key={i}>
                <h4 style={{ color: accent }}>{item.value || 0}</h4>
                <p className="mb-1" style={{ color: isDark ? "#cbd5e1" : "#6c757d", fontWeight: 500 }}>{item.label}</p>
              </Col>
            ))}
          </Row>

          <Row className="mt-4">
            <Col>
              {badge && badge.level === 4 ? (
                <div className="text-center mt-3">
                  <h5 style={{ color: "#FFD700" }}>🏆 Master Achieved — Maximum Level Reached!</h5>
                  <ProgressBar now={100} variant="warning" className="mt-2" style={{ height: "10px" }} />
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between small">
                    <span>Progress to Level {badge ? badge.level + 1 : 2}</span>
                    <span>{totalPoints}/{nextLevelPoints} pts</span>
                  </div>
                  <ProgressBar now={progress} className="mt-2" style={{ backgroundColor: isDark ? "#333" : "#e9ecef", height: "10px" }} />
                </>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || "overview")} className="mb-3" justify>
        <Tab eventKey="overview" title="Overview" />
        <Tab eventKey="activity" title="Activity" />
      </Tabs>

      {activeTab === "overview" && (
        <Row>
          <Col md={6}>
            <Card className={`mb-4 ${isDark ? "bg-secondary text-light" : "bg-white text-dark"} shadow-sm`}>
              <Card.Header className={`fw-bold ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
                <Trophy size={18} className="me-2" style={{ color: accent }} /> Achievements
              </Card.Header>
              <Card.Body>
                {badge ? (
                  <div className="d-flex flex-column flex-sm-row align-items-sm-center align-items-start mb-3 p-3 rounded" style={{ background: isDark ? "#1e293b" : "#f1f3f5", color: isDark ? "#f8fafc" : "#212529", gap: "0.5rem" }}>
                    <div className="d-flex align-items-center flex-grow-1">
                      <Award className="me-3" size={28} style={{ color: badge.color }} />
                      <div>
                        <h6 className="mb-0">{badge.emoji} {badge.title}</h6>
                        <p className="small mb-0" style={{ color: isDark ? "#94a3b8" : "#6c757d" }}>Earned for reaching {totalPoints} points!</p>
                      </div>
                    </div>
                    <Badge className="align-self-start align-self-sm-center" style={{ background: badge.color, fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}>
                      {totalPoints} pts
                    </Badge>
                  </div>
                ) : (
                  <p className="text-center m-0 py-3 fw-semibold" style={{ color: isDark ? "#9ca3af" : "#6c757d" }}>No recent achievements yet.</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className={`mb-4 ${isDark ? "bg-secondary text-light" : "bg-white text-dark"} shadow-sm`}>
              <Card.Header className={`fw-bold ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
                <TrendingUp size={18} className="me-2" style={{ color: accent }} /> Activity Summary
              </Card.Header>
              <Card.Body>
                <p className="mb-2"><LogIn size={16} className="me-2" /> Connections: <strong>{profile.totalLogins}</strong> <span style={{ color: accent }}>({todayCounts.logins} today)</span></p>
                <p className="mb-2"><Gamepad size={16} className="me-2" /> Games Played: <strong>{profile.gamesPlayed}</strong> <span style={{ color: accent }}>({todayCounts.games} today)</span></p>
                <p className="mb-0"><Users size={16} className="me-2" /> Interactions: <strong>{profile.chatMessages}</strong> <span style={{ color: accent }}>({todayCounts.chats} today)</span></p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === "activity" && (
        <Row>
          <Col>
            <Card className={`mb-4 ${isDark ? "bg-secondary text-light" : "bg-white text-dark"} shadow-sm`}>
              <Card.Body>
                <Tabs defaultActiveKey="today" id="activity-subtabs" className="mb-3">
                  <Tab eventKey="today" title={`Today (${todayActivities.length})`}>
                    {todayActivities.length > 0 ? (
                      todayActivities.slice().reverse().map((a, idx) => (
                        <div key={idx} className="d-flex align-items-center mb-3">
                          <div style={{ width: 40 }}>{a.type === "game" ? "🎮" : a.type === "chat" ? "💬" : "🔑"}</div>
                          <div>
                            <h6 className="mb-0">{a.title}</h6>
                            <p className="small text-muted mb-0">{new Date(a.time).toLocaleString()}</p>
                          </div>
                          {a.points > 0 && <Badge style={{ background: accent }} className="ms-auto">+{a.points} pts</Badge>}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">No activity today.</p>
                    )}
                  </Tab>

                  <Tab eventKey="overall" title={`Overall (${overallActivities.length})`}>
                    {overallActivities.length === 0 ? (
                      <p className="text-muted">No activity yet.</p>
                    ) : (
                      <>
                        {pagedOverall.map((a, idx) => (
                          <div key={idx} className="d-flex align-items-center mb-3">
                            <div style={{ width: 40 }}>{a.type === "game" ? "🎮" : a.type === "chat" ? "💬" : "🔑"}</div>
                            <div>
                              <h6 className="mb-0">{a.title}</h6>
                              <p className="small text-muted mb-0">{new Date(a.time).toLocaleString()}</p>
                            </div>
                            {a.points > 0 && <Badge style={{ background: accent }} className="ms-auto">+{a.points} pts</Badge>}
                          </div>
                        ))}

                        <div className="d-flex justify-content-center mt-3">
                          <Pagination size="sm">
                            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                            <Pagination.Prev onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} />

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                              .map((p) => (
                                <Pagination.Item key={p} active={p === currentPage} onClick={() => setCurrentPage(p)}>{p}</Pagination.Item>
                              ))}

                            <Pagination.Next onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                          </Pagination>
                        </div>
                      </>
                    )}
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Profile;