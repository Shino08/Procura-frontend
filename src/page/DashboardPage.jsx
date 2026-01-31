// src/pages/DashboardPage.jsx
import { useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { UsuarioDashboard } from "./UsuarioDashboard";
import { AdminDashboard } from "./AdminDashboard";

const emailToName = (email) => {
  if (!email) return "Usuario";
  const base = email.split("@")[0] || "Usuario";
  return base.charAt(0).toUpperCase() + base.slice(1);
};

export const DashboardPage = () => {
  const { tipo } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 1) Lee uid/role desde URL (si vienes desde enlace entre sistemas)
  const uidFromUrl = searchParams.get("uid");
  const roleFromUrl = searchParams.get("role");

  // 2) Si vienen por URL, persístelos
  useEffect(() => {
    if (uidFromUrl) localStorage.setItem("userId", uidFromUrl);
    if (roleFromUrl) localStorage.setItem("userRol", roleFromUrl);
  }, [uidFromUrl, roleFromUrl]);

  // 3) Obtén “sesión” simulada desde localStorage (SIN token)
  const userId = localStorage.getItem("userId") || "1";
  const userRole = localStorage.getItem("userRol") || "Usuario";
  const userEmail = localStorage.getItem("userCorreo") || "usuario@procura.com";

  const userName = useMemo(() => emailToName(userEmail), [userEmail]);

  // 4) Asegura que /dashboard (sin :tipo) no pase
  // Tu router tiene "dashboard/:tipo", pero por si navegan mal:
  useEffect(() => {
    if (tipo !== "admin" && tipo !== "client") {
      const normalizedTipo = userRole === "Administrador" ? "admin" : "client";
      navigate(`/dashboard/${normalizedTipo}?uid=${encodeURIComponent(userId)}&role=${encodeURIComponent(userRole)}`, {
        replace: true,
      });
    }
  }, [tipo, navigate, userRole, userId]);

  // 5) Decide vista por :tipo (o por role si prefieres)
  const isAdminView = tipo === "admin";

  // Nota: si tus dashboards esperan token, pásales null o quita esa prop.
  return isAdminView ? (
    <AdminDashboard token={null} userName={userName} userId={Number(userId)} userRole={userRole} />
  ) : (
    <UsuarioDashboard token={null} userName={userName} userId={Number(userId)} userRole={userRole} />
  );
};
