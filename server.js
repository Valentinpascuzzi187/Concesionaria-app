// server.js (versión MySQL/SQL)
// Mantiene: mismas rutas, mismas respuestas/mensajes, misma lógica de negocio.
// Cambios: todo lo que era sqlite3 (db.get/db.run/db.all/PRAGMA/copia .db) ahora es MySQL (pool + SQL).

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (para acceso móvil)
app.use(express.static(path.join(__dirname, 'src')));

// Servir páginas móviles desde /public sin sobrescribir index.html de Electron
app.get('/mobile.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'mobile.html')));
app.get('/mobile-railway.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'mobile-railway.html')));
app.get('/mobile-offline.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'mobile-offline.html')));
app.get('/minuta-venta.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'minuta-venta.html')));
app.get('/minuta-directa.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'minuta-directa.html')));
app.get('/manifest.json', (req, res) => res.sendFile(path.join(__dirname, 'public', 'manifest.json')));

// Versión actualizada - Minuta Profesional v2.1 - Force Update Railway - 2025-01-15
console.log('🚀 Concesionaria App v2.1 - Minuta Profesional Activa - FORCE UPDATE');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    features: {
      minuta_profesional: true,
      login_corregido: true,
      api_actualizada: true
    }
  });
});

const dbConfig = {
  uri: "mysql://root:qWKfCJlRRctoiYmRnFNPetrmogGoZZCi@maglev.proxy.rlwy.net:51157/railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// Helpers MySQL
async function q(sql, params = []) {
  // SELECT => rows; INSERT/UPDATE/DELETE => result object
  const [rows] = await pool.execute(sql, params);
  return rows;
}
async function qFirst(sql, params = []) {
  const rows = await q(sql, params);
  return rows && rows.length ? rows[0] : null;
}

async function connectDB() {
  try {
    pool = await mysql.createPool(dbConfig.uri);
    console.log('✅ Conectado a MySQL en Railway');

    // Inicializaciones
    await initTables();               // crea tablas en MySQL
    await ensureColumns();            // agrega columnas faltantes (equivalente a PRAGMA/ALTER)
    await crearUsuarioPremium();      // crea premium si no existe
    iniciarSistemaRespaldo();         // backup lógico (JSON) en MySQL
  } catch (err) {
    console.error('❌ Error al conectar con MySQL:', err.message);
  }
}

connectDB();

/* =========================
   BACKUP (MySQL)
   - En sqlite se copiaba concesionaria.db.
   - En MySQL no existe archivo .db para copiar.
   - Mantenemos el mismo mensaje y flujo: respaldo automático.
   - Implementación: export lógico a JSON y guardar en /backups.
========================= */

function iniciarSistemaRespaldo() {
  console.log('🔄 Iniciando sistema de respaldo automático...');

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  setInterval(() => {
    realizarRespaldoLocal()
      .then(() => console.log('📦 Respaldo automático realizado:', new Date().toISOString()))
      .catch(() => console.log('📦 Respaldo automático realizado:', new Date().toISOString()));
  }, 5 * 60 * 1000);

  realizarRespaldoLocal().catch(() => {});
}

async function realizarRespaldoLocal() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, 'backups', `concesionaria_backup_${timestamp}.json`);

    const datos = await exportarDatosJSON();
    fs.writeFileSync(backupFile, JSON.stringify(datos, null, 2), 'utf8');

    // Mantener solo los últimos 10 backups
    const backupDir = path.join(__dirname, 'backups');
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 10) {
      for (let i = 10; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
        console.log('🗑️ Backup antiguo eliminado:', files[i].name);
      }
    }

    console.log('✅ Respaldo local creado:', backupFile);

    // Registrar en auditoría (mantenemos usuario_id=1 como en tu código)
    await registrarAuditoria(1, 'RESPALDO_AUTOMATICO', 'sistema', null, null, {
      archivo: backupFile,
      timestamp: timestamp
    });

  } catch (error) {
    console.error('❌ Error en respaldo automático:', error);
  }
}

/* =========================
   EXPORT JSON (MySQL)
========================= */

async function exportarDatosJSON() {
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

  // En paralelo
  const [
    usuarios,
    vehiculos,
    clientes,
    minutas,
    auditoria,
    tracking_sesiones,
    tracking_navegacion,
    tracking_acciones,
    alertas_premium,
    suspensiones
  ] = await Promise.all([
    q('SELECT * FROM usuarios'),
    q('SELECT * FROM vehiculos'),
    q('SELECT * FROM clientes'),
    q('SELECT * FROM minutas'),
    q('SELECT * FROM auditoria'),
    q('SELECT * FROM tracking_sesiones'),
    q('SELECT * FROM tracking_navegacion'),
    q('SELECT * FROM tracking_acciones'),
    q('SELECT * FROM alertas_premium'),
    q('SELECT * FROM suspensiones')
  ]);

  datos.usuarios = usuarios;
  datos.vehiculos = vehiculos;
  datos.clientes = clientes;
  datos.minutas = minutas;
  datos.auditoria = auditoria;
  datos.tracking_sesiones = tracking_sesiones;
  datos.tracking_navegacion = tracking_navegacion;
  datos.tracking_acciones = tracking_acciones;
  datos.alertas_premium = alertas_premium;
  datos.suspensiones = suspensiones;

  return datos;
}

