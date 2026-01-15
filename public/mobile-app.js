// Configuración del servidor - CAMBIAR ESTA IP POR LA DE TU COMPUTADORA
const API_URL = 'http://192.168.1.100:4000'; // Cambia esto por tu IP local

// Variables globales
let currentUser = null;
let currentSessionId = null;

function getDeviceInfo() {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    (screen && screen.width ? `${screen.width}x${screen.height}` : 'N/A'),
    new Date().getTimezoneOffset()
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return {
    dispositivo_id: 'dev_' + Math.abs(hash).toString(16),
    mac_address: 'N/A',
    modelo: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
    plataforma: navigator.platform,
    navegador: navigator.userAgent,
    fecha_dispositivo: new Date().toISOString()
  };
}

// Funciones de API para móvil (sin Electron)
const api = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, dispositivo_info: getDeviceInfo() })
    });
    return response.json();
  },

  register: async (nombre, email, password, rol) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, rol })
    });
    return response.json();
  },

  logout: async (usuarioId, sesionId) => {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: usuarioId, sesion_id: sesionId })
    });
    return response.json();
  },

  getVehiculos: async () => {
    const response = await fetch(`${API_URL}/api/vehiculos`);
    return response.json();
  },

  addVehiculo: async (vehiculo) => {
    const response = await fetch(`${API_URL}/api/vehiculos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehiculo)
    });
    return response.json();
  },

  getClientes: async () => {
    const response = await fetch(`${API_URL}/api/clientes`);
    return response.json();
  },

  addCliente: async (cliente) => {
    const response = await fetch(`${API_URL}/api/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cliente)
    });
    return response.json();
  },

  getMinutas: async () => {
    const response = await fetch(`${API_URL}/api/minutas`);
    return response.json();
  },

  addMinuta: async (minuta) => {
    const response = await fetch(`${API_URL}/api/minutas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minuta)
    });
    return response.json();
  },

  getAlertasPremium: async (usuarioId) => {
    const response = await fetch(`${API_URL}/api/alertas-premium?usuario_id=${usuarioId}`);
    return response.json();
  },

  getUsuarios: async () => {
    const response = await fetch(`${API_URL}/api/usuarios/todos`);
    return response.json();
  },

  suspenderUsuario: async (id, motivo, mensaje, duracion, usuarioPremiumId) => {
    const response = await fetch(`${API_URL}/api/usuarios/${id}/suspender`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo, mensaje, duracion, usuario_premium_id: usuarioPremiumId })
    });
    return response.json();
  },

  reactivarUsuario: async (id, usuarioPremiumId) => {
    const response = await fetch(`${API_URL}/api/usuarios/${id}/reactivar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_premium_id: usuarioPremiumId })
    });
    return response.json();
  },

  trackNavegacion: async (sesionId, usuarioId, seccion, accion, detalles) => {
    const response = await fetch(`${API_URL}/api/tracking/navegacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sesion_id: sesionId, usuario_id: usuarioId, seccion, accion, detalles })
    });
    return response.json();
  },

  trackAccion: async (usuarioId, sesionId, tipoAccion, modulo, datosAccion) => {
    const response = await fetch(`${API_URL}/api/tracking/accion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: usuarioId, sesion_id: sesionId, tipo_accion: tipoAccion, modulo, datos_accion: datosAccion })
    });
    return response.json();
  },

  getAuditoria: async () => {
    const response = await fetch(`${API_URL}/api/auditoria`);
    return response.json();
  },

  exportarDatos: async () => {
    const response = await fetch(`${API_URL}/api/exportar-datos`);
    return response.json();
  }
};

// Funciones de navegación
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  
  if (currentUser && currentSessionId) {
    api.trackNavegacion(currentSessionId, currentUser.id, sectionId, 'visita', {});
  }

  // Cargar datos según la sección
  switch(sectionId) {
    case 'vehiculos':
      cargarVehiculos();
      break;
    case 'clientes':
      cargarClientes();
      break;
    case 'minutas':
      cargarMinutas();
      break;
    case 'usuarios':
      cargarUsuarios();
      break;
    case 'auditoria':
      cargarAuditoria();
      break;
  }
}

