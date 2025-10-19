import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Component/Layout";
import Home from "./Pages/Home";
import Games from "./Pages/Games";
import Chat from "./Pages/Chat";
import CallCaretaker from "./Pages/Callcaretaker";
import GamePlay from "./Pages/GamePlay";
import Contact from "./Pages/Contact";
import Settings from "./Pages/Settings";
import Profile from "./Pages/Profile";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import NotFound from "./Pages/Notfound";
import ProtectedRoute from "./Pages/ProtectedRoute";
import PublicRoute from "./Pages/PublicRoute";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "./Context/ThemeContext";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const ClientId = import.meta.env.VITE_CLIENT_ID;

  return (
    <ThemeProvider>
      <Router>
        <GoogleOAuthProvider clientId={ClientId}>
          <ToastContainer />
          <Routes>

            {/* Public routes → only accessible when NOT logged in */}
            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Protected routes → accessible ONLY when logged in */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/home" element={<Home />} />
              <Route path="/games" element={<Games />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/call" element={<CallCaretaker />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/play/:gameId" element={<GamePlay />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </GoogleOAuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
