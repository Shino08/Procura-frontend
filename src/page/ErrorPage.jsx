// src/page/ErrorPage.jsx
import { useRouteError, Link } from "react-router-dom"

export const ErrorPage = () => {
  const error = useRouteError()
  
  return (
    <div style={{ textAlign: "center", padding: "3rem" }}>
      <h1>¡Oops!</h1>
      <p>Lo sentimos, ha ocurrido un error inesperado.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
      <Link to="/dashboard">Volver al inicio</Link>
    </div>
  )
}
