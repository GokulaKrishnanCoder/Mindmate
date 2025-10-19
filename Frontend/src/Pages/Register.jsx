import React, { useState, useEffect } from "react";
import { useTheme } from "../Context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api";
import "../App.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  // 🔐 Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await API.post("/auth/register", { name, email, password });
      if (res.data.success) {
        localStorage.setItem("registered", "true");
        toast.success("Registered successfully! Please login.", {
          position: "top-right",
          autoClose: 3000,
        });
        navigate("/login");
      }
    } catch {
      toast.error("Registration failed. Try again!");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`d-flex justify-content-center align-items-center min-vh-100 ${
          theme === "dark" ? "bg-dark text-light" : "bg-light text-dark"
        }`}
      >
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-content">
        {/* 🌱 Left Section */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>Join MindMate 🌸</h1>
            <h2>Grow Your Mind, One Step at a Time</h2>
            <p>
              Take the first step towards improving your cognitive wellness.
              MindMate connects you with engaging games, supportive caretakers,
              and insightful progress tracking designed just for you.
            </p>
            <p className="tagline">
              “Stronger minds are built one habit at a time.”
            </p>
          </div>
          <div className="geometric-shape-1"></div>
          <div className="geometric-shape-2"></div>
        </div>

        {/* 📝 Right Section */}
        <div className="form-section">
          <form className="form-container" onSubmit={handleRegister}>
            <h2>Create Account</h2>
            <p className="form-subtitle">Start your MindMate journey today!</p>

            <div className="input-group">
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  placeholder="Username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="sign-in-btn">
              Register
            </button>

            <div className="sign-up-link">
              Already have an account?{" "}
              <a href="/login" className="text-decoration-none">
                Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