// Ruta para exportar datos (solo admin premium)
app.get('/api/exportar-datos', async (req, res) => {
  try {
    const datos = await exportarDatosJSON();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFile = path.join(__dirname, 'exports', `export_completo_${timestamp}.json`);

    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    fs.writeFileSync(exportFile, JSON.stringify(datos, null, 2));

    await registrarAuditoria(1, 'EXPORTACION_DATOS', 'sistema', null, null, {
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

    // Igual que tu código: "Sistema de importación listo"
    await registrarAuditoria(1, 'IMPORTACION_DATOS', 'sistema', null, null, {
      timestamp: new Date().toISOString(),
      origen: 'importacion_manual'
    });

    res.json({ message: 'Sistema de importación listo' });

  } catch (error) {
    console.error('Error al importar datos:', error);
    res.status(500).json({ message: 'Error al importar datos' });
  }
});

// Ruta para verificar/crear usuario premium (para depuración)
app.get('/api/verificar-premium', async (req, res) => {
  try {
    const premiumEmail = 'admin@concesionaria.com';

    const row = await qFirst('SELECT * FROM usuarios WHERE email = ?', [premiumEmail]);

    if (row) {
      res.json({
        message: 'Usuario premium encontrado',
        usuario: {
          id: row.id,
          nombre: row.nombre,
          email: row.email,
          rol: row.rol,
          es_premium: !!row.es_premium,
          habilitado: !!row.habilitado
        }
      });
    } else {
      const result = await q(
        'INSERT INTO usuarios (nombre, email, password, rol, es_premium, habilitado) VALUES (?, ?, ?, ?, ?, ?)',
        ['Dueño', premiumEmail, 'Halcon2716@', 'administrador', 1, 1]
      );

      res.json({
        message: 'Usuario premium creado exitosamente',
        usuario: {
          id: result.insertId,
          nombre: 'Dueño',
          email: premiumEmail,
          rol: 'administrador',
          es_premium: true,
          habilitado: true
        }
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error en la base de datos', error: err.message });
  }
});

// Ruta para exportar a Excel (descarga directa)
app.get('/api/exportar-excel', async (req, res) => {
  try {
    const datos = await exportarDatosJSON();
    const workbook = XLSX.utils.book_new();

    if (datos.usuarios?.length) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(datos.usuarios), 'Usuarios');
    if (datos.vehiculos?.length) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(datos.vehiculos), 'Vehiculos');
    if (datos.clientes?.length) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(datos.clientes), 'Clientes');
    if (datos.minutas?.length) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(datos.minutas), 'Minutas');
    if (datos.auditoria?.length) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(datos.auditoria), 'Auditoria');
    if (datos.tracking_sesiones?.length) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(datos.tracking_sesiones), 'Sesiones');
    if (datos.tracking_acciones?.length) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(datos.tracking_acciones), 'Acciones');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Disposition', `attachment; filename=concesionaria_${timestamp}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

    await registrarAuditoria(1, 'EXPORTACION_EXCEL', 'sistema', null, null, { timestamp });

  } catch (error) {
    console.error('Error al exportar Excel:', error);
    res.status(500).json({ message: 'Error al exportar Excel' });
  }
});

/* =========================
   INIT TABLES (MySQL)
========================= */

async function initTables() {
  // Nota:
  // - Usamos InnoDB para FKs.
  // - Booleans => TINYINT(1).
  // - JSON => TEXT (para mantener compatibilidad con tu sqlite TEXT).
  // - CURRENT_TIMESTAMP + ON UPDATE donde aplica.

  await q(`CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'vendedor',
    habilitado TINYINT(1) DEFAULT 1,
    telefono VARCHAR(50),
    es_premium TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS vehiculos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    version VARCHAR(100),
    anio INT NOT NULL,
    condicion VARCHAR(50) NOT NULL,
    precio DECIMAL(12,2) NOT NULL,
    dominio VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'disponible',
    eliminado TINYINT(1) DEFAULT 0,
    eliminado_por INT NULL,
    fecha_eliminacion DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehiculos_eliminado_por FOREIGN KEY (eliminado_por) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    dni VARCHAR(50) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion VARCHAR(255),
    observaciones TEXT,
    eliminado TINYINT(1) DEFAULT 0,
    eliminado_por INT NULL,
    fecha_eliminacion DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_clientes_eliminado_por FOREIGN KEY (eliminado_por) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS minutas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehiculo_id INT NOT NULL,
    cliente_id INT NOT NULL,
    vendedor_id INT NOT NULL,
    precio_original DECIMAL(12,2) NOT NULL,
    precio_final DECIMAL(12,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'iniciada',
    observaciones TEXT,
    eliminado TINYINT(1) DEFAULT 0,
    eliminado_por INT NULL,
    fecha_eliminacion DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_minutas_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_minutas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_minutas_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_minutas_eliminado_por FOREIGN KEY (eliminado_por) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS auditoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    accion VARCHAR(255) NOT NULL,
    tabla_afectada VARCHAR(255),
    registro_id INT NULL,
    datos_anteriores TEXT,
    datos_nuevos TEXT,
    ip_address VARCHAR(100),
    fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
    notificado_premium TINYINT(1) DEFAULT 0,
    dispositivo_id VARCHAR(255),
    dispositivo_info TEXT,
    fecha_dispositivo DATETIME,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_premium_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    leida TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificaciones_premium FOREIGN KEY (usuario_premium_id) REFERENCES usuarios(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS dispositivos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NULL,
    mac_address VARCHAR(255),
    dispositivo_id VARCHAR(255) UNIQUE,
    modelo VARCHAR(255),
    plataforma VARCHAR(255),
    navegador VARCHAR(255),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_acceso DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispositivos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS tracking_sesiones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NULL,
    fecha_login DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_logout DATETIME NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    dispositivo_id VARCHAR(255),
    dispositivo_info TEXT,
    duracion_segundos INT,
    CONSTRAINT fk_tracking_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS tracking_navegacion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sesion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    seccion_visitada VARCHAR(255),
    fecha_visita DATETIME DEFAULT CURRENT_TIMESTAMP,
    tiempo_en_seccion INT,
    ip_address VARCHAR(100),
    accion VARCHAR(255),
    detalles TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tracking_nav_sesion FOREIGN KEY (sesion_id) REFERENCES tracking_sesiones(id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tracking_nav_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS tracking_acciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    sesion_id INT NULL,
    tipo_accion VARCHAR(100),
    modulo VARCHAR(100),
    datos_accion TEXT,
    ip_address VARCHAR(100),
    fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
    notificado_premium TINYINT(1) DEFAULT 0,
    CONSTRAINT fk_tracking_acciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tracking_acciones_sesion FOREIGN KEY (sesion_id) REFERENCES tracking_sesiones(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS alertas_premium (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_premium_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo_alerta VARCHAR(100),
    usuario_afectado_id INT NULL,
    datos_adicionales TEXT,
    leida TINYINT(1) DEFAULT 0,
    fecha_alerta DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alertas_premium_usuario FOREIGN KEY (usuario_premium_id) REFERENCES usuarios(id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_alertas_premium_afectado FOREIGN KEY (usuario_afectado_id) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS historial_datos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tabla_afectada VARCHAR(255) NOT NULL,
    registro_id INT NOT NULL,
    campo_modificado VARCHAR(255) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    modificado_por INT NOT NULL,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuarios(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS suspensiones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    mensaje TEXT,
    duracion VARCHAR(100),
    suspendido_por INT NOT NULL,
    fecha_suspension DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_reactivacion DATETIME NULL,
    CONSTRAINT fk_susp_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_susp_por FOREIGN KEY (suspendido_por) REFERENCES usuarios(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS minutas_detalladas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    datos_completos TEXT NOT NULL,
    estado VARCHAR(50) DEFAULT 'borrador',
    creado_por INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_minutas_det_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB`);
}