function showMainMenu(show) {
  const buttons = document.querySelectorAll('.nav-btn');
  buttons.forEach(btn => {
    if (btn.classList.contains('premium-only')) {
      btn.style.display = (show && currentUser && currentUser.es_premium) ? 'inline-block' : 'none';
    } else if (btn.classList.contains('admin-only')) {
      btn.style.display = (show && currentUser && (currentUser.rol === 'administrador' || currentUser.es_premium)) ? 'inline-block' : 'none';
    } else {
      btn.style.display = show ? 'inline-block' : 'none';
    }
  });
}

// Funciones de autenticación
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const result = await api.login(email, password);
    
    if (result.user) {
      currentUser = result.user;
      currentSessionId = result.user.sesion_id;
      
      document.getElementById('userInfo').textContent = `${currentUser.nombre} (${currentUser.rol})`;
      showMainMenu(true);
      showSection('dashboard');
      
      alert('✅ Bienvenido ' + currentUser.nombre);
    } else {
      alert('❌ ' + (result.message || 'Error al iniciar sesión'));
    }
  } catch (error) {
    alert('❌ Error de conexión: ' + error.message);
  }
}

async function register() {
  const nombre = document.getElementById('regNombre').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const rol = document.getElementById('regRol').value;

  try {
    const result = await api.register(nombre, email, password, rol);
    
    if (result.user) {
      alert('✅ Usuario registrado correctamente');
      showSection('login');
    } else {
      alert('❌ ' + (result.message || 'Error al registrar'));
    }
  } catch (error) {
    alert('❌ Error de conexión: ' + error.message);
  }
}

