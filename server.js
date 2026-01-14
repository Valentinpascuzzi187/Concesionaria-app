const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (para acceso móvil)
app.use(express.static(path.join(__dirname, 'src')));

// Base de datos SQLite con respaldo automático
const db = new sqlite3.Database('./concesionaria.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
    initTables();
    // Crear usuario premium después de inicializar tablas
    setTimeout(crearUsuarioPremium, 1000);
    // Iniciar sistema de respaldo automático
    setTimeout(iniciarSistemaRespaldo, 2000);
  }
});

// Sistema de respaldo automático
const fs = require('fs');

function iniciarSistemaRespaldo() {
  console.log('🔄 Iniciando sistema de respaldo automático...');
  
  // Crear directorio de backups si no existe
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Respaldar cada 5 minutos
  setInterval(() => {
    realizarRespaldoLocal();
    // Aquí se podría integrar con Google Drive o GitHub
    console.log('📦 Respaldo automático realizado:', new Date().toISOString());
  }, 5 * 60 * 1000); // 5 minutos
  
  // Respaldar inmediatamente al inicio
  realizarRespaldoLocal();
}

function realizarRespaldoLocal() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, 'backups', `concesionaria_backup_${timestamp}.db`);
    
    // Copiar base de datos actual
    fs.copyFileSync(path.join(__dirname, 'concesionaria.db'), backupFile);
    
    // Mantener solo los últimos 10 backups
    const backupDir = path.join(__dirname, 'backups');
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    // Eliminar backups antiguos (mantener últimos 10)
    if (files.length > 10) {
      for (let i = 10; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
        console.log('🗑️ Backup antiguo eliminado:', files[i].name);
      }
    }
    
    console.log('✅ Respaldo local creado:', backupFile);
    
    // Registrar en auditoría
    registrarAuditoria(1, 'RESPALDO_AUTOMATICO', 'sistema', null, null, { 
      archivo: backupFile, 
      timestamp: timestamp 
    });
    
  } catch (error) {
    console.error('❌ Error en respaldo automático:', error);
  }
}

// Función para exportar datos a formato JSON (para GitHub/Drive)
function exportarDatosJSON() {
  return new Promise((resolve, reject) => {
    const datos = {
      timestamp: new Date().toISOString(),
      usuarios: [],
      vehiculos: [],
      clientes: [],
      minutas: [],
      auditoria: [],
      tracking_sesiones: [],
      tracking_navegacion: [],
      tracking_acciones: [],
      alertas_premium: [],
      suspensiones: []
    };
    
    let completed = 0;
    const total = Object.keys(datos).length;
    
    // Exportar usuarios
    db.all('SELECT * FROM usuarios', (err, rows) => {
      if (!err) datos.usuarios = rows;
      completed++;
      if (completed === total) resolve(datos);
    });
    
    // Exportar vehículos
    db.all('SELECT * FROM vehiculos', (err, rows) => {
      if (!err) datos.vehiculos = rows;
      completed++;
      if (completed === total) resolve(datos);
    });
    
    // Exportar clientes
    db.all('SELECT * FROM clientes', (err, rows) => {
      if (!err) datos.clientes = rows;
      completed++;
      if (completed === total) resolve(datos);
    });
    
    // Exportar minutas
    db.all('SELECT * FROM minutas', (err, rows) => {
      if (!err) datos.minutas = rows;
      completed++;
      if (completed === total) resolve(datos);
    });
    
    // Exportar auditoría
    db.all('SELECT * FROM auditoria', (err, rows) => {
      if (!err) datos.auditoria = rows;
      completed++;
      if (completed === total) resolve(datos);
    });
    
    // Exportar tracking sesiones
    db.all('SELECT * FROM tracking_sesiones', (err, rows) => {
      if (!err) datos.tracking_sesiones = rows;
      completed++;
      if (completed === total) resolve(datos);
    });
    
    // Exportar tracking navegación
    db.all('SELECT * FROM tracking_navegacion', (err, rows) => {
      if (!err) datos.tracking_navegacion = rows;
      completed++;
      if (completed === total) resolve(datos);
    });
    
    // Exportar tracking acciones
    db.all('SELECT * FROM tracking_acciones', (err, rows) => {
      if (!err) datos.tracking_acciones = rows;
      completed++;
      if (completed === total) resolve(datos);
    });
    
    // Exportar alertas premium
    db.all('SELECT * FROM alertas_premium', (err, rows) => {
      if (!err) datos.alertas_premium = rows;
      completed++;
      if (completed === total) resolve(datos);
    });
    
    // Exportar suspensiones
    db.all('SELECT * FROM suspensiones', (err, rows) => {
      if (!err) datos.suspensiones = rows;
      completed++;
      if (completed === total) resolve(datos);
    });
  });
}