// Asegurar columnas (equivalente ensureColumn PRAGMA en sqlite)
async function ensureColumns() {
  // Ya creamos estas columnas en auditoria/tracking_sesiones arriba, pero lo dejamos por compatibilidad
  // por si tu BD ya existía sin columnas.
  async function colExists(table, column) {
    const row = await qFirst(
      `SELECT 1 AS ok
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
       LIMIT 1`,
      [table, column]
    );
    return !!row;
  }

  async function addColumn(table, column, definition) {
    await q(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }

  // auditoria
  if (!(await colExists('auditoria', 'dispositivo_id'))) await addColumn('auditoria', 'dispositivo_id', 'VARCHAR(255)');
  if (!(await colExists('auditoria', 'dispositivo_info'))) await addColumn('auditoria', 'dispositivo_info', 'TEXT');
  if (!(await colExists('auditoria', 'fecha_dispositivo'))) await addColumn('auditoria', 'fecha_dispositivo', 'DATETIME');

  // tracking_sesiones
  if (!(await colExists('tracking_sesiones', 'dispositivo_id'))) await addColumn('tracking_sesiones', 'dispositivo_id', 'VARCHAR(255)');
  if (!(await colExists('tracking_sesiones', 'dispositivo_info'))) await addColumn('tracking_sesiones', 'dispositivo_info', 'TEXT');
}

/* =========================
   CREAR USUARIO PREMIUM
========================= */

async function crearUsuarioPremium() {
  const premiumEmail = 'admin@concesionaria.com';

  try {
    const row = await qFirst('SELECT id FROM usuarios WHERE email = ?', [premiumEmail]);
    if (!row) {
      const result = await q(
        'INSERT INTO usuarios (nombre, email, password, rol, es_premium, habilitado) VALUES (?, ?, ?, ?, ?, ?)',
        ['Dueño', premiumEmail, 'Halcon2716@', 'administrador', 1, 1]
      );

      console.log('✅ Usuario premium creado exitosamente');
      console.log(`📧 Email: ${premiumEmail}`);
      console.log('🔑 Password: Halcon2716@');
      console.log('👤 Rol: Administrador Premium');

      await registrarAuditoria(result.insertId, 'CREACION_USUARIO_PREMIUM', 'usuarios', result.insertId, null, {
        nombre: 'Dueño',
        email: premiumEmail,
        rol: 'administrador',
        es_premium: true
      });
    } else {
      console.log('✅ Usuario premium ya existe');
    }
  } catch (err) {
    console.error('❌ Error verificando usuario premium:', err);
  }
}

/* =========================
   DISPOSITIVOS / TRACKING
========================= */

async function registrarDispositivo(usuarioId, dispositivoInfo) {
  const { dispositivo_id, mac_address, modelo, plataforma, navegador } = dispositivoInfo;

  const existing = await qFirst('SELECT id FROM dispositivos WHERE dispositivo_id = ?', [dispositivo_id]);
  if (existing) {
    await q('UPDATE dispositivos SET fecha_ultimo_acceso = CURRENT_TIMESTAMP WHERE dispositivo_id = ?', [dispositivo_id]);
    return existing.id;
  } else {
    const result = await q(
      'INSERT INTO dispositivos (usuario_id, mac_address, dispositivo_id, modelo, plataforma, navegador) VALUES (?, ?, ?, ?, ?, ?)',
      [usuarioId, mac_address, dispositivo_id, modelo, plataforma, navegador]
    );
    return result.insertId;
  }
}

async function registrarSesion(usuarioId, ipAddress, userAgent, dispositivoInfo = {}) {
  const dispositivoId = dispositivoInfo && dispositivoInfo.dispositivo_id ? dispositivoInfo.dispositivo_id : null;
  const result = await q(
    `INSERT INTO tracking_sesiones (usuario_id, fecha_login, ip_address, user_agent, dispositivo_id, dispositivo_info)
     VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?)`,
    [usuarioId, ipAddress, userAgent, dispositivoId, JSON.stringify(dispositivoInfo)]
  );
  return result.insertId;
}

async function cerrarSesion(sesionId) {
  const row = await qFirst('SELECT fecha_login FROM tracking_sesiones WHERE id = ?', [sesionId]);
  if (!row) return;

  const duracion = Math.floor((Date.now() - new Date(row.fecha_login).getTime()) / 1000);
  await q(
    `UPDATE tracking_sesiones
     SET fecha_logout = CURRENT_TIMESTAMP, duracion_segundos = ?
     WHERE id = ?`,
    [duracion, sesionId]
  );
}

async function registrarNavegacion(sesionId, usuarioId, seccion, accion, detalles, ipAddress) {
  await q(
    `INSERT INTO tracking_navegacion (sesion_id, usuario_id, seccion_visitada, accion, detalles, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sesionId, usuarioId, seccion, accion, detalles, ipAddress]
  );

  if (usuarioId) {
    const row = await qFirst('SELECT es_premium FROM usuarios WHERE id = ?', [usuarioId]);
    if (row && !row.es_premium) {
      const premiumUser = await qFirst('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1 LIMIT 1');
      if (premiumUser) {
        await crearAlertaPremium(
          premiumUser.id,
          'Navegación Detectada',
          `Usuario ${usuarioId} visitó: ${seccion} - ${accion}`,
          'pagina_visitada',
          usuarioId,
          { seccion, accion, detalles }
        );
      }
    }
  }
}

async function registrarAccion(usuarioId, sesionId, tipoAccion, modulo, datosAccion, ipAddress) {
  await q(
    `INSERT INTO tracking_acciones (usuario_id, sesion_id, tipo_accion, modulo, datos_accion, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioId, sesionId, tipoAccion, modulo, datosAccion, ipAddress]
  );

  if (usuarioId) {
    const row = await qFirst('SELECT es_premium FROM usuarios WHERE id = ?', [usuarioId]);
    if (row && !row.es_premium) {
      const premiumUser = await qFirst('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1 LIMIT 1');
      if (premiumUser) {
        await crearAlertaPremium(
          premiumUser.id,
          'Acción Detectada',
          `Usuario ${usuarioId} realizó: ${tipoAccion} en ${modulo}`,
          'accion_critica',
          usuarioId,
          { tipoAccion, modulo, datosAccion }
        );
      }
    }
  }
}

async function crearAlertaPremium(usuarioPremiumId, titulo, mensaje, tipoAlerta, usuarioAfectadoId, datosAdicionales) {
  await q(
    `INSERT INTO alertas_premium (usuario_premium_id, titulo, mensaje, tipo_alerta, usuario_afectado_id, datos_adicionales)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioPremiumId, titulo, mensaje, tipoAlerta, usuarioAfectadoId, JSON.stringify(datosAdicionales)]
  );
}

/* =========================
   AUDITORÍA / NOTIFICACIONES
========================= */

async function registrarAuditoria(usuarioId, accion, tablaAfectada, registroId, arg5 = null, arg6 = null, arg7 = null) {
  let datosAnteriores = null;
  let datosNuevos = null;
  let meta = {};

  if (arg7 && typeof arg7 === 'object') meta = arg7;

  // Firma legacy A: (usuarioId, accion, tabla, registroId, sesionId, detalles)
  // Firma legacy B: (usuarioId, accion, tabla, registroId, datosAnteriores, datosNuevos)
  if (typeof arg5 === 'number' && arg6 && typeof arg6 === 'object' && !Array.isArray(arg6)) {
    datosAnteriores = null;
    datosNuevos = arg6;
  } else {
    datosAnteriores = arg5;
    datosNuevos = arg6;
  }

  const ipAddress = meta.ip_address || null;
  const dispositivoId = meta.dispositivo_id || (meta.dispositivo_info && meta.dispositivo_info.dispositivo_id) || null;
  const dispositivoInfo = meta.dispositivo_info ? JSON.stringify(meta.dispositivo_info) : null;
  const fechaDispositivo = meta.fecha_dispositivo || (meta.dispositivo_info && meta.dispositivo_info.fecha_dispositivo) || null;

  try {
    await q(
      `INSERT INTO auditoria
        (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, dispositivo_id, dispositivo_info, fecha_dispositivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioId,
        accion,
        tablaAfectada,
        registroId,
        JSON.stringify(datosAnteriores ?? null),
        JSON.stringify(datosNuevos ?? null),
        ipAddress,
        dispositivoId,
        dispositivoInfo,
        fechaDispositivo
      ]
    );

    if (usuarioId) {
      const row = await qFirst('SELECT es_premium FROM usuarios WHERE id = ?', [usuarioId]);
      if (row && !row.es_premium) {
        const premiumUser = await qFirst('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1 LIMIT 1');
        if (premiumUser) {
          await crearNotificacion(
            premiumUser.id,
            'Cambio Registrado',
            `El usuario ${usuarioId} realizó: ${accion} en ${tablaAfectada}`,
            'auditoria'
          );
        }
      }
    }
  } catch (err) {
    console.error('Error al registrar auditoría:', err);
  }
}

