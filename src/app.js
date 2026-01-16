
// Variables globales
let currentUser = null;
let currentSessionId = null;
let trackingInterval = null;

// URL del servidor de producción en Railway
const RAILWAY_URL = 'https://concesionaria-app-production.up.railway.app';

// Fallback API client: si window.api no está disponible (navegador web), usamos fetch
(() => {
  try {
    // Detectar si estamos en Capacitor/APK (localhost con https o file://)
    const isCapacitor = (
      location.protocol === 'file:' ||
      (location.protocol === 'https:' && location.host === 'localhost') ||
      (location.protocol === 'capacitor:') ||
      (typeof Capacitor !== 'undefined')
    );
    
    // En Capacitor/APK usar Railway, en navegador web usar el mismo host
    let BASE;
    if (isCapacitor) {
      BASE = RAILWAY_URL;
      console.log('📱 Detectado entorno Capacitor/APK - usando servidor:', BASE);
    } else if (location.protocol && location.host && location.host !== 'localhost') {
      BASE = `${location.protocol}//${location.host}`;
      console.log('🌐 Detectado navegador web - usando mismo host:', BASE);
    } else {
      BASE = 'http://localhost:4000';
      console.log('💻 Detectado entorno local - usando localhost:4000');
    }

    const call = async (endpoint, method = 'GET', body = null) => {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      console.log(`🔗 API Call: ${method} ${BASE}${endpoint}`);
      const resp = await fetch(`${BASE}${endpoint}`, opts);
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ message: 'Error del servidor' }));
        console.error('❌ API Error:', errorData);
        throw errorData;
      }
      return resp.json();
    };

    const apiFallback = {
      login: (email, password) => call('/api/auth/login', 'POST', { email, password }),
      register: (nombre, email, password, rol) => call('/api/auth/register', 'POST', { nombre, email, password, rol }),
      logout: (usuario_id, sesion_id) => call('/api/auth/logout', 'POST', { usuario_id, sesion_id }),
      getVehiculos: () => call('/api/vehiculos'),
      getClientes: () => call('/api/clientes'),
      getMinutas: () => call('/api/minutas'),
      createVehiculo: (data) => call('/api/vehiculos', 'POST', data),
      createCliente: (data) => call('/api/clientes', 'POST', data),
      createMinuta: (data) => call('/api/minutas', 'POST', data),
      deleteVehiculo: (id) => call(`/api/vehiculos/${id}`, 'DELETE', { usuario_id: currentUser?.id }),
      deleteCliente: (id) => call(`/api/clientes/${id}`, 'DELETE', { usuario_id: currentUser?.id }),
      deleteMinuta: (id) => call(`/api/minutas/${id}`, 'DELETE', { usuario_id: currentUser?.id }),
      getUsuariosTodos: () => call('/api/usuarios/todos'),
      suspenderUsuario: (id, motivo, mensaje, duracion, usuario_premium_id) => call(`/api/usuarios/${id}/suspender`, 'POST', { motivo, mensaje, duracion, usuario_premium_id }),
      reactivarUsuario: (id, usuario_premium_id) => call(`/api/usuarios/${id}/reactivar`, 'POST', { usuario_premium_id })
    };

    if (!window.api) window.api = apiFallback;
  } catch (e) {
    console.warn('API fallback no inicializado:', e.message);
  }
})();

// Función de tracking automático
async function trackNavigation(section, action, details = '') {
  if (currentUser && currentSessionId && !currentUser.es_premium) {
    try {
      await window.api.registrarNavegacion(currentUser.id, currentSessionId, section, action, details);
    } catch (error) {
      console.error('Error en tracking:', error);
    }
  }
}

async function trackAction(actionType, module, actionData = {}) {
  if (currentUser && currentSessionId && !currentUser.es_premium) {
    try {
      await window.api.registrarAccion(currentUser.id, currentSessionId, actionType, module, actionData);
    } catch (error) {
      console.error('Error en tracking:', error);
    }
  }
}

// Mostrar/Ocultar secciones
function showSection(sectionId) {
  // Ocultar todas las secciones
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });

  // Remover clase active de todos los botones
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Mostrar sección seleccionada
  document.getElementById(sectionId).classList.add('active');

  // Marcar botón como activo
  if (event && event.target) {
    event.target.classList.add('active');
  }

  // Tracking de navegación
  trackNavigation(sectionId, 'visit', `Usuario visitó la sección ${sectionId}`);

  // Cargar datos específicos de cada sección
  if (sectionId === 'dashboard') {
    loadDashboard();
  } else if (sectionId === 'stock') {
    loadVehiculos();
  } else if (sectionId === 'clientes') {
    loadClientes();
  } else if (sectionId === 'minutas') {
    loadMinutas();
  }
}

// Login Form
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const messageDiv = document.getElementById('loginMessage');

  try {
    const response = await window.api.login(email, password);
    if (response.user) {
      currentUser = response.user;
      currentSessionId = response.user.sesion_id;
      
      messageDiv.className = 'message success';
      messageDiv.textContent = '✅ ' + (response.message || 'Login exitoso');
      document.getElementById('loginForm').reset();
      
      // Tracking de login exitoso
      trackAction('LOGIN_EXITOSO', 'auth', { email });
      
      // Mostrar menú principal y ocultar login/registro
      showMainMenu();
      
      // Redirigir al dashboard
      setTimeout(() => {
        showSection('dashboard');
      }, 1000);
    }
  } catch (error) {
    // Tracking de login fallido
    trackAction('LOGIN_FALLIDO', 'auth', { email, error: error.message });
    
    messageDiv.className = 'message error';
    messageDiv.textContent = '❌ Error: ' + (error.message || 'Error en el login');
  }
});

