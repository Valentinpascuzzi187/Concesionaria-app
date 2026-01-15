const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login: async (email, password) => {
    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },
  
  register: async (nombre, email, password, rol = 'vendedor') => {
    try {
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, rol })
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  getVehiculos: async () => {
    try {
      const response = await fetch('http://localhost:4000/api/vehiculos');
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  createVehiculo: async (vehiculoData) => {
    try {
      const response = await fetch('http://localhost:4000/api/vehiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehiculoData)
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  getClientes: async () => {
    try {
      const response = await fetch('http://localhost:4000/api/clientes');
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  createCliente: async (clienteData) => {
    try {
      const response = await fetch('http://localhost:4000/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData)
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  getMinutas: async () => {
    try {
      const response = await fetch('http://localhost:4000/api/minutas');
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  createMinuta: async (minutaData) => {
    try {
      const response = await fetch('http://localhost:4000/api/minutas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minutaData)
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  // Auditoría y notificaciones
  getNotificaciones: async () => {
    try {
      const response = await fetch('http://localhost:4000/api/notificaciones');
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  marcarNotificacionLeida: async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/api/notificaciones/${id}/leida`, {
        method: 'POST'
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  getAuditoria: async () => {
    try {
      const response = await fetch('http://localhost:4000/api/auditoria');
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  getHistorial: async (tabla, registroId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/historial/${tabla}/${registroId}`);
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  deleteVehiculo: async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/api/vehiculos/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  // Tracking y vigilancia
  registrarNavegacion: async (usuarioId, sesionId, seccion, accion, detalles) => {
    try {
      const response = await fetch('http://localhost:4000/api/tracking/navegacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, sesion_id: sesionId, seccion, accion, detalles })
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  registrarAccion: async (usuarioId, sesionId, tipoAccion, modulo, datosAccion) => {
    try {
      const response = await fetch('http://localhost:4000/api/tracking/accion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, sesion_id: sesionId, tipo_accion: tipoAccion, modulo, datos_accion })
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  logout: async (usuarioId, sesionId) => {
    try {
      const response = await fetch('http://localhost:4000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, sesion_id: sesionId })
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  getAlertasPremium: async () => {
    try {
      const response = await fetch('http://localhost:4000/api/alertas-premium');
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  marcarAlertaLeida: async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/api/alertas-premium/${id}/leida`, {
        method: 'POST'
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  getSesionesUsuario: async (usuarioId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/tracking/sesiones/${usuarioId}`);
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  getNavegacionUsuario: async (usuarioId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/tracking/navegacion/${usuarioId}`);
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },
  
  // Funciones de exportación y respaldo de datos
  exportarDatos: () => ipcRenderer.invoke('exportar-datos'),
  
  importarDatos: (datos) => ipcRenderer.invoke('importar-datos', datos),
  
  // Funciones de eliminación para Admin Premium
  deleteVehiculo: async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/api/vehiculos/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  deleteCliente: async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/api/clientes/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  deleteMinuta: async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/api/minutas/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  },

  // Función para descargar respaldo
  descargarRespaldo: () => ipcRenderer.invoke('descargar-respaldo')
});
