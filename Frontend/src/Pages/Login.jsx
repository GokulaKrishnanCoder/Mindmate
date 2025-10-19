import React, { useState, useEffect } from "react";
import { useTheme } from "../Context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { Mosaic } from "react-loading-indicators";
import API from "../api";
import "../App.css";

const Login = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const bgClass = theme === "dark" ? "bg-dark text-light" : "bg-light text-dark";

  // 🔐 Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  // ✅ Success toast after registration
  useEffect(() => {
    if (localStorage.getItem("registered") === "true") {
      toast.success("Registered successfully! Please login to continue.", {
        position: "top-right",
        autoClose: 3000,
      });
      localStorage.removeItem("registered");
    }
  }, []);

  // 🧾 Login API
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await API.post("/auth/login", { name, email, password });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/home");
      }
    } catch {
      toast.error("Invalid credentials. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`d-flex justify-content-center align-items-center min-vh-100 ${bgClass}`}>
        <Mosaic color="#6c757d" size="medium" text="Loading..." textColor="" />
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-content">
        {/* 🌿 Left Section */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>Welcome Back to MindMate 🧠</h1>
            <h2>Where Every Thought Finds Clarity</h2>
            <p>
              Reconnect with your personalized space for cognitive growth and mental wellness.  
              Track your progress, play games that sharpen your mind, and stay motivated with a 
              caring community that supports your journey to better mental fitness.
            </p>
            <p className="tagline">
              “Every login is a step toward a sharper, healthier you.”
            </p>
          </div>
          <div className="geometric-shape-1"></div>
          <div className="geometric-shape-2"></div>
        </div>

        {/* 🔑 Right Section */}
        <div className="form-section">
          <div className="form-container">
            <h2>Sign In</h2>
            <p className="form-subtitle">Welcome to your MindMate world.</p>

            <form onSubmit={handleLogin}>
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
                Login
              </button>
            </form>

            {/* Divider */}
            <div className="divider"><span>Or</span></div>

            {/* 🌐 Google Login */}
            <div className="google-login-btn">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  const decoded = jwtDecode(credentialResponse.credential);
                  const email = decoded.email;
                  try {
                    const res = await API.post("/auth/googleRegister", { email });
                    localStorage.setItem("token", res.data.token);
                    localStorage.setItem("user", JSON.stringify(res.data.user));
                    navigate("/home");
                  } catch (err) {
                    toast.error("Google Login failed");
                  }
                }}
                onError={() => toast.error("Google Login Failed")}
              />
            </div>

            {/* Signup link */}
            <div className="sign-up-link">
              Don’t have an account?{" "}
              <a href="/register" onClick={() => navigate("/register")}>
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
