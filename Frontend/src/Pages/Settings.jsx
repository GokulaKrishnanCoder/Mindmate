// ...existing code...
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Tab,
  Nav,
  Card,
  Form,
  Button,
  Alert,
  Offcanvas,
} from "react-bootstrap";
import { User, Bell, Palette, Eye, Lock, LogOut, Menu } from "lucide-react";
import { useTheme } from "../Context/ThemeContext";
import API from "../api";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [activeKey, setActiveKey] = useState("profile");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const {
    theme,
    setTheme,
    color,
    setColor,
    font,
    setFont,
    accessibility,
    setAccessibility,
  } = useTheme();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    photo: "",
  });

  const [settings, setSettings] = useState({
    theme: "light",
    color: "blue",
    font: "default",
    accessibility: { largeText: false },
    notifications: { email: true, sms: false, push: false },
  });

  // Password OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpStatus, setOtpStatus] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Email change state
  const [emailChangeSent, setEmailChangeSent] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [confirmingEmail, setConfirmingEmail] = useState(false);
  const [newEmailValue, setNewEmailValue] = useState("");
  const [emailOtpValue, setEmailOtpValue] = useState("");

  // privacy view selector: null | "password" | "email"
  const [privacyView, setPrivacyView] = useState(null);

  // mobile sidebar state
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const user = localStorage.getItem("user");
        if (user) {
          const userObj = JSON.parse(user);
          setProfile({
            name: userObj.name || "",
            email: userObj.email || "",
            photo: userObj.photo || "",
          });
        }
        const res = await API.get("/auth/settings");
        if (res?.data) {
          setSettings(res.data);
          if (res.data.theme) setTheme(res.data.theme);
          if (res.data.color) setColor(res.data.color);
          if (res.data.font) setFont(res.data.font);
          if (res.data.accessibility) setAccessibility(res.data.accessibility);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [setTheme, setColor, setFont, setAccessibility]);

  const handleSaveSettings = async () => {
    try {
      const payload = {
        theme,
        color,
        font,
        accessibility,
        notifications: settings.notifications,
      };
      await API.put("/auth/settings", payload);
      alert("Settings saved!");
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Failed to save settings");
    }
  };

  const chosenColor =
    {
      blue: "#3b82f6",
      purple: "#8b5cf6",
      green: "#22c55e",
      yellow: "#eab308",
      red: "#ef4444",
      orange: "#f97316",
    }[color] || "#3b82f6";

  if (loading) return <div className="text-center py-5">Loading...</div>;

  // Request OTP to current user's email for password change
  const handleRequestOtp = async () => {
    setSendingOtp(true);
    setOtpStatus("");
    try {
      await API.post("/auth/privacy/request-otp");
      setOtpSent(true);
      setOtpStatus("OTP sent to your email.");
    } catch (err) {
      console.error("Request OTP error:", err?.response || err);
      setOtpStatus(
        err?.response?.data?.message || "Failed to send OTP. Try again."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP and change password
  const handleResetWithOtp = async (e) => {
    e?.preventDefault();
    setOtpStatus("");

    if (!otpValue) {
      setOtpStatus("Please enter the OTP.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setOtpStatus("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setOtpStatus("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await API.post("/auth/privacy/reset", {
        otp: otpValue,
        newPassword,
      });
      setOtpStatus(res?.data?.message || "Password changed successfully.");
      setOtpValue("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpSent(false);
      setPrivacyView(null);
      if (isMobile) setShowSidebarMobile(false);
    } catch (err) {
      console.error("Reset with OTP error:", err?.response || err);
      setOtpStatus(
        err?.response?.data?.message || "Failed to reset password. Try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  // Request OTP for changing email (sends OTP to current registered email)
  const handleRequestEmailChange = async () => {
    if (!newEmailValue || !/^\S+@\S+\.\S+$/.test(newEmailValue)) {
      setEmailStatus("Enter a valid new email address.");
      return;
    }
    setSendingEmailOtp(true);
    setEmailStatus("");
    try {
      const res = await API.post("/auth/privacy/request-email-change", {
        newEmail: newEmailValue,
      });
      setEmailChangeSent(true);
      setEmailStatus(res?.data?.message || "OTP sent to your current email.");
    } catch (err) {
      console.error("Request email change error:", err?.response || err);
      setEmailStatus(
        err?.response?.data?.message || "Failed to send OTP. Try again."
      );
    } finally {
      setSendingEmailOtp(false);
    }
  };

  // Confirm email change using OTP
  const handleConfirmEmailChange = async (e) => {
    e?.preventDefault();
    if (!emailOtpValue) {
      setEmailStatus("Please enter the OTP sent to your email.");
      return;
    }
    setConfirmingEmail(true);
    try {
      const res = await API.post("/auth/privacy/confirm-email", {
        otp: emailOtpValue,
      });
      setEmailStatus(res?.data?.message || "Email changed successfully.");
      const updatedEmail = res?.data?.email || newEmailValue;
      setProfile((p) => ({ ...p, email: updatedEmail }));
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      localUser.email = updatedEmail;
      localStorage.setItem("user", JSON.stringify(localUser));
      setNewEmailValue("");
      setEmailOtpValue("");
      setEmailChangeSent(false);
      setPrivacyView(null);
      if (isMobile) setShowSidebarMobile(false);
    } catch (err) {
      console.error("Confirm email change error:", err?.response || err);
      setEmailStatus(
        err?.response?.data?.message || "Failed to confirm email change"
      );
    } finally {
      setConfirmingEmail(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const sidebarItems = [
    { key: "profile", icon: <User size={18} />, label: "Profile" },
    { key: "notifications", icon: <Bell size={18} />, label: "Notifications" },
    { key: "accessibility", icon: <Eye size={18} />, label: "Accessibility" },
    { key: "appearance", icon: <Palette size={18} />, label: "Appearance" },
    { key: "privacy", icon: <Lock size={18} />, label: "Privacy" },
  ];

  return (
    <Container fluid className="py-3">
      <Row className="justify-content-center">
        <Col xs={12} md={11} lg={10}>
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden" style={{ minHeight: "70vh" }}>
            <Tab.Container activeKey={activeKey} onSelect={(k) => setActiveKey(k || "profile")}>
              <Row className="g-0 flex-column flex-md-row">
                {/* Mobile top bar (opens offcanvas) */}
                {isMobile && (
                  <div className="d-flex align-items-center justify-content-between p-2 border-bottom" style={{ background: theme === "dark" ? "#071029" : "#fff" }}>
                    <div className="d-flex align-items-center gap-2">
                      <Button variant="link" className="p-0" onClick={() => setShowSidebarMobile(true)} aria-label="Open settings">
                        <Menu size={22} color={chosenColor} />
                      </Button>
                      <h6 className="mb-0" style={{ color: chosenColor }}>Settings</h6>
                    </div>
                    <div>
                      <Button size="sm" variant="outline-secondary" onClick={handleSaveSettings} style={{ borderColor: chosenColor, color: chosenColor }}>
                        Save
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sidebar for desktop */}
                {!isMobile && (
                  <Col
                    md={3}
                    className={`d-flex flex-column justify-content-between ${theme === "dark" ? "bg-dark text-light" : "bg-white"} border-md-end px-3 py-4`}
                  >
                    <div>
                      <h5 className="fw-bold text-center mb-3" style={{ color: chosenColor }}>
                        ⚙ Settings
                      </h5>
                      <Nav
                        variant="pills"
                        className="flex-md-column flex-row justify-content-around gap-2"
                        activeKey={activeKey}
                      >
                        {sidebarItems.map((item) => (
                          <Nav.Item key={item.key}>
                            <Nav.Link
                              eventKey={item.key}
                              className="d-flex align-items-center rounded-3 px-3 py-2"
                              style={{
                                backgroundColor: activeKey === item.key ? chosenColor : "transparent",
                                color: activeKey === item.key ? "#fff" : theme === "dark" ? "#ddd" : chosenColor,
                                border: `1px solid ${chosenColor}`,
                                transition: "all 0.15s ease",
                                cursor: "pointer",
                              }}
                            >
                              {item.icon}
                              <span className="ms-2">{item.label}</span>
                            </Nav.Link>
                          </Nav.Item>
                        ))}
                      </Nav>
                    </div>

                    <div className="mt-3">
                      <Button variant="outline-danger" onClick={handleLogout} className="w-100 d-flex align-items-center justify-content-center gap-2">
                        <LogOut size={16} /> Logout
                      </Button>
                    </div>
                  </Col>
                )}

                {/* Offcanvas sidebar for mobile */}
                <Offcanvas show={showSidebarMobile} onHide={() => setShowSidebarMobile(false)} placement="start">
                  <Offcanvas.Header closeButton>
                    <Offcanvas.Title style={{ color: chosenColor }}>⚙ Settings</Offcanvas.Title>
                  </Offcanvas.Header>
                  <Offcanvas.Body>
                    <Nav variant="pills" className="flex-column gap-2">
                      {sidebarItems.map((item) => (
                        <Nav.Link
                          key={`mobile-${item.key}`}
                          onClick={() => {
                            setActiveKey(item.key);
                            setShowSidebarMobile(false);
                          }}
                          active={activeKey === item.key}
                          className="d-flex align-items-center rounded-3 px-3 py-2"
                          style={{
                            backgroundColor: activeKey === item.key ? chosenColor : "transparent",
                            color: activeKey === item.key ? "#fff" : "#333",
                            border: `1px solid ${chosenColor}`,
                          }}
                        >
                          {item.icon}
                          <span className="ms-2">{item.label}</span>
                        </Nav.Link>
                      ))}

                      <div className="mt-3">
                        <Button variant="outline-danger" onClick={handleLogout} className="w-100 d-flex align-items-center justify-content-center gap-2">
                          <LogOut size={16} /> Logout
                        </Button>
                      </div>
                    </Nav>
                  </Offcanvas.Body>
                </Offcanvas>

                {/* Content */}
                <Col xs={12} md={9} className={`p-3 ${theme === "dark" ? "bg-dark text-light" : "bg-light"}`} style={{ minHeight: 420 }}>
                  <Tab.Content>
                    {/* Profile */}
                    <Tab.Pane eventKey="profile">
                      <Card className="border-0 shadow-sm rounded-4 p-3 mb-3">
                        <h5 className="fw-bold mb-2" style={{ color: chosenColor }}>
                          👤 Profile Settings
                        </h5>
                        <Form>
                          <div className="text-center mb-3">
                            {profile.photo ? (
                              <img src={profile.photo} alt="Profile" className="rounded-circle mb-2" style={{ width: 90, height: 90, objectFit: "cover", border: `3px solid ${chosenColor}` }} />
                            ) : (
                              <div className="rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ width: 90, height: 90, background: "#ddd", color: "#555", fontSize: "1.5rem", border: `3px solid ${chosenColor}` }}>
                                {profile.name ? profile.name[0] : "?"}
                              </div>
                            )}
                            <Form.Control type="file" accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setProfile({ ...profile, photo: reader.result });
                                reader.readAsDataURL(file);
                              }
                            }} className="mt-2" />
                          </div>

                          <Form.Group className="mb-2" controlId="profileName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control type="text" placeholder="Enter your name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                          </Form.Group>
                          <Form.Group className="mb-2" controlId="profileEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" placeholder="Enter your email" value={profile.email} disabled />
                          </Form.Group>
                        </Form>
                      </Card>
                    </Tab.Pane>

                    {/* Notifications */}
                    <Tab.Pane eventKey="notifications">
                      <Card className="border-0 shadow-sm rounded-4 p-3 mb-3">
                        <h5 className="fw-bold mb-2" style={{ color: chosenColor }}>🔔 Notification Preferences</h5>
                        <Form.Check type="switch" id="emailSwitch" label="Email Notifications" checked={settings.notifications.email} onChange={(e) => setSettings((s) => ({ ...s, notifications: { ...s.notifications, email: e.target.checked } }))} className="mb-2" />
                      </Card>
                    </Tab.Pane>

                    {/* Accessibility */}
                    <Tab.Pane eventKey="accessibility">
                      <Card className="border-0 shadow-sm rounded-4 p-3 mb-3">
                        <h5 className="fw-bold mb-2" style={{ color: chosenColor }}>🦾 Accessibility</h5>
                        <Form.Check type="switch" id="largerText" label="Larger Text" checked={settings.accessibility.largeText} onChange={(e) => {
                          setSettings((s) => ({ ...s, accessibility: { ...s.accessibility, largeText: e.target.checked } }));
                          setAccessibility({ ...settings.accessibility, largeText: e.target.checked });
                        }} className="mb-2" />
                      </Card>
                    </Tab.Pane>

                    {/* Appearance */}
                    <Tab.Pane eventKey="appearance">
                      <Card className="border-0 shadow-sm rounded-4 p-3 mb-3">
                        <h5 className="fw-bold mb-2" style={{ color: chosenColor }}>🎨 Appearance</h5>
                        <Form.Group className="mb-2">
                          <Form.Label>Theme</Form.Label>
                          <Form.Select value={settings.theme} onChange={(e) => { setSettings((s) => ({ ...s, theme: e.target.value })); setTheme(e.target.value); }} style={{ border: `1px solid ${chosenColor}` }}>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                          </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label>Accent Color</Form.Label>
                          <Form.Select value={settings.color} onChange={(e) => { setSettings((s) => ({ ...s, color: e.target.value })); setColor(e.target.value); }} style={{ border: `1px solid ${chosenColor}` }}>
                            <option value="blue">Blue</option>
                            <option value="purple">Purple</option>
                            <option value="green">Green</option>
                            <option value="yellow">Yellow</option>
                            <option value="red">Red</option>
                            <option value="orange">Orange</option>
                          </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label>Font Style</Form.Label>
                          <Form.Select value={settings.font} onChange={(e) => { setSettings((s) => ({ ...s, font: e.target.value })); setFont(e.target.value); }} style={{ border: `1px solid ${chosenColor}` }}>
                            <option value="default">Default</option>
                            <option value="serif">Serif</option>
                            <option value="sans-serif">Sans-serif</option>
                          </Form.Select>
                        </Form.Group>
                      </Card>
                    </Tab.Pane>

                    {/* Privacy */}
                    <Tab.Pane eventKey="privacy">
                      <Card className="border-0 shadow-sm rounded-4 p-3 mb-3">
                        <h5 className="fw-bold mb-2" style={{ color: chosenColor }}>🔒 Privacy & Password</h5>
                        <p className="text-muted small">Change password or email using an OTP sent to your registered email.</p>

                        {(otpStatus || emailStatus) && <Alert variant="info">{otpStatus || emailStatus}</Alert>}

                        <div className="mb-3 d-flex flex-column flex-sm-row gap-2 align-items-stretch">
                          <Button variant={privacyView === "password" ? "primary" : "outline-primary"} onClick={() => { setPrivacyView(privacyView === "password" ? null : "password"); setOtpStatus(""); setEmailStatus(""); }} style={privacyView === "password" ? { background: chosenColor, borderColor: chosenColor } : { borderColor: chosenColor, color: chosenColor }} className="flex-grow-1">
                            Change Password
                          </Button>

                          <Button variant={privacyView === "email" ? "primary" : "outline-primary"} onClick={() => { setPrivacyView(privacyView === "email" ? null : "email"); setOtpStatus(""); setEmailStatus(""); }} style={privacyView === "email" ? { background: chosenColor, borderColor: chosenColor } : { borderColor: chosenColor, color: chosenColor }} className="flex-grow-1">
                            Change Email
                          </Button>
                        </div>

                        {privacyView === "password" && (
                          <div>
                            <h6 className="mt-2">Change Password</h6>
                            {!otpSent ? (
                              <div className="mb-3">
                                <div className="mb-2 small"><strong>Account email:</strong> {profile.email}</div>
                                <Button variant="outline-primary" onClick={handleRequestOtp} disabled={sendingOtp} style={{ borderColor: chosenColor, color: chosenColor }} className="w-100">
                                  {sendingOtp ? "Sending OTP..." : "Send OTP to email"}
                                </Button>
                              </div>
                            ) : (
                              <Form onSubmit={handleResetWithOtp}>
                                <Form.Group className="mb-2" controlId="otp">
                                  <Form.Label>OTP</Form.Label>
                                  <Form.Control type="text" value={otpValue} onChange={(e) => setOtpValue(e.target.value)} placeholder="Enter OTP" />
                                </Form.Group>

                                <Form.Group className="mb-2" controlId="newPassword">
                                  <Form.Label>New Password</Form.Label>
                                  <Form.Control type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" />
                                </Form.Group>

                                <Form.Group className="mb-2" controlId="confirmPassword">
                                  <Form.Label>Confirm Password</Form.Label>
                                  <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                                </Form.Group>

                                <div className="d-flex gap-2 flex-column flex-sm-row">
                                  <Button type="submit" disabled={resetLoading} style={{ background: chosenColor, border: "none" }} className="w-100">
                                    {resetLoading ? "Saving..." : "Change Password"}
                                  </Button>
                                  <Button variant="outline-secondary" onClick={() => { setOtpSent(false); setOtpValue(""); setNewPassword(""); setConfirmPassword(""); setPrivacyView(null); }} className="w-100">
                                    Cancel
                                  </Button>
                                </div>
                              </Form>
                            )}
                          </div>
                        )}

                        {privacyView === "email" && (
                          <div>
                            <h6 className="mt-2">Change Email</h6>
                            {!emailChangeSent ? (
                              <Form onSubmit={(e)=>{ e.preventDefault(); handleRequestEmailChange(); }}>
                                <Form.Group className="mb-2" controlId="newEmail">
                                  <Form.Label>New Email</Form.Label>
                                  <Form.Control type="email" value={newEmailValue} onChange={(e) => setNewEmailValue(e.target.value)} placeholder="Enter new email" />
                                </Form.Group>
                                <div className="d-flex gap-2 flex-column flex-sm-row">
                                  <Button type="submit" disabled={sendingEmailOtp} style={{ background: chosenColor, border: "none" }} className="w-100">
                                    {sendingEmailOtp ? "Sending..." : "Send OTP to current email"}
                                  </Button>
                                  <Button variant="outline-secondary" onClick={() => setNewEmailValue("")} className="w-100">Clear</Button>
                                </div>
                              </Form>
                            ) : (
                              <Form onSubmit={handleConfirmEmailChange}>
                                <Form.Group className="mb-2" controlId="emailOtp">
                                  <Form.Label>OTP sent to current email</Form.Label>
                                  <Form.Control type="text" value={emailOtpValue} onChange={(e) => setEmailOtpValue(e.target.value)} placeholder="Enter OTP" />
                                </Form.Group>
                                <div className="d-flex gap-2 flex-column flex-sm-row">
                                  <Button type="submit" disabled={confirmingEmail} style={{ background: chosenColor, border: "none" }} className="w-100">
                                    {confirmingEmail ? "Confirming..." : "Confirm Email Change"}
                                  </Button>
                                  <Button variant="outline-secondary" onClick={() => { setEmailChangeSent(false); setEmailOtpValue(""); setNewEmailValue(""); setPrivacyView(null); }} className="w-100">
                                    Cancel
                                  </Button>
                                </div>
                              </Form>
                            )}
                          </div>
                        )}
                      </Card>
                    </Tab.Pane>
                  </Tab.Content>

                  {/* Desktop save button area */}
                  {!isMobile && (
                    <div className="text-end mt-2">
                      <Button style={{ background: chosenColor, border: "none" }} onClick={handleSaveSettings}>
                        Save Settings
                      </Button>
                    </div>
                  )}

                  {/* Mobile sticky save bar */}
                  {isMobile && (
                    <div style={{
                      position: "sticky",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: 10,
                      background: theme === "dark" ? "#071029" : "#fff",
                      borderTop: `1px solid ${theme === "dark" ? "#0f172a" : "#e9ecef"}`
                    }}>
                      <div className="d-flex gap-2">
                        <Button onClick={() => { setActiveKey("profile"); }} variant="outline-secondary" className="w-50">Profile</Button>
                        <Button onClick={handleSaveSettings} style={{ background: chosenColor, border: "none" }} className="w-50">Save</Button>
                      </div>
                    </div>
                  )}
                </Col>
              </Row>
            </Tab.Container>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;
// ...existing code...