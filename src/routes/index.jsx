// src/router/index.jsx
import { createBrowserRouter } from "react-router-dom"
// ========================================
// IMPORTAR COMPONENTES CORE
// ========================================
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
        errorElement: <ErrorPage />, // Maneja errores 404 y otros errores
        children: [
            {
                index: true, // Ruta por defecto cuando estás en "/"
                element: <LoginPage /> // O un componente Home si lo prefieres
            },
            {
                path: "login",
                element: <LoginPage />
            },
            {
                path: "dashboard",
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