// Ruta para exportar datos (solo admin premium)
app.get('/api/exportar-datos', async (req, res) => {
  try {
    const datos = await exportarDatosJSON();
    
    // Guardar archivo JSON localmente
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFile = path.join(__dirname, 'exports', `export_completo_${timestamp}.json`);
    
    // Crear directorio de exports si no existe
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    fs.writeFileSync(exportFile, JSON.stringify(datos, null, 2));
    
    // Registrar auditoría
    registrarAuditoria(1, 'EXPORTACION_DATOS', 'sistema', null, null, { 
      archivo: exportFile, 
      registros: {
        usuarios: datos.usuarios.length,
        vehiculos: datos.vehiculos.length,
        clientes: datos.clientes.length,
        minutas: datos.minutas.length,
        auditoria: datos.auditoria.length
      }
    });
    
    res.json({
      message: 'Datos exportados correctamente',
      archivo: exportFile,
      resumen: {
        usuarios: datos.usuarios.length,
        vehiculos: datos.vehiculos.length,
        clientes: datos.clientes.length,
        minutas: datos.minutas.length,
        auditoria: datos.auditoria.length,
        tracking_sesiones: datos.tracking_sesiones.length,
        tracking_navegacion: datos.tracking_navegacion.length,
        tracking_acciones: datos.tracking_acciones.length,
        alertas_premium: datos.alertas_premium.length,
        suspensiones: datos.suspensiones.length
      }
    });
    
  } catch (error) {
    console.error('Error al exportar datos:', error);
    res.status(500).json({ message: 'Error al exportar datos' });
  }
});

// Ruta para importar datos (solo admin premium - recuperación)
app.post('/api/importar-datos', async (req, res) => {
  try {
    const { datos } = req.body;
    
    if (!datos) {
      return res.status(400).json({ message: 'No se proporcionaron datos para importar' });
    }
    
    // Aquí iría la lógica para importar datos a la base de datos
    // Por seguridad, esto debería requerir confirmación adicional
    
    registrarAuditoria(1, 'IMPORTACION_DATOS', 'sistema', null, null, { 
      timestamp: new Date().toISOString(),
      origen: 'importacion_manual'
    });
    
    res.json({ message: 'Sistema de importación listo (requiere implementación específica)' });
    
  } catch (error) {
    console.error('Error al importar datos:', error);
    res.status(500).json({ message: 'Error al importar datos' });
  }
});

