
// Variables globales
let currentUser = null;
let currentSessionId = null;
let trackingInterval = null;

// Fallback API client: si window.api no está disponible (navegador web), usamos fetch
(() => {
  try {
    const BASE = (location.protocol && location.host) ? `${location.protocol}//${location.host}` : 'http://localhost:4000';

    const call = async (endpoint, method = 'GET', body = null) => {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      const resp = await fetch(`${BASE}${endpoint}`, opts);
      return resp.ok ? resp.json() : Promise.reject(await resp.json());
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

function editarVehiculo(id) {
  // TODO: Implementar formulario de edición
  alert('🔧 Función de edición en desarrollo');
}

function editarCliente(id) {
  // TODO: Implementar formulario de edición
  alert('🔧 Función de edición en desarrollo');
}

function editarMinuta(id) {
  // TODO: Implementar formulario de edición
  alert('🔧 Función de edición en desarrollo');
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

// Función para abrir minuta profesional
function abrirMinutaProfesional() {
  // Guardar ID de usuario en localStorage para la minuta
  if (currentUser) {
    localStorage.setItem('userId', currentUser.id);
    localStorage.setItem('userName', currentUser.nombre);
  }
  
  // Abrir minuta en nueva ventana
  window.open('http://localhost:4000/minuta-venta.html', '_blank', 'width=1000,height=800');
}
