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
import { AdminDashboard } from "../page/AdminDashboard"
import { UsuarioDashboard } from "../page/UsuarioDashboard"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: "dashboard/admin",
        element: <AdminDashboard />
      },
      {
        path: "dashboard/client",
        element: <UsuarioDashboard />
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