async function logout() {
  if (currentUser && currentSessionId) {
    try {
      await api.logout(currentUser.id, currentSessionId);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  
  currentUser = null;
  currentSessionId = null;
  showMainMenu(false);
  showSection('login');
  alert('👋 Sesión cerrada');
}

// Funciones de carga de datos
async function cargarVehiculos() {
  try {
    const vehiculos = await api.getVehiculos();
    const container = document.getElementById('vehiculosList');
    
    if (!container) return;
    
    container.innerHTML = vehiculos.map(v => `
      <div class="card vehiculo-card">
        <h3>${v.marca} ${v.modelo} ${v.version || ''}</h3>
        <p><strong>Año:</strong> ${v.anio}</p>
        <p><strong>Precio:</strong> $${v.precio?.toLocaleString() || 'N/A'}</p>
        <p><strong>Estado:</strong> <span class="estado-${v.estado}">${v.estado}</span></p>
        <p><strong>Condición:</strong> ${v.condicion}</p>
      </div>
    `).join('') || '<p>No hay vehículos registrados</p>';
  } catch (error) {
    console.error('Error cargando vehículos:', error);
  }
}

async function cargarClientes() {
  try {
    const clientes = await api.getClientes();
    const container = document.getElementById('clientesList');
    
    if (!container) return;
    
    container.innerHTML = clientes.map(c => `
      <div class="card cliente-card">
        <h3>${c.nombre} ${c.apellido}</h3>
        <p><strong>DNI:</strong> ${c.dni}</p>
        <p><strong>Teléfono:</strong> ${c.telefono || 'N/A'}</p>
        <p><strong>Email:</strong> ${c.email || 'N/A'}</p>
      </div>
    `).join('') || '<p>No hay clientes registrados</p>';
  } catch (error) {
    console.error('Error cargando clientes:', error);
  }
}

async function cargarMinutas() {
  try {
    const minutas = await api.getMinutas();
    const container = document.getElementById('minutasList');
    
    if (!container) return;
    
    container.innerHTML = minutas.map(m => `
      <div class="card minuta-card">
        <h3>Minuta #${m.id}</h3>
        <p><strong>Vehículo:</strong> ${m.marca} ${m.modelo} ${m.anio}</p>
        <p><strong>Cliente:</strong> ${m.cliente_nombre} ${m.cliente_apellido}</p>
        <p><strong>Precio Final:</strong> $${m.precio_final?.toLocaleString() || 'N/A'}</p>
        <p><strong>Estado:</strong> <span class="estado-${m.estado}">${m.estado}</span></p>
      </div>
    `).join('') || '<p>No hay minutas registradas</p>';
  } catch (error) {
    console.error('Error cargando minutas:', error);
  }
}

async function cargarUsuarios() {
  if (!currentUser || !currentUser.es_premium) return;
  
  try {
    const usuarios = await api.getUsuarios();
    const container = document.getElementById('usuariosList');
    
    if (!container) return;
    
    container.innerHTML = usuarios.map(u => `
      <div class="card usuario-card ${u.habilitado ? 'activo' : 'suspendido'}">
        <h3>${u.nombre}</h3>
        <p><strong>Email:</strong> ${u.email}</p>
        <p><strong>Rol:</strong> ${u.rol}</p>
        <p><strong>Estado:</strong> ${u.habilitado ? '🟢 Activo' : '🔴 Suspendido'}</p>
        ${!u.es_premium ? `
          <div class="usuario-actions">
            ${u.habilitado ? 
              `<button class="btn btn-danger" onclick="suspenderUsuario(${u.id})">Suspender</button>` :
              `<button class="btn btn-success" onclick="reactivarUsuario(${u.id})">Reactivar</button>`
            }
          </div>
        ` : '<p><em>Usuario Premium</em></p>'}
      </div>
    `).join('') || '<p>No hay usuarios registrados</p>';
  } catch (error) {
    console.error('Error cargando usuarios:', error);
  }
}

async function cargarAuditoria() {
  if (!currentUser || !currentUser.es_premium) return;
  
  try {
    const auditoria = await api.getAuditoria();
    const container = document.getElementById('auditoriaBody');
    
    if (!container) return;
    
    container.innerHTML = auditoria.slice(0, 50).map(a => `
      <tr>
        <td>${new Date(a.created_at).toLocaleString()}</td>
        <td>${a.usuario_nombre || 'Sistema'}</td>
        <td>${a.accion}</td>
        <td>${a.tabla_afectada}</td>
      </tr>
    `).join('') || '<tr><td colspan="4">No hay registros</td></tr>';
  } catch (error) {
    console.error('Error cargando auditoría:', error);
  }
}

async function suspenderUsuario(id) {
  const motivo = prompt('Motivo de la suspensión:');
  if (!motivo) return;
  
  try {
    const result = await api.suspenderUsuario(id, motivo, 'Cuenta suspendida por el administrador', 'indefinido', currentUser.id);
    alert(result.message || 'Usuario suspendido');
    cargarUsuarios();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function reactivarUsuario(id) {
  if (!confirm('¿Reactivar este usuario?')) return;
  
  try {
    const result = await api.reactivarUsuario(id, currentUser.id);
    alert(result.message || 'Usuario reactivado');
    cargarUsuarios();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Funciones de formularios
async function agregarVehiculo(event) {
  event.preventDefault();
  
  const vehiculo = {
    tipo: document.getElementById('vehTipo').value,
    marca: document.getElementById('vehMarca').value,
    modelo: document.getElementById('vehModelo').value,
    version: document.getElementById('vehVersion').value,
    anio: document.getElementById('vehAnio').value,
    condicion: document.getElementById('vehCondicion').value,
    precio: document.getElementById('vehPrecio').value,
    dominio: document.getElementById('vehDominio').value
  };
  
  try {
    const result = await api.addVehiculo(vehiculo);
    alert(result.message || 'Vehículo agregado');
    cargarVehiculos();
    event.target.reset();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function agregarCliente(event) {
  event.preventDefault();
  
  const cliente = {
    nombre: document.getElementById('cliNombre').value,
    apellido: document.getElementById('cliApellido').value,
    dni: document.getElementById('cliDni').value,
    telefono: document.getElementById('cliTelefono').value,
    email: document.getElementById('cliEmail').value,
    direccion: document.getElementById('cliDireccion').value
  };
  
  try {
    const result = await api.addCliente(cliente);
    alert(result.message || 'Cliente agregado');
    cargarClientes();
    event.target.reset();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 App móvil lista');
  showMainMenu(false);
});
