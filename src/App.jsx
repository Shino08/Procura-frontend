import { useEffect, useState } from "react"
import { RouterProvider } from "react-router-dom"
import { router } from "./routes/index"

// Función para cargar sesión desde window.name
const loadSessionFromWindowName = () => {
  try {
    const data = JSON.parse(window.name || "null")
    
    if (!data || !data.userId || !data.userRol) {
      console.warn("⚠️ No hay sesión válida en window.name")
      return null
    }
    
    console.log("✅ Sesión cargada desde window.name:", data)
    
    // Copiar a localStorage para que persista en refreshes
    localStorage.setItem("userId", data.userId)
    localStorage.setItem("userRol", data.userRol)
    if (data.userCorreo) {
      localStorage.setItem("userCorreo", data.userCorreo)
    }
    
    // Opcional: limpiar window.name por seguridad
    // window.name = ""
    
    return data
  } catch (err) {
    console.error("❌ Error parseando window.name:", err)
    return null
  }
}

const App = () => {
  const [sessionLoaded, setSessionLoaded] = useState(false)

  useEffect(() => {
    // Intentar cargar desde localStorage primero (si ya existe)
    const existingUserId = localStorage.getItem("userId")
    const existingUserRol = localStorage.getItem("userRol")
    
    if (existingUserId && existingUserRol) {
      console.log("✅ Sesión ya existe en localStorage")
      setSessionLoaded(true)
      return
    }
    
    // Si no existe, cargar desde window.name
    const session = loadSessionFromWindowName()
    
    if (!session) {
      console.warn("⚠️ Sin sesión válida. Usuario debe entrar desde Gestión.")
      // Opcional: puedes redirigir o mostrar mensaje
      // window.location.href = "http://localhost:5173/InicioPlanificador"
    }
    
    setSessionLoaded(true)
  }, [])

  // Mientras carga la sesión
  if (!sessionLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  return <RouterProvider router={router} />
}

export default App