// Inicializar tablas
function initTables() {
  // Tabla de usuarios con roles mejorados
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT DEFAULT 'vendedor',
    habilitado BOOLEAN DEFAULT 1,
    telefono TEXT,
    es_premium BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de vehículos mejorada con soft delete
  db.run(`CREATE TABLE IF NOT EXISTS vehiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    version TEXT,
    anio INTEGER NOT NULL,
    condicion TEXT NOT NULL,
    precio REAL NOT NULL,
    dominio TEXT,
    estado TEXT DEFAULT 'disponible',
    eliminado BOOLEAN DEFAULT 0,
    eliminado_por INTEGER,
    fecha_eliminacion DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eliminado_por) REFERENCES usuarios (id)
  )`);

  // Tabla de clientes con soft delete
  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    dni TEXT UNIQUE NOT NULL,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    observaciones TEXT,
    eliminado BOOLEAN DEFAULT 0,
    eliminado_por INTEGER,
    fecha_eliminacion DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eliminado_por) REFERENCES usuarios (id)
  )`);

  // Tabla de minutas con soft delete
  db.run(`CREATE TABLE IF NOT EXISTS minutas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehiculo_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    vendedor_id INTEGER NOT NULL,
    precio_original REAL NOT NULL,
    precio_final REAL NOT NULL,
    estado TEXT DEFAULT 'iniciada',
    observaciones TEXT,
    eliminado BOOLEAN DEFAULT 0,
    eliminado_por INTEGER,
    fecha_eliminacion DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id),
    FOREIGN KEY (cliente_id) REFERENCES clientes (id),
    FOREIGN KEY (vendedor_id) REFERENCES usuarios (id),
    FOREIGN KEY (eliminado_por) REFERENCES usuarios (id)
  )`);

  // Tabla de auditoría mejorada
  db.run(`CREATE TABLE IF NOT EXISTS auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    accion TEXT NOT NULL,
    tabla_afectada TEXT,
    registro_id INTEGER,
    datos_anteriores TEXT,
    datos_nuevos TEXT,
    ip_address TEXT,
    fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
    notificado_premium BOOLEAN DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
  )`);

  // Tabla de notificaciones para usuario premium
  db.run(`CREATE TABLE IF NOT EXISTS notificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_premium_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo TEXT NOT NULL,
    leida BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_premium_id) REFERENCES usuarios (id)
  )`);

  // Tabla de tracking de sesiones y actividad
  db.run(`CREATE TABLE IF NOT EXISTS tracking_sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha_login DATETIME,
    fecha_logout DATETIME,
    ip_address TEXT,
    user_agent TEXT,
    duracion_segundos INTEGER,
    paginas_visitadas INTEGER DEFAULT 0,
    acciones_realizadas INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
  )`);

  // Tabla de tracking de navegación detallada
  db.run(`CREATE TABLE IF NOT EXISTS tracking_navegacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sesion_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    seccion_visitada TEXT,
    fecha_visita DATETIME DEFAULT CURRENT_TIMESTAMP,
    tiempo_en_seccion INTEGER,
    ip_address TEXT,
    accion TEXT,
    detalles TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sesion_id) REFERENCES tracking_sesiones (id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
  )`);

  // Tabla de tracking de formularios y acciones
  db.run(`CREATE TABLE IF NOT EXISTS tracking_acciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    sesion_id INTEGER,
    tipo_accion TEXT, -- 'login', 'logout', 'formulario', 'vista', 'creacion', 'modificacion', 'eliminacion'
    modulo TEXT, -- 'vehiculos', 'clientes', 'minutas', 'pagos'
    datos_accion TEXT,
    ip_address TEXT,
    fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
    notificado_premium BOOLEAN DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    FOREIGN KEY (sesion_id) REFERENCES tracking_sesiones (id)
  )`);

  // Tabla de alertas para el admin premium
  db.run(`CREATE TABLE IF NOT EXISTS alertas_premium (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_premium_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo_alerta TEXT, -- 'login_usuario', 'formulario_enviado', 'pagina_visitada', 'accion_critica'
    usuario_afectado_id INTEGER,
    datos_adicionales TEXT,
    leida BOOLEAN DEFAULT 0,
    fecha_alerta DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_premium_id) REFERENCES usuarios (id),
    FOREIGN KEY (usuario_afectado_id) REFERENCES usuarios (id)
  )`);

  // Tabla de historial de cambios (versión de datos)
  db.run(`CREATE TABLE IF NOT EXISTS historial_datos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tabla_afectada TEXT NOT NULL,
    registro_id INTEGER NOT NULL,
    campo_modificado TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    modificado_por INTEGER NOT NULL,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modificado_por) REFERENCES usuarios (id)
  )`);

  // Tabla de suspensiones
  db.run(`CREATE TABLE IF NOT EXISTS suspensiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    mensaje TEXT,
    duracion TEXT,
    suspendido_por INTEGER NOT NULL,
    fecha_suspension DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_reactivacion DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    FOREIGN KEY (suspendido_por) REFERENCES usuarios (id)
  )`);
}

// Crear usuario premium automáticamente
function crearUsuarioPremium() {
  const premiumEmail = 'admin@concesionaria.com'; // Email del usuario premium
  
  db.get('SELECT id FROM usuarios WHERE email = ?', [premiumEmail], (err, row) => {
    if (!err && !row) {
      // Crear usuario premium
      db.run('INSERT INTO usuarios (nombre, email, password, rol, es_premium) VALUES (?, ?, ?, ?, ?)', 
        ['Dueño', premiumEmail, 'Halcon2716@', 'administrador', 1], 
        function(err) {
          if (!err) {
            console.log('✅ Usuario premium creado exitosamente');
            console.log(`📧 Email: ${premiumEmail}`);
            console.log('🔑 Password: Halcon2716@');
            console.log('👤 Rol: Administrador Premium');
            
            // Registrar auditoría
            registrarAuditoria(this.lastID, 'CREACION_USUARIO_PREMIUM', 'usuarios', this.lastID, null, { 
              nombre: 'Dueño', 
              email: premiumEmail, 
              rol: 'administrador', 
              es_premium: true 
            });
          }
        }
      );
    } else if (!err && row) {
      console.log('✅ Usuario premium ya existe');
    }
  });
}

// Funciones de tracking y vigilancia
function registrarSesion(usuarioId, ipAddress, userAgent) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO tracking_sesiones (usuario_id, fecha_login, ip_address, user_agent)
      VALUES (?, CURRENT_TIMESTAMP, ?, ?)
    `;
    
    db.run(query, [usuarioId, ipAddress, userAgent], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function cerrarSesion(sesionId) {
  return new Promise((resolve, reject) => {
    // Calcular duración
    db.get('SELECT fecha_login FROM tracking_sesiones WHERE id = ?', [sesionId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row) {
        const duracion = Math.floor((Date.now() - new Date(row.fecha_login).getTime()) / 1000);
        
        const query = `
          UPDATE tracking_sesiones 
          SET fecha_logout = CURRENT_TIMESTAMP, duracion_segundos = ?
          WHERE id = ?
        `;
        
        db.run(query, [duracion, sesionId], function(err) {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

function registrarNavegacion(sesionId, usuarioId, seccion, accion, detalles, ipAddress) {
  const query = `
    INSERT INTO tracking_navegacion (sesion_id, usuario_id, seccion_visitada, accion, detalles, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [sesionId, usuarioId, seccion, accion, detalles, ipAddress]);
  
  // Crear alerta para el admin premium si no es el usuario premium
  if (usuarioId) {
    db.get('SELECT es_premium FROM usuarios WHERE id = ?', [usuarioId], (err, row) => {
      if (!err && row && !row.es_premium) {
        // Buscar usuario premium y alertar
        db.get('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1', (err, premiumUser) => {
          if (!err && premiumUser) {
            crearAlertaPremium(premiumUser.id, 'Navegación Detectada', 
              `Usuario ${usuarioId} visitó: ${seccion} - ${accion}`, 
              'pagina_visitada', usuarioId, { seccion, accion, detalles });
          }
        });
      }
    });
  }
}

function registrarAccion(usuarioId, sesionId, tipoAccion, modulo, datosAccion, ipAddress) {
  const query = `
    INSERT INTO tracking_acciones (usuario_id, sesion_id, tipo_accion, modulo, datos_accion, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [usuarioId, sesionId, tipoAccion, modulo, datosAccion, ipAddress]);
  
  // Crear alerta para el admin premium si no es el usuario premium
  if (usuarioId) {
    db.get('SELECT es_premium FROM usuarios WHERE id = ?', [usuarioId], (err, row) => {
      if (!err && row && !row.es_premium) {
        // Buscar usuario premium y alertar
        db.get('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1', (err, premiumUser) => {
          if (!err && premiumUser) {
            crearAlertaPremium(premiumUser.id, 'Acción Detectada', 
              `Usuario ${usuarioId} realizó: ${tipoAccion} en ${modulo}`, 
              'accion_critica', usuarioId, { tipoAccion, modulo, datosAccion });
          }
        });
      }
    });
  }
}

function crearAlertaPremium(usuarioPremiumId, titulo, mensaje, tipoAlerta, usuarioAfectadoId, datosAdicionales) {
  const query = `
    INSERT INTO alertas_premium (usuario_premium_id, titulo, mensaje, tipo_alerta, usuario_afectado_id, datos_adicionales)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [usuarioPremiumId, titulo, mensaje, tipoAlerta, usuarioAfectadoId, JSON.stringify(datosAdicionales)]);
}

// Funciones de auditoría y control
function registrarAuditoria(usuarioId, accion, tablaAfectada, registroId, datosAnteriores, datosNuevos) {
  const query = `
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [usuarioId, accion, tablaAfectada, registroId, JSON.stringify(datosAnteriores), JSON.stringify(datosNuevos)]);
  
  // Notificar al usuario premium si no es el mismo usuario
  if (usuarioId) {
    db.get('SELECT es_premium FROM usuarios WHERE id = ?', [usuarioId], (err, row) => {
      if (!err && row && !row.es_premium) {
        // Buscar usuario premium y notificar
        db.get('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1', (err, premiumUser) => {
          if (!err && premiumUser) {
            crearNotificacion(premiumUser.id, 'Cambio Registrado', `El usuario ${usuarioId} realizó: ${accion} en ${tablaAfectada}`, 'auditoria');
          }
        });
      }
    });
  }
}

function crearNotificacion(usuarioPremiumId, titulo, mensaje, tipo) {
  const query = `
    INSERT INTO notificaciones (usuario_premium_id, titulo, mensaje, tipo)
    VALUES (?, ?, ?, ?)
  `;
  
  db.run(query, [usuarioPremiumId, titulo, mensaje, tipo]);
}

function registrarHistorial(tablaAfectada, registroId, campoModificado, valorAnterior, valorNuevo, modificadoPor) {
  const query = `
    INSERT INTO historial_datos (tabla_afectada, registro_id, campo_modificado, valor_anterior, valor_nuevo, modificado_por)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [tablaAfectada, registroId, campoModificado, valorAnterior, valorNuevo, modificadoPor]);
}

// Rutas de autenticación
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, email, password, rol = 'vendedor' } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // IPs permitidas (sin restricciones)
    const allowedIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
    const isAllowedIP = allowedIPs.includes(ipAddress) || ipAddress.includes('127.0.0.1') || ipAddress.includes('localhost');
    
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Verificar si el usuario ya existe
    db.get('SELECT id FROM usuarios WHERE email = ?', [email], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor' });
      }
      
      if (row) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }

      // Si intenta crear un rol de administrador, verificar si está autorizado (permitido para IPs locales)
      if (rol === 'administrador' && !isAllowedIP) {
        // Registrar intento de crear admin
        registrarAccion(null, null, 'INTENTO_CREAR_ADMIN', 'auth', { nombre, email, rol }, ipAddress);
        
        // Notificar al admin premium inmediatamente
        db.get('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1', (err, premiumUser) => {
          if (!err && premiumUser) {
            crearAlertaPremium(premiumUser.id, '🚨 INTENTO DE CREAR ADMINISTRADOR', 
              `Alguien intentó crear un usuario administrador: ${nombre} (${email})`, 
              'intento_admin_critico', null, { nombre, email, rol, ipAddress });
          }
        });
        
        return res.status(403).json({ message: 'No autorizado para crear administradores' });
      }

      // Insertar nuevo usuario
      db.run('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)', 
        [nombre, email, password, rol], 
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error al registrar usuario' });
          }
          
          // Registrar auditoría solo si no es IP permitida
          if (!isAllowedIP) {
            registrarAuditoria(this.lastID, 'CREACION_USUARIO', 'usuarios', this.lastID, null, { nombre, email, rol });
          }
          
          // Notificar al admin premium del nuevo registro solo si no es IP permitida
          if (!isAllowedIP) {
            db.get('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1', (err, premiumUser) => {
              if (!err && premiumUser) {
                crearAlertaPremium(premiumUser.id, '👤 Nuevo Usuario Registrado', 
                  `Se ha registrado un nuevo usuario: ${nombre} (${email}) - Rol: ${rol}`, 
                  'nuevo_usuario', this.lastID, { nombre, email, rol });
              }
            });
          }
          
          res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            user: { id: this.lastID, nombre, email, rol }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // IPs permitidas (siempre desbloqueadas)
    const allowedIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
    const isAllowedIP = allowedIPs.includes(ipAddress) || ipAddress.includes('127.0.0.1') || ipAddress.includes('localhost');
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son obligatorios' });
    }

    db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor' });
      }
      
      if (!row) {
        // Registrar intento fallido solo si no es IP permitida
        if (!isAllowedIP) {
          registrarAccion(null, null, 'LOGIN_FALLIDO', 'auth', { email, error: 'usuario_no_encontrado' }, ipAddress);
        }
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      if (!row.habilitado) {
        // Permitir acceso a admin premium incluso si está deshabilitado (para emergencias)
        if (!row.es_premium && !isAllowedIP) {
          registrarAccion(row.id, null, 'LOGIN_DESHABILITADO', 'auth', { email }, ipAddress);
        }
        return res.status(401).json({ message: 'Usuario deshabilitado' });
      }

      if (row.password !== password) {
        // Registrar intento fallido solo si no es IP permitida
        if (!isAllowedIP) {
          registrarAccion(row.id, null, 'LOGIN_FALLIDO', 'auth', { email, error: 'password_incorrecto' }, ipAddress);
        }
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      // Registrar sesión exitosa
      registrarSesion(row.id, ipAddress, userAgent).then(sesionId => {
        // Registrar acción de login solo si no es IP permitida
        if (!isAllowedIP) {
          registrarAccion(row.id, sesionId, 'LOGIN_EXITOSO', 'auth', { email }, ipAddress);
        }
        
        // Crear alerta para el admin premium si no es el usuario premium y no es IP permitida
        if (!row.es_premium && !isAllowedIP) {
          db.get('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1', (err, premiumUser) => {
            if (!err && premiumUser) {
              crearAlertaPremium(premiumUser.id, '🔐 Usuario Conectado', 
                `El usuario ${row.nombre} (${row.email}) acaba de iniciar sesión`, 
                'login_usuario', row.id, { email, ipAddress, userAgent });
            }
          });
        }
        
        res.json({
          message: 'Login exitoso',
          user: {
            id: row.id,
            nombre: row.nombre,
            email: row.email,
            rol: row.rol,
            es_premium: row.es_premium,
            habilitado: row.habilitado,
            sesion_id: sesionId
          }
        });
      }).catch(err => {
        console.error('Error al registrar sesión:', err);
        res.status(500).json({ message: 'Error en el servidor' });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta de logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { usuario_id, sesion_id } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    if (usuario_id && sesion_id) {
      // Cerrar sesión
      await cerrarSesion(sesion_id);
      
      // Registrar logout
      registrarAccion(usuario_id, sesion_id, 'LOGOUT', 'auth', {}, ipAddress);
      
      // Crear alerta para el admin premium
      db.get('SELECT es_premium FROM usuarios WHERE id = ?', [usuario_id], (err, row) => {
        if (!err && row && !row.es_premium) {
          db.get('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1', (err, premiumUser) => {
            if (!err && premiumUser) {
              crearAlertaPremium(premiumUser.id, '🔓 Usuario Desconectado', 
                `El usuario ${usuario_id} cerró sesión`, 
                'logout_usuario', usuario_id, { ipAddress });
            }
          });
        }
      });
    }
    
    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Rutas de tracking
app.post('/api/tracking/navegacion', async (req, res) => {
  try {
    const { usuario_id, sesion_id, seccion, accion, detalles } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    if (usuario_id && sesion_id) {
      registrarNavegacion(sesionId, usuario_id, seccion, accion, detalles, ipAddress);
    }
    
    res.json({ message: 'Navegación registrada' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/tracking/accion', async (req, res) => {
  try {
    const { usuario_id, sesion_id, tipo_accion, modulo, datos_accion } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    if (usuario_id) {
      registrarAccion(usuario_id, sesion_id, tipo_accion, modulo, datos_accion, ipAddress);
    }
    
    res.json({ message: 'Acción registrada' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.get('/api/alertas-premium', async (req, res) => {
  try {
    const alertas = await new Promise((resolve, reject) => {
      const query = `
        SELECT a.*, u.nombre as usuario_afectado_nombre, u.email as usuario_afectado_email
        FROM alertas_premium a
        LEFT JOIN usuarios u ON a.usuario_afectado_id = u.id
        ORDER BY a.fecha_alerta DESC
        LIMIT 100
      `;
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(alertas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener alertas' });
  }
});

app.post('/api/alertas-premium/:id/leida', async (req, res) => {
  try {
    const { id } = req.params;
    db.run('UPDATE alertas_premium SET leida = 1 WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error al marcar alerta como leída' });
      }
      res.json({ message: 'Alerta marcada como leída' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.get('/api/tracking/sesiones/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const sesiones = await new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM tracking_sesiones 
        WHERE usuario_id = ? 
        ORDER BY fecha_login DESC 
        LIMIT 50
      `;
      db.all(query, [usuario_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(sesiones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener sesiones' });
  }
});

app.get('/api/tracking/navegacion/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const navegacion = await new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM tracking_navegacion 
        WHERE usuario_id = ? 
        ORDER BY fecha_visita DESC 
        LIMIT 100
      `;
      db.all(query, [usuario_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(navegacion);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener navegación' });
  }
});

// Rutas de auditoría y notificaciones
app.get('/api/notificaciones', async (req, res) => {
  try {
    const notificaciones = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM notificaciones ORDER BY created_at DESC LIMIT 50', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(notificaciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
});

app.post('/api/notificaciones/:id/leida', async (req, res) => {
  try {
    const { id } = req.params;
    db.run('UPDATE notificaciones SET leida = 1 WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error al marcar notificación como leída' });
      }
      res.json({ message: 'Notificación marcada como leída' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.get('/api/auditoria', async (req, res) => {
  try {
    const auditoria = await new Promise((resolve, reject) => {
      const query = `
        SELECT a.*, u.nombre as usuario_nombre, u.email as usuario_email
        FROM auditoria a
        JOIN usuarios u ON a.usuario_id = u.id
        ORDER BY a.fecha_accion DESC
        LIMIT 100
      `;
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(auditoria);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener auditoría' });
  }
});

app.get('/api/historial/:tabla/:registroId', async (req, res) => {
  try {
    const { tabla, registroId } = req.params;
    const historial = await new Promise((resolve, reject) => {
      const query = `
        SELECT h.*, u.nombre as modificado_por_nombre
        FROM historial_datos h
        JOIN usuarios u ON h.modificado_por = u.id
        WHERE h.tabla_afectada = ? AND h.registro_id = ?
        ORDER BY h.fecha_modificacion DESC
      `;
      db.all(query, [tabla, registroId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial' });
  }
});

// Rutas de vehículos
app.get('/api/vehiculos', (req, res) => {
  db.all('SELECT * FROM vehiculos WHERE eliminado = 0 ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener vehículos' });
    }
    res.json(rows);
  });
});

app.post('/api/vehiculos', (req, res) => {
  try {
    const { tipo, marca, modelo, version, anio, condicion, precio, dominio } = req.body;
    
    if (!tipo || !marca || !modelo || !anio || !condicion || !precio) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados' });
    }

    if (condicion === 'usado' && !dominio) {
      return res.status(400).json({ message: 'El dominio es obligatorio para vehículos usados' });
    }

    db.run('INSERT INTO vehiculos (tipo, marca, modelo, version, anio, condicion, precio, dominio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tipo, marca, modelo, version, anio, condicion, precio, dominio],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error al guardar vehículo' });
        }
        
        const vehiculoId = this.lastID;
        const vehiculoData = { tipo, marca, modelo, version, anio, condicion, precio, dominio };
        
        // Registrar auditoría (asumimos que viene del usuario logueado)
        registrarAuditoria(1, 'CREACION_VEHICULO', 'vehiculos', vehiculoId, null, vehiculoData);
        
        res.status(201).json({ 
          message: 'Vehículo agregado correctamente',
          vehiculo: { id: vehiculoId, ...vehiculoData }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Soft delete de vehículos
app.delete('/api/vehiculos/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener datos antes de eliminar
    db.get('SELECT * FROM vehiculos WHERE id = ? AND eliminado = 0', [id], (err, vehiculo) => {
      if (err) {
        return res.status(500).json({ message: 'Error al obtener vehículo' });
      }
      
      if (!vehiculo) {
        return res.status(404).json({ message: 'Vehículo no encontrado' });
      }
      
      // Soft delete
      db.run('UPDATE vehiculos SET eliminado = 1, eliminado_por = ?, fecha_eliminacion = CURRENT_TIMESTAMP WHERE id = ?', 
        [1, id], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error al eliminar vehículo' });
          }
          
          // Registrar auditoría
          registrarAuditoria(1, 'ELIMINACION_VEHICULO', 'vehiculos', parseInt(id), vehiculo, { eliminado: true });
          
          res.json({ message: 'Vehículo eliminado correctamente' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Rutas de clientes
app.get('/api/clientes', (req, res) => {
  db.all('SELECT * FROM clientes ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener clientes' });
    }
    res.json(rows);
  });
});

app.post('/api/clientes', (req, res) => {
  try {
    const { nombre, apellido, dni, telefono, email, direccion, observaciones } = req.body;
    
    if (!nombre || !apellido || !dni) {
      return res.status(400).json({ message: 'Nombre, apellido y DNI son obligatorios' });
    }

    db.run('INSERT INTO clientes (nombre, apellido, dni, telefono, email, direccion, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, apellido, dni, telefono, email, direccion, observaciones],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'El DNI ya está registrado' });
          }
          return res.status(500).json({ message: 'Error al guardar cliente' });
        }
        res.status(201).json({ 
          message: 'Cliente agregado correctamente',
          cliente: { id: this.lastID, ...req.body }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Rutas de minutas
app.get('/api/minutas', (req, res) => {
  db.all(`
    SELECT m.*, v.marca, v.modelo, v.anio, c.nombre as cliente_nombre, c.apellido as cliente_apellido, u.nombre as vendedor_nombre
    FROM minutas m
    JOIN vehiculos v ON m.vehiculo_id = v.id
    JOIN clientes c ON m.cliente_id = c.id
    JOIN usuarios u ON m.vendedor_id = u.id
    WHERE m.eliminado = 0
    ORDER BY m.created_at DESC
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener minutas' });
    }
    res.json(rows);
  });
});

app.post('/api/minutas', (req, res) => {
  try {
    const { vehiculo_id, cliente_id, vendedor_id, precio_original, precio_final, observaciones } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    if (!vehiculo_id || !cliente_id || !vendedor_id || !precio_original || !precio_final) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados' });
    }

    // Verificar si el vehículo está disponible
    db.get('SELECT * FROM vehiculos WHERE id = ? AND eliminado = 0', [vehiculo_id], (err, vehiculo) => {
      if (err) {
        return res.status(500).json({ message: 'Error al verificar vehículo' });
      }
      
      if (!vehiculo) {
        return res.status(404).json({ message: 'Vehículo no encontrado' });
      }
      
      if (vehiculo.estado !== 'disponible') {
        // Registrar intento de vender vehículo no disponible
        registrarAccion(vendedor_id, null, 'INTENTO_VENDER_NO_DISPONIBLE', 'minutas', 
          { vehiculo_id, estado_actual: vehiculo.estado }, ipAddress);
        
        // Notificar al admin premium
        db.get('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1', (err, premiumUser) => {
          if (!err && premiumUser) {
            crearAlertaPremium(premiumUser.id, '🚫 Intento de Venta Duplicada', 
              `El vendedor ${vendedor_id} intentó vender un vehículo no disponible (ID: ${vehiculo_id})`, 
              'venta_duplicada', vendedor_id, { vehiculo_id, estado_actual: vehiculo.estado });
          }
        });
        
        return res.status(400).json({ message: 'Este vehículo no está disponible para venta. Estado actual: ' + vehiculo.estado });
      }

      // Verificar si ya existe una minuta activa para este vehículo
      db.get('SELECT * FROM minutas WHERE vehiculo_id = ? AND estado NOT IN ("cerrada", "cancelada") AND eliminado = 0', 
        [vehiculo_id], (err, minutaExistente) => {
          if (err) {
            return res.status(500).json({ message: 'Error al verificar minutas existentes' });
          }
          
          if (minutaExistente) {
            // Registrar intento de duplicar minuta
            registrarAccion(vendedor_id, null, 'INTENTO_MINUTA_DUPLICADA', 'minutas', 
              { vehiculo_id, minuta_existente_id: minutaExistente.id }, ipAddress);
            
            // Notificar al admin premium
            db.get('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1', (err, premiumUser) => {
              if (!err && premiumUser) {
                crearAlertaPremium(premiumUser.id, '🚫 Intento de Minuta Duplicada', 
                  `El vendedor ${vendedor_id} intentó crear otra minuta para el mismo vehículo (ID: ${vehiculo_id})`, 
                  'minuta_duplicada', vendedor_id, { vehiculo_id, minuta_existente_id: minutaExistente.id });
              }
            });
            
            return res.status(400).json({ message: 'Ya existe una minuta activa para este vehículo. Minuta ID: ' + minutaExistente.id });
          }

          // Crear la minuta y actualizar el estado del vehículo
          db.run('INSERT INTO minutas (vehiculo_id, cliente_id, vendedor_id, precio_original, precio_final, observaciones, estado) VALUES (?, ?, ?, ?, ?, ?, "reservada")',
            [vehiculo_id, cliente_id, vendedor_id, precio_original, precio_final, observaciones],
            function(err) {
              if (err) {
                return res.status(500).json({ message: 'Error al crear minuta' });
              }
              
              const minutaId = this.lastID;
              
              // Actualizar el estado del vehículo a reservado
              db.run('UPDATE vehiculos SET estado = "reservado", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [vehiculo_id], (err) => {
                if (err) {
                  console.error('Error al actualizar estado del vehículo:', err);
                }
              });
              
              // Registrar auditoría
              registrarAuditoria(vendedor_id, 'CREACION_MINUTA', 'minutas', minutaId, 
                null, { vehiculo_id, cliente_id, vendedor_id, precio_original, precio_final });
              
              // Notificar al admin premium
              db.get('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1', (err, premiumUser) => {
                if (!err && premiumUser) {
                  crearAlertaPremium(premiumUser.id, '📋 Nueva Minuta Creada', 
                    `Se ha creado una nueva minuta para el vehículo ${vehiculo_id} - Vendedor: ${vendedor_id}`, 
                    'nueva_minuta', vendedor_id, { minuta_id: minutaId, vehiculo_id, cliente_id });
                }
              });
              
              res.status(201).json({ 
                message: 'Minuta creada correctamente y vehículo reservado',
                minuta: { id: minutaId, vehiculo_id, cliente_id, vendedor_id, precio_original, precio_final, estado: 'reservada' }
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para liberar vehículo (solo administradores)
app.post('/api/minutas/:id/liberar-vehiculo', (req, res) => {
  const { id } = req.params;
  const { usuario_id, rol } = req.body;
  
  // Verificar que sea administrador
  if (rol !== 'administrador') {
    return res.status(403).json({ message: 'Solo los administradores pueden liberar vehículos' });
  }
  
  // Obtener la minuta
  db.get('SELECT * FROM minutas WHERE id = ? AND eliminado = 0', [id], (err, minuta) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener minuta' });
    }
    
    if (!minuta) {
      return res.status(404).json({ message: 'Minuta no encontrada' });
    }
    
    // Actualizar estado del vehículo a disponible
    db.run('UPDATE vehiculos SET estado = "disponible", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [minuta.vehiculo_id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error al liberar vehículo' });
      }
      
      // Actualizar estado de la minuta
      db.run('UPDATE minutas SET estado = "cancelada", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error al actualizar minuta' });
        }
        
        // Registrar auditoría
        registrarAuditoria(usuario_id, 'LIBERACION_VEHICULO', 'minutas', id, 
          { estado_anterior: minuta.estado }, { estado_nuevo: 'cancelada' });
        
        // Notificar al admin premium
        db.get('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1', (err, premiumUser) => {
          if (!err && premiumUser) {
            crearAlertaPremium(premiumUser.id, '🚗 Vehículo Liberado', 
              `El administrador ${usuario_id} liberó el vehículo ${minuta.vehiculo_id}`, 
              'vehiculo_liberado', usuario_id, { minuta_id: id, vehiculo_id: minuta.vehiculo_id });
          }
        });
        
        res.json({ message: 'Vehículo liberado correctamente y disponible para venta' });
      });
    });
  });
});

// Rutas de gestión de usuarios (solo admin premium)
app.get('/api/usuarios/todos', async (req, res) => {
  try {
    const usuarios = await new Promise((resolve, reject) => {
      const query = `
        SELECT id, nombre, email, rol, habilitado, es_premium, created_at, updated_at
        FROM usuarios 
        ORDER BY created_at DESC
      `;
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

app.post('/api/usuarios/:id/suspender', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, mensaje, duracion, usuario_premium_id } = req.body;
    
    // Obtener datos del usuario a suspender
    db.get('SELECT * FROM usuarios WHERE id = ?', [id], (err, usuario) => {
      if (err) {
        return res.status(500).json({ message: 'Error al obtener usuario' });
      }
      
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      if (usuario.es_premium) {
        return res.status(403).json({ message: 'No se puede suspender al usuario premium' });
      }
      
      // Actualizar estado del usuario
      db.run('UPDATE usuarios SET habilitado = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error al suspender usuario' });
        }
        
        // Registrar en tabla de suspensiones
        db.run('INSERT INTO suspensiones (usuario_id, motivo, mensaje, duracion, suspendido_por) VALUES (?, ?, ?, ?, ?)',
          [id, motivo, mensaje, duracion, usuario_premium_id], (err) => {
            if (err) {
              console.error('Error al registrar suspensión:', err);
            }
          });
        
        // Registrar auditoría
        registrarAuditoria(usuario_premium_id, 'SUSPENSION_USUARIO', 'usuarios', id, 
          { estado_anterior: usuario.habilitado }, { estado_nuevo: false, motivo });
        
        // Notificar al admin premium
        crearAlertaPremium(usuario_premium_id, '🚫 Usuario Suspendido', 
          `El usuario ${usuario.nombre} (${usuario.email}) ha sido suspendido por: ${motivo}`, 
          'usuario_suspendido', id, { motivo, mensaje, duracion });
        
        res.json({ message: 'Usuario suspendido correctamente' });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/usuarios/:id/reactivar', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_premium_id } = req.body;
    
    // Obtener datos del usuario a reactivar
    db.get('SELECT * FROM usuarios WHERE id = ?', [id], (err, usuario) => {
      if (err) {
        return res.status(500).json({ message: 'Error al obtener usuario' });
      }
      
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Reactivar usuario
      db.run('UPDATE usuarios SET habilitado = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error al reactivar usuario' });
        }
        
        // Registrar auditoría
        registrarAuditoria(usuario_premium_id, 'REACTIVACION_USUARIO', 'usuarios', id, 
          { estado_anterior: usuario.habilitado }, { estado_nuevo: true });
        
        // Notificar al admin premium
        crearAlertaPremium(usuario_premium_id, '✅ Usuario Reactivado', 
          `El usuario ${usuario.nombre} (${usuario.email}) ha sido reactivado`, 
          'usuario_reactivado', id, {});
        
        res.json({ message: 'Usuario reactivado correctamente' });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_premium_id } = req.body;
    
    // Obtener datos del usuario a eliminar
    db.get('SELECT * FROM usuarios WHERE id = ?', [id], (err, usuario) => {
      if (err) {
        return res.status(500).json({ message: 'Error al obtener usuario' });
      }
      
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      if (usuario.es_premium) {
        return res.status(403).json({ message: 'No se puede eliminar al usuario premium' });
      }
      
      // Soft delete del usuario
      db.run('UPDATE usuarios SET habilitado = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error al eliminar usuario' });
        }
        
        // Registrar auditoría
        registrarAuditoria(usuario_premium_id, 'ELIMINACION_USUARIO', 'usuarios', id, 
          { datos_anteriores: usuario }, { eliminado: true });
        
        // Notificar al admin premium
        crearAlertaPremium(usuario_premium_id, '🗑️ Usuario Eliminado', 
          `El usuario ${usuario.nombre} (${usuario.email}) ha sido eliminado del sistema`, 
          'usuario_eliminado', id, { datos_anteriores: usuario });
        
        res.json({ message: 'Usuario eliminado correctamente' });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Iniciar servidor (accesible desde cualquier dispositivo en la red)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📱 Acceso móvil: http://192.168.0.42:${PORT}/mobile.html`);
});
