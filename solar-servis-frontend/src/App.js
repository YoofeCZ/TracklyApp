// src/App.js

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import SplashScreen from "./components/SplashScreen";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./pages/ClientDashboard";
import Technicians from "./pages/Technicians";
import Clients from "./pages/Clients";
import Reports from "./pages/Reports";
import Tasks from "./pages/Tasks";
import Warehouse from "./pages/Warehouse";
import Login from "./pages/Login";
import CreateUser from "./pages/CreateUser";
import UserManagement from "./pages/UserManagement";
import Systems from "./pages/Systems";
import Components from "./pages/Components";
import CalendarPage from "./pages/Calendar";
import Changelog from "./components/Changelog";
import Notifications from "./components/Notifications";
import SettingsPage from "./pages/SettingsPage";
import CreateTicket from "./pages/CreateTicket";
import TicketDetails from "./pages/TicketDetails";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import AddKnowHow from "./pages/AddKnowHow";
import { jwtDecode } from 'jwt-decode';
import ChangePassword from "./pages/ChangePassword"; // Import ChangePassword
import KnowHowListPage from "./pages/KnowHowListPage"; 
import KnowHowClientHelpPage from "./pages/KnowHowClientHelpPage";

import { loginUser } from "./services/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";
import './css/Global.css';
import { Layout, Grid } from 'antd';

const { Content } = Layout;
const { useBreakpoint } = Grid;