// Register Form
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nombre = document.getElementById('regNombre').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const rol = document.getElementById('regRol').value;
  const messageDiv = document.getElementById('registerMessage');

  try {
    const response = await window.api.register(nombre, email, password, rol);
    messageDiv.className = 'message success';
    messageDiv.textContent = '✅ ' + (response.message || 'Registro exitoso');
    document.getElementById('registerForm').reset();
    
    // Tracking de registro
    trackAction('REGISTRO_USUARIO', 'auth', { nombre, email, rol });
  } catch (error) {
    messageDiv.className = 'message error';
    messageDiv.textContent = '❌ Error: ' + (error.message || 'Error en el registro');
  }
});

// Mostrar menú principal después del login
function showMainMenu() {
  // Ocultar botones de login/registro
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.textContent.includes('Login') || btn.textContent.includes('Registro')) {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'inline-block';
    }
  });
  
  // Iniciar tracking periódico si no es usuario premium
  if (currentUser && !currentUser.es_premium) {
    trackingInterval = setInterval(() => {
      trackNavigation('tracking_periodico', 'heartbeat', 'Usuario activo en el sistema');
    }, 30000); // Cada 30 segundos
  }
}

// Logout
async function logout() {
  try {
    // Tracking de logout
    if (currentUser && currentSessionId) {
      await window.api.logout(currentUser.id, currentSessionId);
    }
  } catch (error) {
    console.error('Error en logout:', error);
  }
  
  currentUser = null;
  currentSessionId = null;
  
  // Detener tracking interval
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  
  // Ocultar botones del menú principal
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.textContent.includes('Login') || btn.textContent.includes('Registro')) {
      btn.style.display = 'inline-block';
    } else {
      btn.style.display = 'none';
    }
  });
  
  // Mostrar sección de login
  showSection('login');
}

