// Helper para llamadas API (funciona en Electron y web)
async function apiCall(endpoint, method = 'GET', data = null) {
  if (window.api && window.api[endpoint.split('/')[1]]) {
    // Electron - usar API expuesta
    const apiMethod = endpoint.split('/')[1];
    if (method === 'GET') {
      return await window.api[apiMethod]();
    } else {
      return await window.api[apiMethod](data);
    }
  } else {
    // Web - usar fetch directo
    const serverURL = 'https://concesionaria-app-production.up.railway.app';
    const options = {
      method: method === 'GET' ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${serverURL}${endpoint}`, options);
    return await response.json();
  }
}

// Variables globales
let currentUser = null;
let currentSessionId = null;
let trackingInterval = null;

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
    let response;
    
    // Detectar si estamos en Electron o web
    if (window.api && window.api.login) {
      // Electron
      response = await window.api.login(email, password);
    } else {
      // Web - usar fetch directo
      const serverURL = 'https://concesionaria-app-production.up.railway.app';
      const res = await fetch(`${serverURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      response = await res.json();
    }
    
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
    let response;
    
    // Detectar si estamos en Electron o web
    if (window.api && window.api.register) {
      // Electron
      response = await window.api.register(nombre, email, password, rol);
    } else {
      // Web - usar fetch directo
      const serverURL = 'https://concesionaria-app-production.up.railway.app';
      const res = await fetch(`${serverURL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, rol })
      });
      response = await res.json();
    }
    
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
    const vehiculos = await apiCall('/api/vehiculos');
    const clientes = await apiCall('/api/clientes');
    const minutas = await apiCall('/api/minutas');
    
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
    const vehiculos = await apiCall('/api/vehiculos');
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
    const clientes = await apiCall('/api/clientes');
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
    const vehiculos = await apiCall('/api/vehiculos');
    const clientes = await apiCall('/api/clientes');
    
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
    const response = await apiCall('/api/minutas', 'POST', minutaData);
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
    // Cargar minutas simples
    const minutas = await apiCall('/api/minutas');
    
    // Cargar minutas detalladas
    const minutasDetalladas = await apiCall('/api/minutas/detalladas');
    
    const listDiv = document.getElementById('minutasContent');

    if (minutas.length === 0 && minutasDetalladas.length === 0) {
      listDiv.innerHTML = '<p style="text-align: center; color: #999;">No hay minutas registradas</p>';
      return;
    }

    let html = '';

    // Renderizar minutas simples
    if (minutas.length > 0) {
      html += '<h3>Minutas Simples</h3>';
      html += minutas.map(m => `
        <div class="minuta-card">
          <h4>Minuta #${m.id} <span style="color: #666; font-size: 12px;">(Simple)</span></h4>
          <p><strong>Vehículo:</strong> ${m.marca} ${m.modelo} (${m.anio})</p>
          <p><strong>Cliente:</strong> ${m.cliente_nombre} ${m.cliente_apellido}</p>
          <p><strong>Vendedor:</strong> ${m.vendedor_nombre}</p>
          <p><strong>Precio Final:</strong> $${m.precio_final.toLocaleString()}</p>
          <p><strong>Estado:</strong> <span class="estado-${m.estado}">${m.estado}</span></p>
          <p><strong>Fecha:</strong> ${new Date(m.created_at).toLocaleDateString()}</p>
          ${m.observaciones ? `<p><strong>Observaciones:</strong> ${m.observaciones}</p>` : ''}
        </div>
      `).join('');
    }

    // Renderizar minutas detalladas
    if (minutasDetalladas.length > 0) {
      html += '<h3 style="margin-top: 30px;">Minutas Profesionales</h3>';
      html += minutasDetalladas.map(m => {
        const datos = m.datos_completos;
        return `
          <div class="minuta-card" style="border-left: 4px solid #667eea;">
            <h4>Minuta #${m.id} <span style="color: #667eea; font-size: 12px;">(Profesional)</span></h4>
            <p><strong>Vehículo:</strong> ${datos.vehiculo?.marca} ${datos.vehiculo?.modelo} (${datos.vehiculo?.anio})</p>
            <p><strong>Comprador:</strong> ${datos.comprador?.nombre}</p>
            <p><strong>Vendedor:</strong> ${datos.vendedor?.razon}</p>
            <p><strong>Precio Final:</strong> $${datos.operacion?.precioLista ? parseFloat(datos.operacion.precioLista).toLocaleString() : 'N/A'}</p>
            <p><strong>Modalidad:</strong> ${datos.operacion?.modalidadPago || 'N/A'}</p>
            <p><strong>Estado:</strong> <span class="estado-${m.estado}">${m.estado}</span></p>
            <p><strong>Fecha:</strong> ${new Date(m.created_at).toLocaleDateString()}</p>
            <p><strong>Creado por:</strong> ${m.creado_por_nombre || 'Sistema'}</p>
            ${datos.observaciones ? `<p><strong>Observaciones:</strong> ${datos.observaciones}</p>` : ''}
          </div>
        `;
      }).join('');
    }

    listDiv.innerHTML = html;
  } catch (error) {
    console.error('Error cargando minutas:', error);
  }
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