function App() {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false); // Stav pro collapsed navbar

  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint(); // Hook pro detekci velikosti obrazovky

  const isMobile = !screens.md; // Definice mobilní velikosti

  // Ověření tokenu a načtení role uživatele při prvním načtení
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setIsAuthenticated(true);
        setUserRole(decodedToken.role);
      } catch (error) {
        console.error("Chyba při dekódování tokenu:", error);
        setIsAuthenticated(false);
        setUserRole(null);
      }
    }

    // Zobrazení Splash Screen a fade-out
    const fadeTimer = setTimeout(() => setIsFading(true), 2000);
    const timer = setTimeout(() => setIsSplashVisible(false), 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(timer);
    };
  }, []);

  // Loading při změně stránek
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  const handleLogin = async (username, password) => {
    try {
      const { token } = await loginUser(username, password);
      localStorage.setItem("token", token);
      const decodedToken = jwtDecode(token);

      setIsAuthenticated(true);
      setUserRole(decodedToken.role || "unknown");
      navigate(decodedToken.role === "client" ? "/client-dashboard" : "/dashboard");
    } catch (error) {
      console.error("Chyba při přihlášení:", error.message || error);
      throw new Error(error.response?.data?.message || "Přihlášení selhalo.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem("token");
    setPendingTasksCount(0);
    navigate("/login");
  };

  const updatePendingTasksCount = (count) => {
    setPendingTasksCount(count);
  };

  // Funkce pro změnu stavu collapsed navbaru (zavolá se z Navbaru)
  const handleCollapseChange = (newCollapsed) => {
    setCollapsed(newCollapsed);
  };

  return (
    <>
      {isSplashVisible ? (
        <SplashScreen isFading={isFading} />
      ) : (
        <>
          {isAuthenticated && (
            <Navbar
              onLogout={handleLogout}
              pendingTasksCount={pendingTasksCount}
              onCollapseChange={handleCollapseChange}
            />
          )}
          {loading ? (
            <div className="d-flex justify-content-center align-items-center vh-100">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Načítání...</span>
              </div>
            </div>
          ) : (
            <>
              <Notifications updatePendingTasksCount={setPendingTasksCount} />
              <Changelog
                changelogKey="v1.0.2"
                changelogText={
                  <>
                    <h2>Novinky ve verzi v1.0.3</h2>
                    <ul style={{ textAlign: "left" }}>
                      <li>🆕 <b>Ticketovací systém:</b> Přidán ticketovací systém.</li>
                      <li>✨ <b>Vylepšení designu:</b> Vylepšený design celé aplikace, především navigačního menu a loginu.</li>
                      <li>🔧 <b>Správce Souborů:</b> Úprava správce souborů, možnost nastavit servisní smlouvu a datum k prohlídce + Revizní zpráva a její expirace.</li>
                      <li>🔧 <b>Změna hesla:</b> Klienti si mohou měnit hesla a pokud jej zapomenou, mohou si sami zažádat o nové skrz "Zapomenuté heslo".</li>
                      <li>🛠️ <b>Globální styly:</b> Přidány nové styly pro responsivní design...</li>
                    </ul>
                    <p>🎉 Užívejte novinky v této verzi!</p>
                  </>
                }
              />

              {/* Hlavní obsah vedle navbaru */}
              <Layout
                className="site-layout"
                style={{
                  marginLeft: isAuthenticated && !isMobile ? (collapsed ? 80 : 250) : 0,
                  transition: 'margin-left 0.3s',
                  padding: isMobile ? '80px 20px 20px' : '20px', // Přidání top paddingu pro mobile
                }}
              >
                <Content>
                  <Routes>
                    {/* Login stránka */}
                    <Route
                      path="/login"
                      element={
                        isAuthenticated ? (
                          <Navigate to={userRole === "client" ? "/client-dashboard" : "/dashboard"} />
                        ) : (
                          <Login onLogin={handleLogin} />
                        )
                      }
                    />
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route
                      path="/dashboard"
                      element={
                        isAuthenticated && userRole !== "client" ? <Dashboard /> : <Navigate to={userRole === "client" ? "/client-dashboard" : "/login"} />
                      }
                    />
                    <Route
                      path="/client-dashboard"
                      element={
                        isAuthenticated && userRole === "client" ? <ClientDashboard /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/change-password"
                      element={
                        isAuthenticated ? <ChangePassword /> : <Navigate to="/login" />
                      }
                    />

                    <Route
                      path="/technicians"
                      element={
                        isAuthenticated && (userRole === "admin" || userRole === "technician") ? <Technicians /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/clients"
                      element={
                        isAuthenticated && userRole === "admin" ? <Clients /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        isAuthenticated && (userRole === "admin" || userRole === "technician") ? <Reports /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/tasks"
                      element={
                        isAuthenticated && (userRole === "admin" || userRole === "technician") ? <Tasks updatePendingTasksCount={updatePendingTasksCount} /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/calendar"
                      element={
                        isAuthenticated && (userRole === "admin" || userRole === "technician") ? <CalendarPage /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/warehouse"
                      element={
                        isAuthenticated && (userRole === "admin" || userRole === "technician") ? <Warehouse /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/systems"
                      element={
                        isAuthenticated && (userRole === "admin" || userRole === "technician") ? <Systems /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/components"
                      element={
                        isAuthenticated && (userRole === "admin" || userRole === "technician") ? <Components /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/create-user"
                      element={
                        isAuthenticated && userRole === "admin" ? <CreateUser /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/user-management"
                      element={
                        isAuthenticated && userRole === "admin" ? <UserManagement /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/create-ticket"
                      element={
                        isAuthenticated && userRole === "client" ? <CreateTicket /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/tickets/:id"
                      element={
                        isAuthenticated ? <TicketDetails /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/technician-dashboard"
                      element={
                        isAuthenticated && (userRole === "admin" || userRole === "technician") ? <TechnicianDashboard /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/add-know-how"
                      element={
                        isAuthenticated && (userRole === "admin") ? <AddKnowHow /> : <Navigate to="/login" />
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        isAuthenticated ? <SettingsPage /> : <Navigate to="/login" />
                      }
                    />
                      {/* Stránka pro techniky a adminy */}
  <Route
    path="/know-how-list"
    element={
      isAuthenticated && (userRole === "admin" || userRole === "technician")
        ? <KnowHowListPage />
        : <Navigate to="/login" />
    }
  />

  {/* Stránka pro klienty (nápověda) */}
  <Route
    path="/know-how-help"
    element={
      isAuthenticated && userRole === "client"
        ? <KnowHowClientHelpPage />
        : <Navigate to="/login" />
    }
  />
                  </Routes>
                </Content>
              </Layout>
            </>
          )}
        </>
      )}
    </>
  );
}

export default App;