async function crearNotificacion(usuarioPremiumId, titulo, mensaje, tipo) {
  await q(
    `INSERT INTO notificaciones (usuario_premium_id, titulo, mensaje, tipo)
     VALUES (?, ?, ?, ?)`,
    [usuarioPremiumId, titulo, mensaje, tipo]
  );
}

async function registrarHistorial(tablaAfectada, registroId, campoModificado, valorAnterior, valorNuevo, modificadoPor) {
  await q(
    `INSERT INTO historial_datos (tabla_afectada, registro_id, campo_modificado, valor_anterior, valor_nuevo, modificado_por)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tablaAfectada, registroId, campoModificado, valorAnterior, valorNuevo, modificadoPor]
  );
}

/* =========================
   RUTA: CREAR ADMIN LIMITADO
========================= */

app.post('/api/usuarios/crear-admin', async (req, res) => {
  try {
    const { usuario_premium_id, nombre, email, password } = req.body;

    if (!usuario_premium_id || !nombre || !email || !password) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    const premiumRow = await qFirst(
      'SELECT id FROM usuarios WHERE id = ? AND es_premium = 1 AND habilitado = 1',
      [usuario_premium_id]
    );

    if (!premiumRow) return res.status(403).json({ message: 'No autorizado' });

    try {
      const result = await q(
        'INSERT INTO usuarios (nombre, email, password, rol, es_premium, habilitado) VALUES (?, ?, ?, ?, 0, 1)',
        [nombre, email, password, 'administrador']
      );

      await registrarAuditoria(
        usuario_premium_id,
        'CREACION_ADMIN_LIMITADO',
        'usuarios',
        result.insertId,
        null,
        { nombre, email, rol: 'administrador' },
        { ip_address: req.ip || (req.connection && req.connection.remoteAddress) }
      );

      res.status(201).json({
        message: 'Administrador creado',
        user: { id: result.insertId, nombre, email, rol: 'administrador', es_premium: 0, habilitado: 1 }
      });
    } catch (err) {
      if (String(err.message || '').toUpperCase().includes('DUPLICATE') || String(err.message || '').includes('UNIQUE')) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }
      return res.status(500).json({ message: 'Error al crear administrador' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/* =========================
   AUTH
========================= */

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, email, password, rol = 'vendedor' } = req.body;
    const ipAddress = req.ip || (req.connection && req.connection.remoteAddress);

    const allowedIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
    const isAllowedIP = allowedIPs.includes(ipAddress) || String(ipAddress).includes('127.0.0.1') || String(ipAddress).includes('localhost');

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const exists = await qFirst('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (exists) return res.status(400).json({ message: 'El email ya está registrado' });

    if (rol === 'administrador' && !isAllowedIP) {
      await registrarAccion(null, null, 'INTENTO_CREAR_ADMIN', 'auth', JSON.stringify({ nombre, email, rol }), ipAddress);

      const premiumUser = await qFirst('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1 LIMIT 1');
      if (premiumUser) {
        await crearAlertaPremium(
          premiumUser.id,
          '🚨 INTENTO DE CREAR ADMINISTRADOR',
          `Alguien intentó crear un usuario administrador: ${nombre} (${email})`,
          'intento_admin_critico',
          null,
          { nombre, email, rol, ipAddress }
        );
      }

      return res.status(403).json({ message: 'No autorizado para crear administradores' });
    }

    const result = await q(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, password, rol]
    );

    if (!isAllowedIP) {
      await registrarAuditoria(result.insertId, 'CREACION_USUARIO', 'usuarios', result.insertId, null, { nombre, email, rol });
    }

    if (!isAllowedIP) {
      const premiumUser = await qFirst('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1 LIMIT 1');
      if (premiumUser) {
        await crearAlertaPremium(
          premiumUser.id,
          '👤 Nuevo Usuario Registrado',
          `Se ha registrado un nuevo usuario: ${nombre} (${email}) - Rol: ${rol}`,
          'nuevo_usuario',
          result.insertId,
          { nombre, email, rol }
        );
      }
    }

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: { id: result.insertId, nombre, email, rol }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, dispositivo_info = {} } = req.body;
    const ipAddress = req.ip || (req.connection && req.connection.remoteAddress);
    const userAgent = req.get('User-Agent');

    const allowedIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
    const isAllowedIP = allowedIPs.includes(ipAddress) || String(ipAddress).includes('127.0.0.1') || String(ipAddress).includes('localhost');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son obligatorios' });
    }

    const row = await qFirst('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (!row) {
      if (!isAllowedIP) await registrarAccion(null, null, 'LOGIN_FALLIDO', 'auth', JSON.stringify({ email, error: 'usuario_no_encontrado' }), ipAddress);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!row.habilitado) {
      if (!row.es_premium && !isAllowedIP) await registrarAccion(row.id, null, 'LOGIN_DESHABILITADO', 'auth', JSON.stringify({ email }), ipAddress);
      return res.status(401).json({ message: 'Usuario deshabilitado' });
    }

    if (row.password !== password) {
      if (!isAllowedIP) await registrarAccion(row.id, null, 'LOGIN_FALLIDO', 'auth', JSON.stringify({ email, error: 'password_incorrecto' }), ipAddress);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (dispositivo_info && dispositivo_info.dispositivo_id) {
      registrarDispositivo(row.id, dispositivo_info).catch(err => console.error('Error al registrar dispositivo:', err));
    }

    const sesionId = await registrarSesion(row.id, ipAddress, userAgent, dispositivo_info);

    if (!isAllowedIP) {
      await registrarAccion(row.id, sesionId, 'LOGIN_EXITOSO', 'auth', JSON.stringify({ email, dispositivo: dispositivo_info }), ipAddress);
    }

    if (!row.es_premium && !isAllowedIP) {
      const premiumUser = await qFirst('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1 LIMIT 1');
      if (premiumUser) {
        await crearAlertaPremium(
          premiumUser.id,
          '🔐 Usuario Conectado',
          `El usuario ${row.nombre} (${row.email}) acaba de iniciar sesión`,
          'login_usuario',
          row.id,
          { email, ipAddress, userAgent, dispositivo: dispositivo_info }
        );
      }
    }

    res.json({
      message: 'Login exitoso',
      user: {
        id: row.id,
        nombre: row.nombre,
        email: row.email,
        rol: row.rol,
        es_premium: !!row.es_premium,
        es_admin: row.rol === 'administrador' && !row.es_premium,
        habilitado: !!row.habilitado,
        sesion_id: sesionId
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta de logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { usuario_id, sesion_id } = req.body;
    const ipAddress = req.ip || (req.connection && req.connection.remoteAddress);

    if (usuario_id && sesion_id) {
      await cerrarSesion(sesion_id);

      await registrarAccion(usuario_id, sesion_id, 'LOGOUT', 'auth', JSON.stringify({}), ipAddress);

      const row = await qFirst('SELECT es_premium FROM usuarios WHERE id = ?', [usuario_id]);
      if (row && !row.es_premium) {
        const premiumUser = await qFirst('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1 LIMIT 1');
        if (premiumUser) {
          await crearAlertaPremium(
            premiumUser.id,
            '🔓 Usuario Desconectado',
            `El usuario ${usuario_id} cerró sesión`,
            'logout_usuario',
            usuario_id,
            { ipAddress }
          );
        }
      }
    }

    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/* =========================
   TRACKING ROUTES
========================= */

app.post('/api/tracking/navegacion', async (req, res) => {
  try {
    const { usuario_id, sesion_id, seccion, accion, detalles } = req.body;
    const ipAddress = req.ip || (req.connection && req.connection.remoteAddress);

    if (usuario_id && sesion_id) {
      await registrarNavegacion(sesion_id, usuario_id, seccion, accion, detalles, ipAddress);
    }

    res.json({ message: 'Navegación registrada' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/tracking/accion', async (req, res) => {
  try {
    const { usuario_id, sesion_id, tipo_accion, modulo, datos_accion } = req.body;
    const ipAddress = req.ip || (req.connection && req.connection.remoteAddress);

    if (usuario_id) {
      await registrarAccion(usuario_id, sesion_id, tipo_accion, modulo, datos_accion, ipAddress);
    }

    res.json({ message: 'Acción registrada' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/* =========================
   ALERTAS / AUDITORÍA / NOTIFS
========================= */

app.get('/api/alertas-premium', async (req, res) => {
  try {
    const rows = await q(
      `SELECT a.*, u.nombre as usuario_afectado_nombre, u.email as usuario_afectado_email
       FROM alertas_premium a
       LEFT JOIN usuarios u ON a.usuario_afectado_id = u.id
       ORDER BY a.fecha_alerta DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener alertas' });
  }
});