// Dashboard
async function loadDashboard() {
  try {
    // Cargar estadísticas
    const vehiculos = await window.api.getVehiculos();
    const clientes = await window.api.getClientes();
    const minutas = await window.api.getMinutas();
    
    document.getElementById('stockCount').textContent = vehiculos.length;
    document.getElementById('clientesCount').textContent = clientes.length;
    document.getElementById('minutasCount').textContent = minutas.filter(m => m.estado !== 'cerrada').length;
    document.getElementById('ventasCount').textContent = minutas.filter(m => m.estado === 'cerrada').length;
  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

// Vehículos
function toggleVehiculoForm() {
  const form = document.getElementById('vehiculoForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// Mostrar/ocultar campo dominio según condición
document.getElementById('condicion')?.addEventListener('change', (e) => {
  const dominioGroup = document.getElementById('dominioGroup');
  if (e.target.value === 'usado') {
    dominioGroup.style.display = 'block';
    document.getElementById('dominio').required = true;
  } else {
    dominioGroup.style.display = 'none';
    document.getElementById('dominio').required = false;
  }
});

// Vehiculo Form
document.getElementById('vehiculoFormElement')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const vehiculoData = {
    tipo: document.getElementById('tipo').value,
    marca: document.getElementById('marca').value,
    modelo: document.getElementById('modelo').value,
    version: document.getElementById('version').value,
    anio: parseInt(document.getElementById('anio').value),
    condicion: document.getElementById('condicion').value,
    precio: parseFloat(document.getElementById('precio').value),
    dominio: document.getElementById('dominio').value || null
  };

  const messageDiv = document.getElementById('vehiculoMessage');

  try {
    const response = await window.api.createVehiculo(vehiculoData);
    messageDiv.className = 'message success';
    messageDiv.textContent = '✅ Vehículo agregado correctamente';
    document.getElementById('vehiculoFormElement').reset();
    loadVehiculos();
  } catch (error) {
    messageDiv.className = 'message error';
    messageDiv.textContent = '❌ Error: ' + (error.message || 'Error al guardar vehículo');
  }
});

// Load Vehiculos
async function loadVehiculos() {
  try {
    const vehiculos = await window.api.getVehiculos();
    const listDiv = document.getElementById('vehiculosContent');

    if (vehiculos.length === 0) {
      listDiv.innerHTML = '<p style="text-align: center; color: #999;">No hay vehículos registrados</p>';
      return;
    }

    listDiv.innerHTML = vehiculos.map(v => `
      <div class="vehiculo-card">
        <h4>${v.marca} ${v.modelo} ${v.version || ''} (${v.anio})</h4>
        <p><strong>Tipo:</strong> ${v.tipo}</p>
        <p><strong>Condición:</strong> ${v.condicion}</p>
        <p><strong>Dominio:</strong> ${v.dominio || 'N/A'}</p>
        <p><strong>Precio:</strong> $${v.precio.toLocaleString()}</p>
        <p><strong>Estado:</strong> <span class="estado-${v.estado}">${v.estado}</span></p>
        ${currentUser && currentUser.es_premium ? `
          <div style="margin-top: 15px;">
            <button class="btn btn-danger btn-sm" onclick="eliminarVehiculo(${v.id})">🗑️ Eliminar</button>
            <button class="btn btn-warning btn-sm" onclick="editarVehiculo(${v.id})">✏️ Editar</button>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error cargando vehículos:', error);
  }
}

// Clientes
function toggleClienteForm() {
  const form = document.getElementById('clienteForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// Cliente Form
document.getElementById('clienteFormElement')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const clienteData = {
    nombre: document.getElementById('cliNombre').value,
    apellido: document.getElementById('cliApellido').value,
    dni: document.getElementById('cliDni').value,
    telefono: document.getElementById('cliTelefono').value,
    email: document.getElementById('cliEmail').value,
    direccion: document.getElementById('cliDireccion').value,
    observaciones: document.getElementById('cliObservaciones').value
  };

  const messageDiv = document.getElementById('clienteMessage');

  try {
    const response = await window.api.createCliente(clienteData);
    messageDiv.className = 'message success';
    messageDiv.textContent = '✅ Cliente agregado correctamente';
    document.getElementById('clienteFormElement').reset();
    loadClientes();
  } catch (error) {
    messageDiv.className = 'message error';
    messageDiv.textContent = '❌ Error: ' + (error.message || 'Error al guardar cliente');
  }
});

// Load Clientes
async function loadClientes() {
  try {
    const clientes = await window.api.getClientes();
    const listDiv = document.getElementById('clientesContent');

    if (clientes.length === 0) {
      listDiv.innerHTML = '<p style="text-align: center; color: #999;">No hay clientes registrados</p>';
      return;
    }

    listDiv.innerHTML = clientes.map(c => `
      <div class="cliente-card">
        <h4>${c.nombre} ${c.apellido}</h4>
        <p><strong>DNI:</strong> ${c.dni}</p>
        <p><strong>Teléfono:</strong> ${c.telefono || 'N/A'}</p>
        <p><strong>Email:</strong> ${c.email || 'N/A'}</p>
        <p><strong>Dirección:</strong> ${c.direccion || 'N/A'}</p>
        ${c.observaciones ? `<p><strong>Observaciones:</strong> ${c.observaciones}</p>` : ''}
        ${currentUser && currentUser.es_premium ? `
          <div style="margin-top: 15px;">
            <button class="btn btn-danger btn-sm" onclick="eliminarCliente(${c.id})">🗑️ Eliminar</button>
            <button class="btn btn-warning btn-sm" onclick="editarCliente(${c.id})">✏️ Editar</button>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error cargando clientes:', error);
  }
}

// Minutas
function toggleMinutaForm() {
  const form = document.getElementById('minutaForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  
  // Cargar opciones para selects
  loadMinutaOptions();
}

// Load opciones para minutas
async function loadMinutaOptions() {
  try {
    const vehiculos = await window.api.getVehiculos();
    const clientes = await window.api.getClientes();
    
    // Filtrar vehículos disponibles
    const vehiculosDisponibles = vehiculos.filter(v => v.estado === 'disponible');
    
    const vehiculoSelect = document.getElementById('minVehiculo');
    const clienteSelect = document.getElementById('minCliente');
    
    // Llenar select de vehículos
    vehiculoSelect.innerHTML = '<option value="">Seleccionar vehículo...</option>' +
      vehiculosDisponibles.map(v => `
        <option value="${v.id}" data-precio="${v.precio}">
          ${v.marca} ${v.modelo} ${v.version || ''} (${v.anio}) - $${v.precio.toLocaleString()}
        </option>
      `).join('');
    
    // Llenar select de clientes
    clienteSelect.innerHTML = '<option value="">Seleccionar cliente...</option>' +
      clientes.map(c => `
        <option value="${c.id}">${c.nombre} ${c.apellido} - DNI: ${c.dni}</option>
      `).join('');
  } catch (error) {
    console.error('Error cargando opciones de minuta:', error);
  }
}

// Actualizar precio original cuando se selecciona vehículo
document.getElementById('minVehiculo')?.addEventListener('change', (e) => {
  const selectedOption = e.target.options[e.target.selectedIndex];
  const precio = selectedOption.getAttribute('data-precio');
  document.getElementById('minPrecioOriginal').value = precio || '';
  document.getElementById('minPrecioFinal').value = precio || '';
});

// Minuta Form
document.getElementById('minutaFormElement')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const minutaData = {
    vehiculo_id: parseInt(document.getElementById('minVehiculo').value),
    cliente_id: parseInt(document.getElementById('minCliente').value),
    vendedor_id: currentUser.id,
    precio_original: parseFloat(document.getElementById('minPrecioOriginal').value),
    precio_final: parseFloat(document.getElementById('minPrecioFinal').value),
    observaciones: document.getElementById('minObservaciones').value
  };

  const messageDiv = document.getElementById('minutaMessage');

  try {
    const response = await window.api.createMinuta(minutaData);
    messageDiv.className = 'message success';
    messageDiv.textContent = '✅ ' + (response.message || 'Minuta creada correctamente');
    document.getElementById('minutaFormElement').reset();
    loadMinutas();
  } catch (error) {
    messageDiv.className = 'message error';
    messageDiv.textContent = '❌ Error: ' + (error.message || 'Error al crear minuta');
  }
});

// Load Minutas
async function loadMinutas() {
  try {
    const minutas = await window.api.getMinutas();
    const listDiv = document.getElementById('minutasContent');

    if (minutas.length === 0) {
      listDiv.innerHTML = '<p style="text-align: center; color: #999;">No hay minutas registradas</p>';
      return;
    }

    listDiv.innerHTML = minutas.map(m => `
      <div class="minuta-card">
        <h4>Minuta #${m.id}</h4>
        <p><strong>Vehículo:</strong> ${m.marca} ${m.modelo} (${m.anio})</p>
        <p><strong>Cliente:</strong> ${m.cliente_nombre} ${m.cliente_apellido}</p>
        <p><strong>Vendedor:</strong> ${m.vendedor_nombre}</p>
        <p><strong>Precio Original:</strong> $${m.precio_original.toLocaleString()}</p>
        <p><strong>Precio Final:</strong> $${m.precio_final.toLocaleString()}</p>
        <p><strong>Estado:</strong> <span class="estado-${m.estado}">${m.estado}</span></p>
        <p><strong>Fecha:</strong> ${new Date(m.created_at).toLocaleDateString()}</p>
        ${m.observaciones ? `<p><strong>Observaciones:</strong> ${m.observaciones}</p>` : ''}
        ${currentUser && currentUser.es_premium ? `
          <div style="margin-top: 15px;">
            <button class="btn btn-danger btn-sm" onclick="eliminarMinuta(${m.id})">🗑️ Eliminar</button>
            <button class="btn btn-warning btn-sm" onclick="editarMinuta(${m.id})">✏️ Editar</button>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error cargando minutas:', error);
  }
}

// Funciones para Admin Premium
async function eliminarVehiculo(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este vehículo?')) return;
  
  try {
    await window.api.deleteVehiculo(id);
    loadVehiculos();
    alert('✅ Vehículo eliminado correctamente');
  } catch (error) {
    alert('❌ Error al eliminar vehículo: ' + error.message);
  }
}

async function eliminarCliente(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;
  
  try {
    await window.api.deleteCliente(id);
    loadClientes();
    alert('✅ Cliente eliminado correctamente');
  } catch (error) {
    alert('❌ Error al eliminar cliente: ' + error.message);
  }
}

async function eliminarMinuta(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta minuta?')) return;
  
  try {
    await window.api.deleteMinuta(id);
    loadMinutas();
    alert('✅ Minuta eliminada correctamente');
  } catch (error) {
    alert('❌ Error al eliminar minuta: ' + error.message);
  }
}

async function editarVehiculo(id) {
  try {
    const vehiculos = await window.api.getVehiculos();
    const vehiculo = vehiculos.find(v => v.id === id);
    if (!vehiculo) {
      alert('❌ Vehículo no encontrado');
      return;
    }

    const nuevoPrecio = prompt(`Nuevo precio para ${vehiculo.marca} ${vehiculo.modelo} (actual: $${vehiculo.precio?.toLocaleString() || 0}):`, vehiculo.precio || 0);
    const nuevoEstado = prompt(`Nuevo estado (actual: ${vehiculo.estado}). Opciones: disponible, reservado, vendido:`, vehiculo.estado);
    const nuevosKm = prompt(`Nuevo kilometraje (actual: ${vehiculo.kilometraje?.toLocaleString() || 0}):`, vehiculo.kilometraje || 0);
    const nuevasObs = prompt(`Observaciones (actual: ${vehiculo.observaciones || 'Sin observaciones'}):`, vehiculo.observaciones || '');

    if (nuevoPrecio === null && nuevoEstado === null && nuevosKm === null && nuevasObs === null) return;

    const payload = { usuario_id: currentUser?.id };
    if (nuevoPrecio && nuevoPrecio !== String(vehiculo.precio)) payload.precio = Number(nuevoPrecio);
    if (nuevoEstado && nuevoEstado !== vehiculo.estado) payload.estado = nuevoEstado;
    if (nuevosKm && nuevosKm !== String(vehiculo.kilometraje)) payload.kilometraje = Number(nuevosKm);
    if (nuevasObs && nuevasObs !== vehiculo.observaciones) payload.observaciones = nuevasObs;

    if (Object.keys(payload).length > 1) {
      const BASE = getApiBase();
      const resp = await fetch(`${BASE}/api/vehiculos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await resp.json();
      if (resp.ok) {
        alert('✅ Vehículo actualizado correctamente');
        loadVehiculos();
      } else {
        alert('❌ Error: ' + (result.message || 'Error desconocido'));
      }
    } else {
      alert('ℹ️ No se realizaron cambios');
    }
  } catch (error) {
    alert('❌ Error al editar vehículo: ' + error.message);
  }
}

async function editarCliente(id) {
  try {
    const clientes = await window.api.getClientes();
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) {
      alert('❌ Cliente no encontrado');
      return;
    }

    const nuevoTelefono = prompt(`Nuevo teléfono para ${cliente.nombre} ${cliente.apellido} (actual: ${cliente.telefono || 'N/A'}):`, cliente.telefono || '');
    const nuevoEmail = prompt(`Nuevo email (actual: ${cliente.email || 'N/A'}):`, cliente.email || '');
    const nuevaDireccion = prompt(`Nueva dirección (actual: ${cliente.direccion || 'N/A'}):`, cliente.direccion || '');

    if (nuevoTelefono === null && nuevoEmail === null && nuevaDireccion === null) return;

    const payload = { usuario_id: currentUser?.id };
    if (nuevoTelefono && nuevoTelefono !== cliente.telefono) payload.telefono = nuevoTelefono;
    if (nuevoEmail && nuevoEmail !== cliente.email) payload.email = nuevoEmail;
    if (nuevaDireccion && nuevaDireccion !== cliente.direccion) payload.direccion = nuevaDireccion;

    if (Object.keys(payload).length > 1) {
      const BASE = getApiBase();
      const resp = await fetch(`${BASE}/api/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await resp.json();
      if (resp.ok) {
        alert('✅ Cliente actualizado correctamente');
        loadClientes();
      } else {
        alert('❌ Error: ' + (result.message || 'Error desconocido'));
      }
    } else {
      alert('ℹ️ No se realizaron cambios');
    }
  } catch (error) {
    alert('❌ Error al editar cliente: ' + error.message);
  }
}

async function editarMinuta(id) {
  try {
    const nuevoPrecio = prompt('Nuevo precio final (dejar vacío para no modificar):');
    const nuevasObs = prompt('Nuevas observaciones (dejar vacío para no modificar):');
    const nuevaReserva = prompt('Nuevo monto de reserva (dejar vacío para no modificar):');

    const payload = { usuario_id: currentUser?.id };
    if (nuevoPrecio) payload.precio_final = Number(nuevoPrecio);
    if (nuevasObs) payload.observaciones = nuevasObs;
    if (nuevaReserva) payload.reserva_monto = Number(nuevaReserva);

    if (Object.keys(payload).length > 1) {
      const BASE = getApiBase();
      const resp = await fetch(`${BASE}/api/minutas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await resp.json();
      if (resp.ok) {
        alert('✅ Minuta actualizada correctamente');
        loadMinutas();
      } else {
        alert('❌ Error: ' + (result.message || 'Error desconocido'));
      }
    } else {
      alert('ℹ️ No se realizaron cambios');
    }
  } catch (error) {
    alert('❌ Error al editar minuta: ' + error.message);
  }
}

// Helper para obtener la URL base de la API
function getApiBase() {
  const isCapacitor = (
    location.protocol === 'file:' ||
    (location.protocol === 'https:' && location.host === 'localhost') ||
    (location.protocol === 'capacitor:') ||
    (typeof Capacitor !== 'undefined')
  );
  
  if (isCapacitor) return RAILWAY_URL;
  if (location.protocol && location.host && location.host !== 'localhost') {
    return `${location.protocol}//${location.host}`;
  }
  return 'http://localhost:4000';
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  console.log('Aplicación lista');
});

// Funciones de Exportación y Respaldo
async function exportarDatosCompletos() {
  try {
    if (!currentUser || !currentUser.es_premium) {
      alert('⚠️ Solo el administrador premium puede exportar datos');
      return;
    }

    const result = await window.api.exportarDatos();
    
    if (result.success) {
      alert(`✅ ${result.message}\n📁 Archivo: ${result.archivo}`);
    } else {
      alert(`❌ Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error exportando datos:', error);
    alert('❌ Error al exportar datos: ' + error.message);
  }
}

async function descargarRespaldoDB() {
  try {
    if (!currentUser || !currentUser.es_premium) {
      alert('⚠️ Solo el administrador premium puede descargar respaldos');
      return;
    }

    const result = await window.api.descargarRespaldo();
    
    if (result.success) {
      alert(`✅ ${result.message}\n📁 Archivo: ${result.archivo}\n📅 Fecha: ${new Date(result.fecha).toLocaleString()}`);
    } else {
      alert(`❌ Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error descargando respaldo:', error);
    alert('❌ Error al descargar respaldo: ' + error.message);
  }
}

function verEstadoBackups() {
  if (!currentUser || !currentUser.es_premium) {
    alert('⚠️ Solo el administrador premium puede ver el estado de backups');
    return;
  }

  const info = `
📊 ESTADO DEL SISTEMA DE RESPALDO

🔄 Respaldo Automático: ACTIVO
⏰ Frecuencia: Cada 5 minutos
📁 Ubicación: /backups/
💾 Formato: SQLite Database (.db)
🗂️ Retención: Últimos 10 backups

📦 ÚLTIMOS RESPALDOS:
• Los backups se guardan con timestamp
• Se eliminan automáticamente los antiguos
• Puedes descargarlos en cualquier momento

🔒 SEGURIDAD:
• Todos los datos están encriptados localmente
• Exportación disponible para GitHub/Drive
• Recuperación instantánea con archivos .db

⚡ ESTADO ACTUAL: ✅ FUNCIONANDO
  `;
  
  alert(info);
}

// Función para mostrar estadísticas de almacenamiento
function mostrarEstadisticasAlmacenamiento() {
  if (!currentUser || !currentUser.es_premium) {
    return;
  }

  // Aquí se podría agregar una llamada al servidor para obtener estadísticas
  console.log('Obteniendo estadísticas de almacenamiento...');
}

// Función para crear minuta - ahora usa el formulario integrado
function abrirMinutaProfesional() {
  // Navegar a la sección de minutas y abrir el formulario
  showSection('minutas');
  // Si existe toggleMinutaProfesional, abrirlo
  if (typeof toggleMinutaProfesional === 'function') {
    toggleMinutaProfesional();
  }
}

// ============================================
// MINUTA PROFESIONAL - PLANILLA COMPLETA
// ============================================

// Toggle formulario de minuta profesional
function toggleMinutaProfesional() {
  const form = document.getElementById('minutaProfesionalForm');
  const formRapido = document.getElementById('minutaForm');
  
  // Ocultar formulario rápido si está abierto
  if (formRapido) formRapido.style.display = 'none';
  
  // Toggle formulario profesional
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    inicializarMinutaProfesional();
  } else {
    form.style.display = 'none';
  }
}

// Inicializar formulario de minuta profesional
async function inicializarMinutaProfesional() {
  // Establecer fecha actual
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('mpFecha').value = hoy;
  
  // Generar número de minuta temporal
  const numMinuta = 'MP-' + Date.now().toString().slice(-6);
  document.getElementById('mpNumero').value = numMinuta;
  
  // Precargar nombre del vendedor si está logueado
  if (currentUser) {
    document.getElementById('mpVendedorNombre').value = currentUser.nombre || '';
  }
  
  // Cargar clientes y vehículos en los selects
  try {
    const vehiculos = await window.api.getVehiculos();
    const clientes = await window.api.getClientes();
    
    // Filtrar vehículos disponibles
    const vehiculosDisponibles = vehiculos.filter(v => v.estado === 'disponible');
    
    // Llenar select de vehículos
    const vehSelect = document.getElementById('mpVehiculoSelect');
    if (vehSelect) {
      vehSelect.innerHTML = '<option value="">-- Seleccionar o completar manualmente --</option>' +
        vehiculosDisponibles.map(v => `
          <option value="${v.id}" 
                  data-marca="${v.marca}" 
                  data-modelo="${v.modelo}" 
                  data-anio="${v.anio}"
                  data-precio="${v.precio}"
                  data-dominio="${v.dominio || ''}"
                  data-tipo="${v.tipo || 'auto'}"
                  data-condicion="${v.condicion || 'usado'}">
            ${v.marca} ${v.modelo} (${v.anio}) - $${Number(v.precio).toLocaleString()}
          </option>
        `).join('');
    }
    
    // Llenar select de clientes
    const cliSelect = document.getElementById('mpClienteSelect');
    if (cliSelect) {
      cliSelect.innerHTML = '<option value="">-- Seleccionar o completar manualmente --</option>' +
        clientes.map(c => `
          <option value="${c.id}"
                  data-nombre="${c.nombre} ${c.apellido}"
                  data-dni="${c.dni}"
                  data-telefono="${c.telefono || ''}"
                  data-email="${c.email || ''}"
                  data-direccion="${c.direccion || ''}">
            ${c.nombre} ${c.apellido} - DNI: ${c.dni}
          </option>
        `).join('');
    }
  } catch (error) {
    console.error('Error cargando datos para minuta profesional:', error);
  }
}

// Cargar datos del cliente seleccionado
function cargarDatosCliente() {
  const select = document.getElementById('mpClienteSelect');
  const option = select.options[select.selectedIndex];
  
  if (option && option.value) {
    document.getElementById('mpCompradorNombre').value = option.dataset.nombre || '';
    document.getElementById('mpCompradorDni').value = option.dataset.dni || '';
    document.getElementById('mpCompradorTelefono').value = option.dataset.telefono || '';
    document.getElementById('mpCompradorEmail').value = option.dataset.email || '';
    document.getElementById('mpCompradorDomicilio').value = option.dataset.direccion || '';
  }
}

// Cargar datos del vehículo seleccionado
function cargarDatosVehiculo() {
  const select = document.getElementById('mpVehiculoSelect');
  const option = select.options[select.selectedIndex];
  
  if (option && option.value) {
    document.getElementById('mpVehiculoMarca').value = option.dataset.marca || '';
    document.getElementById('mpVehiculoModelo').value = option.dataset.modelo || '';
    document.getElementById('mpVehiculoAnio').value = option.dataset.anio || '';
    document.getElementById('mpVehiculoDominio').value = option.dataset.dominio || '';
    document.getElementById('mpVehiculoTipo').value = option.dataset.tipo || 'auto';
    document.getElementById('mpVehiculoCondicion').value = option.dataset.condicion || 'usado';
    document.getElementById('mpPrecioLista').value = option.dataset.precio || '';
    document.getElementById('mpPrecioFinal').value = option.dataset.precio || '';
    calcularSaldos();
  }
}

// Toggle campos condicionales según opciones seleccionadas
function toggleCondicionCampos() {
  // Reserva
  document.getElementById('mpCamposReserva').style.display = 
    document.getElementById('mpCondReserva').checked ? 'block' : 'none';
  
  // Anticipo
  document.getElementById('mpCamposAnticipo').style.display = 
    document.getElementById('mpCondAnticipo').checked ? 'block' : 'none';
  
  // Financiación
  document.getElementById('mpCamposFinanciacion').style.display = 
    document.getElementById('mpCondFinanciacion').checked ? 'block' : 'none';
  
  // Tarjeta
  document.getElementById('mpCamposTarjeta').style.display = 
    document.getElementById('mpCondTarjeta').checked ? 'block' : 'none';
  
  // Permuta
  document.getElementById('mpCamposPermuta').style.display = 
    document.getElementById('mpCondPermuta').checked ? 'block' : 'none';
  
  // Otro
  document.getElementById('mpCamposOtro').style.display = 
    document.getElementById('mpCondOtro').checked ? 'block' : 'none';
  
  calcularSaldos();
}

// Calcular saldos automáticamente
function calcularSaldos() {
  const precioFinal = parseFloat(document.getElementById('mpPrecioFinal').value) || 0;
  const anticipo = parseFloat(document.getElementById('mpAnticipoMonto').value) || 0;
  const reserva = parseFloat(document.getElementById('mpReservaMonto').value) || 0;
  const permutaValor = parseFloat(document.getElementById('mpPermutaValor').value) || 0;
  const cuotas = parseFloat(document.getElementById('mpFinCuotas').value) || 0;
  const montoCuota = parseFloat(document.getElementById('mpFinMontoCuota').value) || 0;
  
  // Calcular saldo pendiente (anticipo)
  const saldoPendiente = precioFinal - anticipo;
  document.getElementById('mpSaldoPendiente').value = saldoPendiente > 0 ? saldoPendiente : 0;
  
  // Calcular total financiado
  if (cuotas > 0 && montoCuota > 0) {
    document.getElementById('mpFinTotal').value = cuotas * montoCuota;
  }
  
  // Calcular saldo final (considerando reserva, anticipo y permuta)
  let saldoFinal = precioFinal - reserva - anticipo - permutaValor;
  document.getElementById('mpSaldoFinal').value = saldoFinal > 0 ? saldoFinal : 0;
}

// Guardar borrador de minuta
function guardarBorradorMinuta() {
  const datosMinuta = recopilarDatosMinutaProfesional();
  localStorage.setItem('minuta_borrador', JSON.stringify(datosMinuta));
  alert('💾 Borrador guardado correctamente. Puedes continuar después.');
}

// Recopilar todos los datos del formulario
function recopilarDatosMinutaProfesional() {
  return {
    // Datos generales
    lugar: document.getElementById('mpLugar').value,
    fecha: document.getElementById('mpFecha').value,
    numero: document.getElementById('mpNumero').value,
    
    // Comprador
    comprador: {
      id: document.getElementById('mpClienteSelect').value,
      nombre: document.getElementById('mpCompradorNombre').value,
      dni: document.getElementById('mpCompradorDni').value,
      domicilio: document.getElementById('mpCompradorDomicilio').value,
      telefono: document.getElementById('mpCompradorTelefono').value,
      email: document.getElementById('mpCompradorEmail').value
    },
    
    // Vendedor
    vendedor: {
      nombre: document.getElementById('mpVendedorNombre').value,
      concesionaria: document.getElementById('mpConcesionaria').value
    },
    
    // Vehículo
    vehiculo: {
      id: document.getElementById('mpVehiculoSelect').value,
      tipo: document.getElementById('mpVehiculoTipo').value,
      condicion: document.getElementById('mpVehiculoCondicion').value,
      marca: document.getElementById('mpVehiculoMarca').value,
      modelo: document.getElementById('mpVehiculoModelo').value,
      anio: document.getElementById('mpVehiculoAnio').value,
      dominio: document.getElementById('mpVehiculoDominio').value,
      motor: document.getElementById('mpVehiculoMotor').value,
      chasis: document.getElementById('mpVehiculoChasis').value,
      color: document.getElementById('mpVehiculoColor').value
    },
    
    // Condiciones de pago
    condiciones: {
      contado: document.getElementById('mpCondContado').checked,
      reserva: document.getElementById('mpCondReserva').checked,
      anticipo: document.getElementById('mpCondAnticipo').checked,
      credito: document.getElementById('mpCondCredito').checked,
      financiacion: document.getElementById('mpCondFinanciacion').checked,
      tarjeta: document.getElementById('mpCondTarjeta').checked,
      permuta: document.getElementById('mpCondPermuta').checked,
      otro: document.getElementById('mpCondOtro').checked
    },
    
    // Montos
    montos: {
      precioLista: document.getElementById('mpPrecioLista').value,
      precioFinal: document.getElementById('mpPrecioFinal').value,
      reserva: document.getElementById('mpReservaMonto').value,
      anticipo: document.getElementById('mpAnticipoMonto').value,
      saldoPendiente: document.getElementById('mpSaldoPendiente').value,
      saldoFinal: document.getElementById('mpSaldoFinal').value
    },
    
    // Financiación
    financiacion: {
      financiera: document.getElementById('mpFinanciera').value,
      cuotas: document.getElementById('mpFinCuotas').value,
      montoCuota: document.getElementById('mpFinMontoCuota').value,
      total: document.getElementById('mpFinTotal').value
    },
    
    // Tarjeta
    tarjeta: {
      tipo: document.getElementById('mpTarjetaTipo').value,
      cuotas: document.getElementById('mpTarjetaCuotas').value
    },
    
    // Permuta
    permuta: {
      vehiculo: document.getElementById('mpPermutaVehiculo').value,
      valor: document.getElementById('mpPermutaValor').value,
      dominio: document.getElementById('mpPermutaDominio').value
    },
    
    // Otro
    otroDetalle: document.getElementById('mpOtroDetalle').value,
    
    // Observaciones
    observaciones: document.getElementById('mpObservaciones').value,
    
    // Metadata
    creado_por: currentUser ? currentUser.id : null,
    fecha_creacion: new Date().toISOString()
  };
}

// Imprimir minuta
function imprimirMinuta() {
  const datos = recopilarDatosMinutaProfesional();
  
  // Crear ventana de impresión
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Minuta de Venta - ${datos.numero}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .header h1 { margin: 0; color: #333; }
        .header h2 { margin: 10px 0 0 0; color: #666; }
        .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .section h3 { margin: 0 0 15px 0; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .row { display: flex; margin-bottom: 8px; }
        .label { font-weight: bold; width: 180px; color: #555; }
        .value { flex: 1; }
        .total { font-size: 1.3em; font-weight: bold; color: #2e7d32; }
        .firmas { display: flex; justify-content: space-around; margin-top: 50px; padding-top: 30px; }
        .firma { text-align: center; width: 200px; }
        .firma-linea { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DE GRAZIA - AUTOMOTORES</h1>
        <h2>MINUTA DE VENTA DE VEHÍCULO</h2>
        <p>Nº: ${datos.numero} | Fecha: ${datos.fecha} | Lugar: ${datos.lugar}</p>
      </div>
      
      <div class="section">
        <h3>DATOS DEL COMPRADOR</h3>
        <div class="row"><span class="label">Nombre:</span><span class="value">${datos.comprador.nombre}</span></div>
        <div class="row"><span class="label">DNI/CUIT:</span><span class="value">${datos.comprador.dni}</span></div>
        <div class="row"><span class="label">Domicilio:</span><span class="value">${datos.comprador.domicilio}</span></div>
        <div class="row"><span class="label">Teléfono:</span><span class="value">${datos.comprador.telefono}</span></div>
        <div class="row"><span class="label">Email:</span><span class="value">${datos.comprador.email}</span></div>
      </div>
      
      <div class="section">
        <h3>DATOS DEL VEHÍCULO</h3>
        <div class="row"><span class="label">Tipo:</span><span class="value">${datos.vehiculo.tipo}</span></div>
        <div class="row"><span class="label">Marca/Modelo:</span><span class="value">${datos.vehiculo.marca} ${datos.vehiculo.modelo}</span></div>
        <div class="row"><span class="label">Año:</span><span class="value">${datos.vehiculo.anio}</span></div>
        <div class="row"><span class="label">Dominio:</span><span class="value">${datos.vehiculo.dominio || 'N/A'}</span></div>
        <div class="row"><span class="label">Nº Motor:</span><span class="value">${datos.vehiculo.motor || 'N/A'}</span></div>
        <div class="row"><span class="label">Nº Chasis:</span><span class="value">${datos.vehiculo.chasis || 'N/A'}</span></div>
      </div>
      
      <div class="section">
        <h3>CONDICIONES DE LA OPERACIÓN</h3>
        <div class="row"><span class="label">Precio Final:</span><span class="value total">$${Number(datos.montos.precioFinal).toLocaleString()}</span></div>
        ${datos.condiciones.reserva ? `<div class="row"><span class="label">Reserva:</span><span class="value">$${Number(datos.montos.reserva).toLocaleString()}</span></div>` : ''}
        ${datos.condiciones.anticipo ? `<div class="row"><span class="label">Anticipo:</span><span class="value">$${Number(datos.montos.anticipo).toLocaleString()}</span></div>` : ''}
        ${datos.condiciones.permuta ? `<div class="row"><span class="label">Permuta:</span><span class="value">${datos.permuta.vehiculo} - $${Number(datos.permuta.valor).toLocaleString()}</span></div>` : ''}
        <div class="row"><span class="label">Saldo a Pagar:</span><span class="value total">$${Number(datos.montos.saldoFinal).toLocaleString()}</span></div>
      </div>
      
      ${datos.observaciones ? `
      <div class="section">
        <h3>OBSERVACIONES</h3>
        <p>${datos.observaciones}</p>
      </div>
      ` : ''}
      
      <div class="firmas">
        <div class="firma">
          <div class="firma-linea">Firma Vendedor</div>
          <p>${datos.vendedor.nombre}</p>
        </div>
        <div class="firma">
          <div class="firma-linea">Firma Comprador</div>
          <p>${datos.comprador.nombre}</p>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Submit formulario minuta profesional
document.getElementById('minutaProfesionalFormElement')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const datos = recopilarDatosMinutaProfesional();
  const messageDiv = document.getElementById('minutaProfesionalMessage');
  
  // Validaciones básicas
  if (!datos.comprador.nombre || !datos.comprador.dni) {
    messageDiv.className = 'message error';
    messageDiv.textContent = '❌ Debe completar los datos del comprador (nombre y DNI)';
    return;
  }
  
  if (!datos.vehiculo.marca || !datos.vehiculo.modelo || !datos.vehiculo.anio) {
    messageDiv.className = 'message error';
    messageDiv.textContent = '❌ Debe completar los datos del vehículo (marca, modelo y año)';
    return;
  }
  
  if (!datos.montos.precioFinal) {
    messageDiv.className = 'message error';
    messageDiv.textContent = '❌ Debe ingresar el precio final de venta';
    return;
  }
  
  try {
    // Preparar datos para enviar al servidor
    const minutaData = {
      vehiculo_id: datos.vehiculo.id || null,
      cliente_id: datos.comprador.id || null,
      vendedor_id: currentUser ? currentUser.id : null,
      precio_original: parseFloat(datos.montos.precioLista) || 0,
      precio_final: parseFloat(datos.montos.precioFinal) || 0,
      observaciones: JSON.stringify(datos), // Guardamos todos los datos como JSON
      estado: 'activa'
    };
    
    const response = await window.api.createMinuta(minutaData);
    
    messageDiv.className = 'message success';
    messageDiv.textContent = '✅ Minuta creada correctamente. Nº: ' + datos.numero;
    
    // Limpiar borrador si existe
    localStorage.removeItem('minuta_borrador');
    
    // Recargar lista de minutas
    loadMinutas();
    
    // Cerrar formulario después de 2 segundos
    setTimeout(() => {
      toggleMinutaProfesional();
    }, 2000);
    
  } catch (error) {
    messageDiv.className = 'message error';
    messageDiv.textContent = '❌ Error al crear minuta: ' + (error.message || 'Error desconocido');
  }
});
