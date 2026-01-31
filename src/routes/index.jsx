import { createBrowserRouter } from "react-router-dom"
import { MainLayout } from "../layout/MainLayout"
import { ErrorPage } from "../page/ErrorPage"
import { LoginPage } from "../page/LoginPage"
import { DashboardPage } from "../page/DashboardPage"
import { NuevaSolicitudPage } from "../page/NuevaSolicitudPage"
import { GestionSolicitudesPage } from "../page/GestionSolicitudesPage"
import { GestionSolicitudesDetallesPage } from "../page/GestionSolicitudesDetallesPage"
import { SolicitudesPage } from "../page/SolicitudesPage"
import { SolicitudDetallesPage } from "../page/SolicitudDetallesPage"
import { ReportesGeneralesPage } from "../page/ReportesGeneralesPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      // ✅ Antes: index -> <LoginPage />
      // ✅ Ahora: index -> redirect
      {
        index: true,
        loader: async ({ request }) => {
          const url = new URL(request.url);
          const uid = url.searchParams.get("uid") || 2; // default para demo
          const role = url.searchParams.get("role") || "Usuario";

          // Ejemplo: mandas al dashboard del rol
          const tipo = role === "Administrador" ? "admin" : "client";

          throw redirect(`/dashboard/${tipo}?uid=${encodeURIComponent(uid)}&role=${encodeURIComponent(role)}`);
        },
      },

      // Puedes dejar /login si quieres para pruebas, o eliminarlo
      // { path: "login", element: <LoginPage /> },

      {
                path: "dashboard/:tipo",
                element: <DashboardPage />
            },
            {
                path: "solicitudes/nueva",
                element: <NuevaSolicitudPage />
            },
            {
                path: "solicitudes/usuario",
                element: <SolicitudesPage />
            },
            {
                path: "solicitudes/usuario/:fileId",
                element: <SolicitudDetallesPage />
            },
            {
                path: "solicitudes/admin",
                element: <GestionSolicitudesPage />
            },
            {
                path: "solicitudes/admin/:id",
                element: <GestionSolicitudesDetallesPage />
            },
            {
                path: "reportes",
                element: <ReportesGeneralesPage />
            }
        ]
}
])
