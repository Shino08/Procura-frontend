// src/page/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NotificacionesPanel } from '../components/NotificacionesPanel';
import { useNotificaciones } from '../hooks/useNotifications';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Usuario');
  const [userRole, setUserRole] = useState('cliente'); // 'cliente' o 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notificacionesOpen, setNotificacionesOpen] = useState(false);
  const { notificacionesNoLeidas, actualizarContador } = useNotificaciones();

  useEffect(() => {
    // Obtener datos del usuario desde el token JWT
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');

    if (!token) {
      navigate('/login');
      return;
    }

    // Extraer nombre del email si existe
    if (userEmail) {
      const name = userEmail.split('@')[0];
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    }

    // Establecer rol
    if (role) {
      setUserRole(role);
    }
  }, [navigate]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setMobileMenuOpen(false);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const getRoleName = () => {
    return userRole === 'admin' ? 'Administrador de Procura' : 'Cliente de Procura';
  };

  // Acciones rápidas para CLIENTE (3 acciones simétricas)
  const clienteActions = [
    {
      title: 'Nueva Solicitud',
      description: 'Crear solicitud de compra',
      icon: 'upload',
      color: 'orange',
      link: '/solicitudes/nueva',
      gradient: true
    },
    {
      title: 'Mis Solicitudes',
      description: 'Ver historial completo',
      icon: 'list',
      color: 'orange',
      link: '/solicitudes/lista'
    },
  ];

  // Acciones rápidas para ADMINISTRADOR (3 acciones simétricas)
  const adminActions = [
    {
      title: 'Gestionar Solicitudes',
      description: 'Revisar y aprobar',
      icon: 'clipboard',
      color: 'orange',
      link: '/solicitudes/gestion',
      gradient: true
    },
    {
      title: 'Reportes Generales',
      description: 'Análisis de datos',
      icon: 'chart',
      color: 'orange',
      link: '/reportes'
    }
  ];

  const quickActions = userRole === 'admin' ? adminActions : clienteActions;

  // Stats diferentes según rol
  const statsCliente = [
    { label: 'Mis Solicitudes', value: '12', icon: 'document', color: 'blue', badge: '+3 este mes' },
    { label: 'En Proceso', value: '5', icon: 'clock', color: 'orange', badge: 'Pendientes' },
    { label: 'Completadas', value: '7', icon: 'check', color: 'green', badge: '58%' }
  ];

  const statsAdmin = [
    { label: 'Total Solicitudes', value: '48', icon: 'document', color: 'blue', badge: '+8 esta semana' },
    { label: 'Por Revisar', value: '15', icon: 'clock', color: 'orange', badge: 'Urgente' },
    { label: 'Procesadas', value: '33', icon: 'check', color: 'green', badge: '69%' }
  ];

  const stats = userRole === 'admin' ? statsAdmin : statsCliente;

  // Solicitudes recientes según rol
  const solicitudesCliente = [
    { 
      id: 'SOL-2025-001', 
      archivo: 'solicitud_proyecto_norte.xlsx', 
      items: 156,
      estado: 'Aprobada', 
      fecha: '27 Nov 2025',
      progreso: 100
    },
    { 
      id: 'SOL-2025-002', 
      archivo: 'mantenimiento_preventivo.csv', 
      items: 89,
      estado: 'En Proceso', 
      fecha: '26 Nov 2025',
      progreso: 65
    },
    { 
      id: 'SOL-2025-003', 
      archivo: 'reposicion_stock.xlsx', 
      items: 234,
      estado: 'Pendiente', 
      fecha: '25 Nov 2025',
      progreso: 0
    },
    { 
      id: 'SOL-2025-004', 
      archivo: 'equipamiento_obra_sur.xlsx', 
      items: 67,
      estado: 'Completada', 
      fecha: '24 Nov 2025',
      progreso: 100
    },
  ];

  const solicitudesAdmin = [
    { 
      id: 'SOL-2025-006', 
      cliente: 'Juan Pérez',
      archivo: 'suministros_diciembre.xlsx', 
      items: 145,
      estado: 'En Revisión', 
      fecha: '28 Nov 2025',
      progreso: 45
    },
    { 
      id: 'SOL-2025-005', 
      cliente: 'María González',
      archivo: 'sistema_contraincendios.csv', 
      items: 312,
      estado: 'Pendiente', 
      fecha: '27 Nov 2025',
      progreso: 20
    },
    { 
      id: 'SOL-2025-004', 
      cliente: 'Carlos Ramírez',
      archivo: 'equipamiento_obra.xlsx', 
      items: 67,
      estado: 'Aprobada', 
      fecha: '26 Nov 2025',
      progreso: 100
    },
    { 
      id: 'SOL-2025-003', 
      cliente: 'Ana Torres',
      archivo: 'materiales_construccion.xlsx', 
      items: 234,
      estado: 'En Proceso', 
      fecha: '25 Nov 2025',
      progreso: 75
    },
  ];

  const solicitudesRecientes = userRole === 'admin' ? solicitudesAdmin : solicitudesCliente;

  const renderIcon = (iconName, className = "w-5 h-5 sm:w-6 sm:h-6") => {
    const icons = {
      upload: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />,
      list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
      chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      box: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
      clipboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
      document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
      check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
      file: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    };
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">{icons[iconName]}</svg>;
  };

  const getEstadoConfig = (estado) => {
    const configs = {
      'Pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      'En Revisión': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'En Proceso': { bg: 'bg-orange-100', text: 'text-orange-700' },
      'Aprobada': { bg: 'bg-green-100', text: 'text-green-700' },
      'Completada': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      'Rechazada': { bg: 'bg-red-100', text: 'text-red-700' }
    };
    return configs[estado] || configs['Pendiente'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="./src/assets/logo20.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
              <div>
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">Sistema Procura</h1>
                <p className="text-xs text-gray-500 hidden sm:block">B&D</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => setNotificacionesOpen(true)}
                className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificacionesNoLeidas > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full">
                    {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                  </span>
                )}
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{userName}</p>
                  <p className="text-xs text-gray-500">{getRoleName()}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
              </div>

              <button
                onClick={handleLogoutClick}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{userName}</p>
                  <p className="text-xs text-gray-500">{getRoleName()}</p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setNotificacionesOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Notificaciones</span>
                {notificacionesNoLeidas > 0 && (
                  <span className="ml-auto text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-semibold">
                    {notificacionesNoLeidas}
                  </span>
                )}
              </button>

              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 border-t border-gray-200 pt-3 mt-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            ¡Bienvenido, {userName}!
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {userRole === 'admin' 
              ? 'Gestiona y aprueba solicitudes de compra de tus clientes' 
              : 'Administra tus solicitudes de compra y realiza seguimiento'}
          </p>
        </div>

        {/* Quick Actions - SIMÉTRICO (3 botones siempre) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link} className="group">
              <div className={`${
                action.gradient 
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-xl hover:shadow-orange-500/30' 
                  : 'bg-white border-2 border-gray-200 hover:border-orange-500 hover:shadow-xl'
              } rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1`}>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${
                  action.gradient 
                    ? 'bg-white/20' 
                    : 'bg-orange-100 group-hover:bg-orange-500'
                } rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <div className={action.gradient ? 'text-white' : 'text-orange-600 group-hover:text-white transition-colors'}>
                    {renderIcon(action.icon)}
                  </div>
                </div>
                <h3 className={`text-sm sm:text-base lg:text-lg font-bold mb-0.5 sm:mb-1 ${
                  action.gradient ? 'text-white' : 'text-gray-800'
                }`}>
                  {action.title}
                </h3>
                <p className={`text-xs sm:text-sm opacity-90 ${
                  action.gradient ? 'text-white' : 'text-gray-600'
                }`}>
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Cards - SIMÉTRICO (3 cards siempre) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${stat.color}-100 rounded-lg sm:rounded-xl flex items-center justify-center`}>
                  <div className={`text-${stat.color}-600`}>
                    {renderIcon(stat.icon)}
                  </div>
                </div>
                <span className={`text-xs sm:text-sm font-medium text-${stat.color}-600 bg-${stat.color}-50 px-2 sm:px-3 py-1 rounded-full`}>
                  {stat.badge}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">{stat.value}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Items Table */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {userRole === 'admin' ? 'Solicitudes Recientes de Clientes' : 'Mis Solicitudes Recientes'}
              </h3>
              <Link 
                to={userRole === 'admin' ? '/solicitudes/gestion' : '/solicitudes/lista'}
                className="text-xs sm:text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                Ver todas
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    N° Solicitud
                  </th>
                  {userRole === 'admin' && (
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cliente
                    </th>
                  )}
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Archivo
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ítems
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {solicitudesRecientes.map((solicitud, index) => {
                  const estadoConfig = getEstadoConfig(solicitud.estado);
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                            {renderIcon('document', 'w-5 h-5 text-orange-600')}
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{solicitud.id}</span>
                        </div>
                      </td>
                      {userRole === 'admin' && (
                        <td className="px-4 lg:px-6 py-4 text-sm font-medium text-gray-700">
                          {solicitud.cliente}
                        </td>
                      )}
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2 max-w-xs">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-700 truncate" title={solicitud.archivo}>
                            {solicitud.archivo}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                          {solicitud.items}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                          {solicitud.estado}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{solicitud.fecha}</td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <Link 
                          to={userRole === 'admin' ? `/solicitudes/gestion/${solicitud.id}` : `/solicitudes/lista/${solicitud.id}`}
                          className="text-xs sm:text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center justify-end gap-1"
                        >
                          Ver detalles
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {solicitudesRecientes.map((solicitud, index) => {
              const estadoConfig = getEstadoConfig(solicitud.estado);
              
              return (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {renderIcon('document', 'w-5 h-5 text-orange-600')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{solicitud.id}</p>
                          {userRole === 'admin' && (
                            <p className="text-xs text-gray-500">{solicitud.cliente}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                          {solicitud.items} ítems
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 truncate">{solicitud.archivo}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                            {solicitud.estado}
                          </span>
                          <span className="text-xs text-gray-500">{solicitud.fecha}</span>
                        </div>
                        <Link 
                          to={userRole === 'admin' ? `/solicitudes/gestion/${solicitud.id}` : `/solicitudes/lista/${solicitud.id}`}
                          className="text-orange-600 hover:text-orange-700 font-medium text-xs"
                        >
                          Ver →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Panel de Notificaciones */}
      <NotificacionesPanel 
        isOpen={notificacionesOpen}
        onClose={() => {
          setNotificacionesOpen(false);
          actualizarContador();
        }}
      />

      {/* Modal de Confirmación */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-scale-in">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-2">
              ¿Cerrar Sesión?
            </h3>

            <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
              ¿Estás seguro de que deseas cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder al sistema.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLogoutCancel}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-red-500/30 hover:shadow-xl text-sm sm:text-base"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
