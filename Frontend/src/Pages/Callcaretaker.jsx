// ...existing code...
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../Context/ThemeContext";
import API from "../api";
import "../App.css";

const CallCaretaker = () => {
  const [caretakers, setCaretakers] = useState([]);
  const navigate = useNavigate();
  const { color } = useTheme();

  useEffect(() => {
    API.get("/caretaker").then((res) => {
      const data = res.data || [];
      setCaretakers(data);
    });
  }, []);

  const colorMap = {
    blue: "#3b82f6",
    purple: "#8b5cf6",
    green: "#22c55e",
    yellow: "#eab308",
    red: "#ef4444",
    orange: "#f97316",
  };
  const accent = colorMap[color] || "#3b82f6";

  // helper to interpret availability from different shapes
  const isAvailable = (caretaker) => {
    if (!caretaker) return false;
    // prefer explicit boolean field
    if (typeof caretaker.available === "boolean") return caretaker.available;
    if (typeof caretaker.isActive === "boolean") return caretaker.isActive;
    // check status string (e.g. "Available", "available")
    const status = String(caretaker.status || caretaker.state || "").toLowerCase();
    return status === "available" || status === "online" || status === "active";
  };

  // ✅ Voice Call handler
  const handleVoiceCall = async (caretaker) => {
    if (!isAvailable(caretaker)) return;

    // Open dialer
    window.location.href = `tel:${caretaker.phone}`;

    // Log call
    try {
      await API.post("/stats/call", { caretakerId: caretaker._id });
      console.log("Call logged successfully");
    } catch (err) {
      console.error("Failed to log call activity:", err);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(180deg, #fff 60%, #f6add6ff 100%)",
          position: "relative",
          padding: "80px 0",
        }}
      >
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 className="fw-bold mb-3" style={{ color: "#be123c" }}>
                Connect with <br /> Your Caretaker
              </h1>
              <p className="text-muted mb-4">
                Get personalized support from our experienced team of specialists
              </p>
              <Button
                variant="danger"
                size="lg"
                style={{ background: "#dc2626", border: "none" }}
                onClick={() => {
                  const emergencyNumber = "9842578618" || "9787156029";
                  window.location.href = `tel:${emergencyNumber}`;
                }}
              >
                🚨 Emergency Call
              </Button>
            </Col>

            <Col md={6} className="text-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/2966/2966486.png"
                alt="Support Kit"
                className="img-fluid"
                style={{ maxHeight: "280px" }}
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Caretaker List */}
      <Container className="my-5">
        <Row>
          {caretakers.map((caretaker) => (
            <Col md={4} key={caretaker._id ?? caretaker.id} className="mb-4">
              <Card
                className={`shadow-sm h-100 rounded-4 border-0 ${
                  !isAvailable(caretaker) ? "opacity-75" : ""
                }`}
              >
                <Card.Body className="text-center">
                  <div
                    className="rounded-circle text-white mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: 70,
                      height: 70,
                      fontSize: 20,
                      background: accent,
                    }}
                  >
                    {caretaker.initials ||
                      caretaker.name?.charAt(0)?.toUpperCase() ||
                      "?"}
                  </div>

                  <Card.Title>{caretaker.name}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {caretaker.role}
                  </Card.Subtitle>

                  <div className="mt-3 text-start">
                    <p>
                      <strong>Experience:</strong> {caretaker.experience}
                    </p>
                    <p>
                      <strong>Rating:</strong> ⭐ {caretaker.rating}
                    </p>
                    <p>
                      <strong>Phone:</strong> 📞 {caretaker.phone}
                    </p>
                    <p>
                      <strong>Specialties:</strong>
                    </p>
                    <ul className="small">
                      {caretaker.specialties?.map((s, idx) => (
                        <li key={s ?? idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 📞 Voice Call */}
                  <Button
                    className="w-100 mt-2"
                    style={{
                      background: isAvailable(caretaker) ? accent : "#ccc",
                      color: isAvailable(caretaker) ? "white" : "#666",
                      border: "none",
                      opacity: isAvailable(caretaker) ? 1 : 0.6,
                      cursor: isAvailable(caretaker) ? "pointer" : "not-allowed",
                    }}
                    onClick={() =>
                      isAvailable(caretaker) && handleVoiceCall(caretaker)
                    }
                    disabled={!isAvailable(caretaker)}
                  >
                    📞 Voice Call
                  </Button>

                  {/* 💬 Message */}
                  <Button
                    className="w-100 mt-2"
                    variant="outline-secondary"
                    onClick={() =>
                      navigate("/chat", {
                        state: {
                          caretakerId: caretaker._id,
                          caretakerName: caretaker.name,
                        },
                      })
                    }
                  >
                    💬 Message
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default CallCaretaker;
// ...existing code...