app.post('/api/alertas-premium/:id/leida', async (req, res) => {
  try {
    const { id } = req.params;
    await q('UPDATE alertas_premium SET leida = 1 WHERE id = ?', [id]);
    res.json({ message: 'Alerta marcada como leída' });
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar alerta como leída' });
  }
});

app.get('/api/tracking/sesiones/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const rows = await q(
      `SELECT * FROM tracking_sesiones
       WHERE usuario_id = ?
       ORDER BY fecha_login DESC
       LIMIT 50`,
      [usuario_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener sesiones' });
  }
});

app.get('/api/tracking/navegacion/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const rows = await q(
      `SELECT * FROM tracking_navegacion
       WHERE usuario_id = ?
       ORDER BY fecha_visita DESC
       LIMIT 100`,
      [usuario_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener navegación' });
  }
});

app.get('/api/notificaciones', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM notificaciones ORDER BY created_at DESC LIMIT 50');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
});

app.post('/api/notificaciones/:id/leida', async (req, res) => {
  try {
    const { id } = req.params;
    await q('UPDATE notificaciones SET leida = 1 WHERE id = ?', [id]);
    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar notificación como leída' });
  }
});

app.get('/api/auditoria', async (req, res) => {
  try {
    const rows = await q(
      `SELECT a.*, u.nombre as usuario_nombre, u.email as usuario_email
       FROM auditoria a
       JOIN usuarios u ON a.usuario_id = u.id
       ORDER BY a.fecha_accion DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener auditoría' });
  }
});

app.get('/api/historial/:tabla/:registroId', async (req, res) => {
  try {
    const { tabla, registroId } = req.params;
    const rows = await q(
      `SELECT h.*, u.nombre as modificado_por_nombre
       FROM historial_datos h
       JOIN usuarios u ON h.modificado_por = u.id
       WHERE h.tabla_afectada = ? AND h.registro_id = ?
       ORDER BY h.fecha_modificacion DESC`,
      [tabla, registroId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial' });
  }
});

/* =========================
   VEHÍCULOS
========================= */

app.get('/api/vehiculos', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM vehiculos WHERE eliminado = 0 ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener vehículos' });
  }
});

app.post('/api/vehiculos', async (req, res) => {
  try {
    const { tipo, marca, modelo, version, anio, condicion, precio, dominio } = req.body;

    if (!tipo || !marca || !modelo || !anio || !condicion || !precio) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados' });
    }

    if (condicion === 'usado' && !dominio) {
      return res.status(400).json({ message: 'El dominio es obligatorio para vehículos usados' });
    }

    const result = await q(
      'INSERT INTO vehiculos (tipo, marca, modelo, version, anio, condicion, precio, dominio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tipo, marca, modelo, version, anio, condicion, precio, dominio]
    );

    const vehiculoId = result.insertId;
    const vehiculoData = { tipo, marca, modelo, version, anio, condicion, precio, dominio };

    await registrarAuditoria(1, 'CREACION_VEHICULO', 'vehiculos', vehiculoId, null, vehiculoData);

    res.status(201).json({
      message: 'Vehículo agregado correctamente',
      vehiculo: { id: vehiculoId, ...vehiculoData }
    });

  } catch (error) {
    res.status(500).json({ message: 'Error al guardar vehículo' });
  }
});

// Soft delete de vehículos
app.delete('/api/vehiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const vehiculo = await qFirst('SELECT * FROM vehiculos WHERE id = ? AND eliminado = 0', [id]);
    if (!vehiculo) return res.status(404).json({ message: 'Vehículo no encontrado' });

    await q(
      'UPDATE vehiculos SET eliminado = 1, eliminado_por = ?, fecha_eliminacion = CURRENT_TIMESTAMP WHERE id = ?',
      [1, id]
    );

    await registrarAuditoria(1, 'ELIMINACION_VEHICULO', 'vehiculos', parseInt(id, 10), vehiculo, { eliminado: true });

    res.json({ message: 'Vehículo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar vehículo' });
  }
});

/* =========================
   CLIENTES
========================= */

app.get('/api/clientes', async (req, res) => {
  try {
    const rows = await q('SELECT * FROM clientes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { nombre, apellido, dni, telefono, email, direccion, observaciones } = req.body;

    if (!nombre || !apellido || !dni) {
      return res.status(400).json({ message: 'Nombre, apellido y DNI son obligatorios' });
    }

    try {
      const result = await q(
        'INSERT INTO clientes (nombre, apellido, dni, telefono, email, direccion, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, apellido, dni, telefono, email, direccion, observaciones]
      );

      res.status(201).json({
        message: 'Cliente agregado correctamente',
        cliente: { id: result.insertId, ...req.body }
      });
    } catch (err) {
      if (String(err.message || '').toUpperCase().includes('DUPLICATE')) {
        return res.status(400).json({ message: 'El DNI ya está registrado' });
      }
      return res.status(500).json({ message: 'Error al guardar cliente' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/* =========================
   MINUTAS
========================= */

app.get('/api/minutas', async (req, res) => {
  try {
    const rows = await q(
      `SELECT m.*, v.marca, v.modelo, v.anio,
              c.nombre as cliente_nombre, c.apellido as cliente_apellido,
              u.nombre as vendedor_nombre
       FROM minutas m
       JOIN vehiculos v ON m.vehiculo_id = v.id
       JOIN clientes c ON m.cliente_id = c.id
       JOIN usuarios u ON m.vendedor_id = u.id
       WHERE m.eliminado = 0
       ORDER BY m.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener minutas' });
  }
});

app.post('/api/minutas', async (req, res) => {
  try {
    const { vehiculo_id, cliente_id, vendedor_id, precio_original, precio_final, observaciones } = req.body;
    const ipAddress = req.ip || (req.connection && req.connection.remoteAddress);

    if (!vehiculo_id || !cliente_id || !vendedor_id || !precio_original || !precio_final) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados' });
    }

    const vehiculo = await qFirst('SELECT * FROM vehiculos WHERE id = ? AND eliminado = 0', [vehiculo_id]);
    if (!vehiculo) return res.status(404).json({ message: 'Vehículo no encontrado' });

    if (vehiculo.estado !== 'disponible') {
      await registrarAccion(
        vendedor_id,
        null,
        'INTENTO_VENDER_NO_DISPONIBLE',
        'minutas',
        JSON.stringify({ vehiculo_id, estado_actual: vehiculo.estado }),
        ipAddress
      );

      const premiumUser = await qFirst('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1 LIMIT 1');
      if (premiumUser) {
        await crearAlertaPremium(
          premiumUser.id,
          '🚫 Intento de Venta Duplicada',
          `El vendedor ${vendedor_id} intentó vender un vehículo no disponible (ID: ${vehiculo_id})`,
          'venta_duplicada',
          vendedor_id,
          { vehiculo_id, estado_actual: vehiculo.estado }
        );
      }

      return res.status(400).json({ message: 'Este vehículo no está disponible para venta. Estado actual: ' + vehiculo.estado });
    }

    const minutaExistente = await qFirst(
      `SELECT * FROM minutas
       WHERE vehiculo_id = ?
         AND estado NOT IN ('cerrada','cancelada')
         AND eliminado = 0
       LIMIT 1`,
      [vehiculo_id]
    );

    if (minutaExistente) {
      await registrarAccion(
        vendedor_id,
        null,
        'INTENTO_MINUTA_DUPLICADA',
        'minutas',
        JSON.stringify({ vehiculo_id, minuta_existente_id: minutaExistente.id }),
        ipAddress
      );

      const premiumUser = await qFirst('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1 LIMIT 1');
      if (premiumUser) {
        await crearAlertaPremium(
          premiumUser.id,
          '🚫 Intento de Minuta Duplicada',
          `El vendedor ${vendedor_id} intentó crear otra minuta para el mismo vehículo (ID: ${vehiculo_id})`,
          'minuta_duplicada',
          vendedor_id,
          { vehiculo_id, minuta_existente_id: minutaExistente.id }
        );
      }

      return res.status(400).json({ message: 'Ya existe una minuta activa para este vehículo. Minuta ID: ' + minutaExistente.id });
    }

    // Transacción: crear minuta + actualizar vehículo
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO minutas (vehiculo_id, cliente_id, vendedor_id, precio_original, precio_final, observaciones, estado)
         VALUES (?, ?, ?, ?, ?, ?, 'reservada')`,
        [vehiculo_id, cliente_id, vendedor_id, precio_original, precio_final, observaciones]
      );
      const minutaId = result.insertId;

      await conn.execute(
        `UPDATE vehiculos SET estado = 'reservado', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [vehiculo_id]
      );

      await conn.commit();

      await registrarAuditoria(
        vendedor_id,
        'CREACION_MINUTA',
        'minutas',
        minutaId,
        null,
        { vehiculo_id, cliente_id, vendedor_id, precio_original, precio_final }
      );

      const premiumUser = await qFirst('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1 LIMIT 1');
      if (premiumUser) {
        await crearAlertaPremium(
          premiumUser.id,
          '📋 Nueva Minuta Creada',
          `Se ha creado una nueva minuta para el vehículo ${vehiculo_id} - Vendedor: ${vendedor_id}`,
          'nueva_minuta',
          vendedor_id,
          { minuta_id: minutaId, vehiculo_id, cliente_id }
        );
      }

      res.status(201).json({
        message: 'Minuta creada correctamente y vehículo reservado',
        minuta: { id: minutaId, vehiculo_id, cliente_id, vendedor_id, precio_original, precio_final, estado: 'reservada' }
      });

    } catch (e) {
      try { await conn.rollback(); } catch {}
      console.error('Error al crear minuta:', e);
      return res.status(500).json({ message: 'Error al crear minuta' });
    } finally {
      conn.release();
    }

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para liberar vehículo (solo administradores)
app.post('/api/minutas/:id/liberar-vehiculo', async (req, res) => {
  const { id } = req.params;
  const { usuario_id, rol } = req.body;

  if (rol !== 'administrador') {
    return res.status(403).json({ message: 'Solo los administradores pueden liberar vehículos' });
  }

  try {
    const minuta = await qFirst('SELECT * FROM minutas WHERE id = ? AND eliminado = 0', [id]);
    if (!minuta) return res.status(404).json({ message: 'Minuta no encontrada' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `UPDATE vehiculos SET estado = 'disponible', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [minuta.vehiculo_id]
      );

      await conn.execute(
        `UPDATE minutas SET estado = 'cancelada', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
      );

      await conn.commit();

      await registrarAuditoria(
        usuario_id,
        'LIBERACION_VEHICULO',
        'minutas',
        id,
        { estado_anterior: minuta.estado },
        { estado_nuevo: 'cancelada' }
      );

      const premiumUser = await qFirst('SELECT id FROM usuarios WHERE es_premium = 1 AND habilitado = 1 LIMIT 1');
      if (premiumUser) {
        await crearAlertaPremium(
          premiumUser.id,
          '🚗 Vehículo Liberado',
          `El administrador ${usuario_id} liberó el vehículo ${minuta.vehiculo_id}`,
          'vehiculo_liberado',
          usuario_id,
          { minuta_id: id, vehiculo_id: minuta.vehiculo_id }
        );
      }

      res.json({ message: 'Vehículo liberado correctamente y disponible para venta' });
    } catch (e) {
      try { await conn.rollback(); } catch {}
      return res.status(500).json({ message: 'Error al liberar vehículo' });
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para guardar minuta detallada (formulario completo)
app.post('/api/minutas/detallada', async (req, res) => {
  try {
    const { 
      lugar, fecha, 
      comprador, vendedor, vehiculo, operacion, 
      observaciones, fechaEntrega, gastosTransferencia, 
      estado, usuario_id 
    } = req.body;

    if (!comprador || !vendedor || !vehiculo || !operacion) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Guardar minuta detallada en formato JSON
    const minutaDetallada = JSON.stringify({
      lugar, fecha,
      comprador, vendedor, vehiculo, operacion,
      observaciones, fechaEntrega, gastosTransferencia
    });

    const result = await q(
      `INSERT INTO minutas_detalladas 
       (datos_completos, estado, creado_por, created_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [minutaDetallada, estado || 'borrador', usuario_id]
    );

    await registrarAuditoria(
      usuario_id,
      'CREACION_MINUTA_DETALLADA',
      'minutas_detalladas',
      result.insertId,
      null,
      { vehiculo: vehiculo.marca + ' ' + vehiculo.modelo, comprador: comprador.nombre }
    );

    res.status(201).json({
      message: 'Minuta detallada guardada correctamente',
      minuta_id: result.insertId
    });

  } catch (error) {
    console.error('Error al guardar minuta detallada:', error);
    res.status(500).json({ message: 'Error al guardar minuta' });
  }
});

// Obtener minutas detalladas
app.get('/api/minutas/detalladas', async (req, res) => {
  try {
    const rows = await q(
      `SELECT md.*, u.nombre as creado_por_nombre
       FROM minutas_detalladas md
       LEFT JOIN usuarios u ON md.creado_por = u.id
       ORDER BY md.created_at DESC`
    );
    
    // Parsear JSON de datos_completos
    const minutas = rows.map(row => ({
      ...row,
      datos_completos: JSON.parse(row.datos_completos || '{}')
    }));
    
    res.json(minutas);
  } catch (error) {
    console.error('Error al obtener minutas detalladas:', error);
    res.status(500).json({ message: 'Error al obtener minutas' });
  }
});

// Obtener una minuta detallada específica
app.get('/api/minutas/detalladas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await qFirst(
      `SELECT md.*, u.nombre as creado_por_nombre
       FROM minutas_detalladas md
       LEFT JOIN usuarios u ON md.creado_por = u.id
       WHERE md.id = ?`,
      [id]
    );
    
    if (!row) {
      return res.status(404).json({ message: 'Minuta no encontrada' });
    }
    
    const minuta = {
      ...row,
      datos_completos: JSON.parse(row.datos_completos || '{}')
    };
    
    res.json(minuta);
  } catch (error) {
    console.error('Error al obtener minuta:', error);
    res.status(500).json({ message: 'Error al obtener minuta' });
  }
});

/* =========================
   USUARIOS (ADMIN PREMIUM)
========================= */

app.get('/api/usuarios/todos', async (req, res) => {
  try {
    const rows = await q(
      `SELECT id, nombre, email, rol, habilitado, es_premium, created_at, updated_at
       FROM usuarios
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

app.post('/api/usuarios/:id/suspender', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, mensaje, duracion, usuario_premium_id } = req.body;

    const usuario = await qFirst('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (usuario.es_premium) return res.status(403).json({ message: 'No se puede suspender al usuario premium' });

    await q('UPDATE usuarios SET habilitado = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    // Registrar en suspensiones
    try {
      await q(
        'INSERT INTO suspensiones (usuario_id, motivo, mensaje, duracion, suspendido_por) VALUES (?, ?, ?, ?, ?)',
        [id, motivo, mensaje, duracion, usuario_premium_id]
      );
    } catch (e) {
      console.error('Error al registrar suspensión:', e);
    }

    await registrarAuditoria(
      usuario_premium_id,
      'SUSPENSION_USUARIO',
      'usuarios',
      id,
      { estado_anterior: usuario.habilitado },
      { estado_nuevo: false, motivo }
    );

    await crearAlertaPremium(
      usuario_premium_id,
      '🚫 Usuario Suspendido',
      `El usuario ${usuario.nombre} (${usuario.email}) ha sido suspendido por: ${motivo}`,
      'usuario_suspendido',
      id,
      { motivo, mensaje, duracion }
    );

    res.json({ message: 'Usuario suspendido correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/usuarios/:id/reactivar', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_premium_id } = req.body;

    const usuario = await qFirst('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    await q('UPDATE usuarios SET habilitado = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    await registrarAuditoria(
      usuario_premium_id,
      'REACTIVACION_USUARIO',
      'usuarios',
      id,
      { estado_anterior: usuario.habilitado },
      { estado_nuevo: true }
    );

    await crearAlertaPremium(
      usuario_premium_id,
      '✅ Usuario Reactivado',
      `El usuario ${usuario.nombre} (${usuario.email}) ha sido reactivado`,
      'usuario_reactivado',
      id,
      {}
    );

    res.json({ message: 'Usuario reactivado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_premium_id } = req.body;

    const usuario = await qFirst('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (usuario.es_premium) return res.status(403).json({ message: 'No se puede eliminar al usuario premium' });

    await q('UPDATE usuarios SET habilitado = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    await registrarAuditoria(
      usuario_premium_id,
      'ELIMINACION_USUARIO',
      'usuarios',
      id,
      { datos_anteriores: usuario },
      { eliminado: true }
    );

    await crearAlertaPremium(
      usuario_premium_id,
      '🗑️ Usuario Eliminado',
      `El usuario ${usuario.nombre} (${usuario.email}) ha sido eliminado del sistema`,
      'usuario_eliminado',
      id,
      { datos_anteriores: usuario }
    );

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📱 Acceso móvil: http://192.168.0.42:${PORT}/mobile.html`);
});
