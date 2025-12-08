import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [modal, setModal] = useState({
    show: false,
    type: '',
    title: '',
    message: ''
  });

  const showModal = (type, title, message) => {
    setModal({
      show: true,
      type,
      title,
      message
    });
  };

  const closeModal = () => {
    setModal({
      show: false,
      type: '',
      title: '',
      message: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error en login:', data.message);
        showModal('error', 'Error de Autenticación', data.message || 'Credenciales inválidas. Por favor verifica tu correo y contraseña.');
        return;
      }

      localStorage.setItem('token', data.token);
      const payload = JSON.parse(atob(data.token.split('.')[1]));
      localStorage.setItem('userRole', payload.role);
      localStorage.setItem('userEmail', payload.email);

      if (payload.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error('Error de conexión:', err);
      showModal('error', 'Error de Conexión', 'No se pudo conectar con el servidor. Por favor verifica tu conexión a internet e intenta nuevamente.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center p-0 sm:p-4 overflow-hidden relative">
      {/* Elementos decorativos de fondo animados */}
      <div className="absolute top-0 left-0 w-32 h-32 sm:w-96 sm:h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 sm:w-96 sm:h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 sm:w-48 sm:h-48 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Main Content - Login Card Responsive */}
      <div className="bg-white/95 backdrop-blur-sm sm:rounded-3xl shadow-2xl overflow-hidden w-full max-w-7xl flex flex-col lg:flex-row h-screen sm:h-auto sm:min-h-[90vh] lg:min-h-[85vh] relative z-10 hover:shadow-orange-200/50 transition-all duration-500">

        {/* Panel Izquierdo - Solo visible en desktop */}
        <div className="hidden lg:flex bg-[#f15a29] text-white p-8 lg:p-12 lg:w-[45%] flex-col justify-between relative overflow-hidden">
          {/* Patrón decorativo de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-32 h-32 border-4 border-white rounded-full animate-float"></div>
            <div className="absolute bottom-20 left-10 w-24 h-24 border-4 border-white rounded-full animate-float animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 border-4 border-white rounded-full animate-float animation-delay-4000"></div>
          </div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <img
                  src="./src/assets/logo20.png"
                  alt="Logo"
                  className="w-20 h-20 lg:w-24 lg:h-20 filter brightness-0 invert drop-shadow-lg"
                />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight">
              Sistema Procura
            </h1>
            <p className="text-base lg:text-lg mb-8 opacity-95 font-light">
              Plataforma de Aprovisionamiento Estratégico
            </p>

            {/* Características */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 group hover:translate-x-1 transition-transform duration-300">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">Gestión inteligente de compras</span>
              </div>
              <div className="flex items-center gap-3 group hover:translate-x-1 transition-transform duration-300">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">Control de inventario en tiempo real</span>
              </div>
              <div className="flex items-center gap-3 group hover:translate-x-1 transition-transform duration-300">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">Análisis y reportes avanzados</span>
              </div>
            </div>
          </div>

          {/* Footer del panel - Solo desktop */}
          <div className="mt-8 space-y-3 relative z-10">
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </a>
            </div>
            <div className="text-xs opacity-90 space-y-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+58 (414) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>info@corporacionbd.com</span>
              </div>
            </div>
            <div className="text-xs opacity-75 pt-2">
              © 2025 Corporación Business & Development
            </div>
          </div>
        </div>

        {/* Panel Derecho - Formulario (Mobile 100%, Desktop 55%) */}
        <div className="p-6 sm:p-8 lg:p-12 lg:w-[55%] w-full flex items-center justify-center bg-gradient-to-br from-white to-gray-50 relative overflow-y-auto">
          {/* Logo en esquina superior - Solo mobile */}
          <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-10 lg:hidden">
            <div className="flex items-center gap-3 group">
              <img
                src="./src/assets/logo20.png"
                alt="Logo Sistema Procura"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Contenedor centrado */}
          <div className="w-full max-w-lg mx-auto">
            {/* Indicador visual mejorado */}
            <div className="flex items-center justify-center gap-2 mb-8 lg:mb-10 mt-20 lg:mt-0">
              <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"></div>
              <div className="w-3 h-1 bg-orange-300 rounded-full"></div>
              <div className="w-3 h-1 bg-orange-200 rounded-full"></div>
            </div>

            {/* Título con mejor visualización - Centrado */}
            <div className="text-center mb-8 lg:mb-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 lg:mb-4 bg-gradient-to-r from-orange-600 via-orange-500 to-gray-800 bg-clip-text text-transparent">
                Bienvenido de nuevo
              </h2>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Ingresa tus credenciales para acceder al sistema
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    className="block w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all duration-200 hover:border-gray-300 placeholder-gray-400 bg-white shadow-sm"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full pl-12 pr-14 py-4 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all duration-200 hover:border-gray-300 placeholder-gray-400 bg-white shadow-sm"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-all duration-200 group"
                    tabIndex="-1"
                  >
                    <svg className={`h-5 w-5 transition-all duration-200 ${showPassword ? 'text-orange-600' : 'group-hover:text-orange-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* Opciones adicionales */}
              <div className="flex items-center justify-between py-2">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500/50 border-2 border-gray-300 rounded-md group-hover:border-orange-400 transition-colors duration-200"
                  />
                  <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">Recordarme</span>
                </label>
                <a
                  href="#"
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Botón Submit mejorado */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-[#f15a29] to-[#f15a29] hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 text-base flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-orange-500/50'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Iniciar sesión</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer mejorado y responsive */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <div className="text-center space-y-3">
                <div className="flex justify-center gap-6">
                  <a
                    href="#"
                    className="text-xs text-gray-500 hover:text-orange-600 transition-colors duration-200 font-medium hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    Términos
                  </a>
                  <a
                    href="#"
                    className="text-xs text-gray-500 hover:text-orange-600 transition-colors duration-200 font-medium hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    Privacidad
                  </a>
                  <a
                    href="#"
                    className="text-xs text-gray-500 hover:text-orange-600 transition-colors duration-200 font-medium hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    Ayuda
                  </a>
                </div>
                <p className="text-xs text-gray-400">© 2025 Corporación Business & Development</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal de Advertencia/Error mejorado */}
      {modal.show && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 lg:p-10 animate-scale-in relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${
              modal.type === 'error'
                ? 'from-red-500 via-red-400 to-orange-500'
                : 'from-green-500 via-emerald-400 to-teal-500'
            }`}></div>

            <button
              onClick={closeModal}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 z-10"
              aria-label="Cerrar modal"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex justify-center mb-6 relative z-10">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center animate-pulse-once ${
                modal.type === 'error'
                  ? 'bg-red-100 ring-4 ring-red-200'
                  : 'bg-green-100 ring-4 ring-green-200'
              }`}>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${
                  modal.type === 'error' ? 'animate-bounce-slow' : 'animate-checkmark'
                }`}>
                  {modal.type === 'error' ? (
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center relative z-10">
              <h3 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 ${
                modal.type === 'error' ? 'text-red-800' : 'text-green-800'
              }`}>
                {modal.title}
              </h3>

              <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed mb-6 sm:mb-8 px-2">
                {modal.message}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={closeModal}
                  className={`flex-1 px-6 py-3 sm:py-3.5 lg:py-4 font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm sm:text-base lg:text-lg ${
                    modal.type === 'error'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/30 hover:shadow-red-500/40'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-500/30 hover:shadow-green-500/40'
                  }`}
                >
                  Entendido
                </button>

                {modal.type === 'error' && (
                  <button
                    onClick={() => {
                      closeModal();
                    }}
                    className="px-6 py-3 sm:py-3.5 lg:py-4 font-semibold rounded-xl transition-all duration-300 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 text-sm sm:text-base lg:text-lg border-2 border-gray-200 hover:border-gray-300"
                  >
                    Ayuda
                  </button>
                )}
              </div>

              {modal.type === 'error' && modal.title?.toLowerCase().includes('credenciales') && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-800 mb-1">Sugerencia:</p>
                      <p className="text-xs text-blue-700">Verifica que tu correo y contraseña sean correctos. Si el problema persiste, contacta al administrador del sistema.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
