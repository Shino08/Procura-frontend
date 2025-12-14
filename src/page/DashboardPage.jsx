// src/pages/DashboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UsuarioDashboard } from "./UsuarioDashboard";
import { AdminDashboard } from "./AdminDashboard";

const getSession = () => {
  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("userCorreo");
  const userRole = localStorage.getItem("userRol") || "Cliente";
  return { token, userEmail, userRole };
};

const emailToName = (email) => {
  if (!email) return "Usuario";
  const base = email.split("@")[0] || "Usuario";
  return base.charAt(0).toUpperCase() + base.slice(1);
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [{ token, userEmail, userRole }, setSession] = useState(getSession);

  useEffect(() => {
    const s = getSession();
    if (!s.token) navigate("/login");
    else setSession(s);
  }, [navigate]);

  const userName = useMemo(() => emailToName(userEmail), [userEmail]);

  if (!token) return null; // evita parpadeo mientras navega

  return userRole === "Administrador" ? (
    <AdminDashboard token={token} userName={userName} />
  ) : (
    <UsuarioDashboard token={token} userName={userName} />
  );
};
