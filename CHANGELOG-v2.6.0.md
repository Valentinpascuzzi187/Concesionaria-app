# Changelog v2.6.0 - Sistema de Estados, Seguimiento y Galería

## 🚀 Nuevas Características

### 1. Sistema de Estados de Vehículos Mejorado

#### Estados Disponibles:
- **disponible**: Vehículo listo para venta
- **proceso_venta**: Vehículo en negociación/minuta activa
- **pos_venta**: Vehículo vendido en espera de pago/finalización
- **vendido**: Vehículo completamente vendido
- **estancado**: Vehículo con problema o sin movimiento

#### Campos Agregados a `vehiculos`:
```sql
ALTER TABLE vehiculos ADD COLUMN estado_detallado ENUM(...);
ALTER TABLE vehiculos ADD COLUMN minuta_id INT NULL;
ALTER TABLE vehiculos ADD COLUMN progreso_tramite INT DEFAULT 0;
ALTER TABLE vehiculos ADD COLUMN dias_sin_movimiento INT DEFAULT 0;
ALTER TABLE vehiculos ADD COLUMN ultimo_movimiento DATETIME NULL;
```

### 2. Sistema de Seguimiento de Trámites

#### Nueva Tabla: `seguimiento_tramites`
```sql
CREATE TABLE seguimiento_tramites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehiculo_id INT NOT NULL,
  minuta_id INT NULL,
  estado ENUM('en_progreso','estancado','finalizado') DEFAULT 'en_progreso',
  porcentaje_avance INT DEFAULT 0,
  notas TEXT NULL,
  usuario_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

#### Funcionalidades:
- Rastreo de 3 estados principales: En Progreso, Estancado, Finalizado
- Porcentaje de avance (0-100%)
- Notas y comentarios
- Auditoría de cambios con usuario y fecha

### 3. Galería de Fotos de Vehículos

#### Nueva Tabla: `fotografia_vehiculo`
```sql
CREATE TABLE fotografia_vehiculo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehiculo_id INT NOT NULL,
  url_imagen VARCHAR(500) NOT NULL,
  tipo ENUM('exterior','interior','detalles','documentos') DEFAULT 'exterior',
  nombre VARCHAR(255) NULL,
  ordenamiento INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### Tipos de Fotos:
- **exterior**: Fotos del exterior del vehículo
- **interior**: Fotos del interior
- **detalles**: Detalles específicos del vehículo
- **documentos**: Documentación (factura, registro, etc.)

#### Funcionalidades:
- Upload de múltiples fotos por vehículo
- Organización por tipo
- Reordenamiento de fotos
- Vista previa en galería
- Modal para ver fotos a tamaño completo

## 🔌 Nuevos Endpoints API

### Seguimiento de Trámites
```
GET    /api/vehiculos/:id/seguimiento      → Obtener seguimientos
POST   /api/vehiculos/:id/seguimiento      → Crear/actualizar seguimiento
```

### Galería de Fotos
```
GET    /api/vehiculos/:id/fotos           → Obtener fotos
POST   /api/vehiculos/:id/fotos           → Agregar foto
DELETE /api/fotos/:id                     → Eliminar foto
PUT    /api/fotos/:id/reordenar           → Reordenar foto
```

## 🎨 Mejoras de UI/UX

### Estilos CSS Agregados:
- `.estado-disponible`: Badge verde (disponible)
- `.estado-proceso_venta`: Badge azul (en proceso)
- `.estado-pos_venta`: Badge naranja (pos venta)
- `.estado-estancado`: Badge rojo (estancado)
- `.seguimiento-en_progreso`: Badge azul para seguimiento
- `.seguimiento-estancado`: Badge rojo para estancado
- `.seguimiento-finalizado`: Badge verde para finalizado
- `.foto-gallery`: Grid responsive de fotos
- `.foto-thumbnail`: Imagen con hover effect
- `.foto-upload`: Area de drag & drop para fotos

### Componentes Nuevos:
1. **Modal de Galería**
   - Vista de miniaturas
   - Upload de fotos por drag & drop
   - Selector de tipo de foto
   - Eliminación individual

2. **Modal de Seguimiento**
   - Selector de estado
   - Slider de porcentaje (0-100%)
   - Area de notas
   - Historial de cambios

3. **Visualización de Tarjetas**
   - Badge de estado con color
   - Preview de primeras 4 fotos
   - Badge de seguimiento en tiempo real
   - Botones contextuales (📷 Galería, 📈 Seguimiento)

## 🔄 Cambios en la Base de Datos

### Tablas Creadas:
- `seguimiento_tramites` - Rastreo de progreso de venta
- `fotografia_vehiculo` - Galería de imágenes

### Columnas Agregadas a `vehiculos`:
- `estado_detallado` - Estado de venta detallado
- `minuta_id` - Referencia a minuta activa
- `progreso_tramite` - Porcentaje de avance
- `dias_sin_movimiento` - Contador de inactividad
- `ultimo_movimiento` - Timestamp del último cambio

### Columnas Agregadas a `minutas`:
- `pagado` - Flag de confirmación de pago
- `fecha_finalizacion` - Fecha de cierre
- `firma_comprador` - Datos de firma (LONGBLOB)
- `firma_vendedor` - Datos de firma (LONGBLOB)
- `aprobada_admin` - Aprobación de administrador

## 📱 Frontend - Nuevas Funciones en app.js

```javascript
// Galería
verGaleria(vehiculoId)                // Abrir modal de galería
subirFoto(vehiculoId, event)          // Cargar foto desde archivo
eliminarFotoGaleria(fotoId)           // Eliminar foto
verFotoGrande(url)                    // Ver foto a tamaño completo

// Seguimiento
verSeguimiento(vehiculoId)            // Abrir modal de seguimiento
guardarSeguimiento(vehiculoId)        // Guardar cambios de seguimiento

// API Methods (agregados a window.api)
getSeguimientoVehiculo(id)            // GET seguimientos
getFotosVehiculo(id)                  // GET fotos
agregarFoto(id, datos)                // POST foto
crearSeguimiento(id, datos)           // POST seguimiento
eliminarFoto(id)                      // DELETE foto
reordenarFoto(id, orden)              // PUT foto
```

## 🔐 Permisos y Control

- Solo usuarios premium pueden:
  - Agregar/eliminar vehículos
  - Editar vehículos
  - Ver botones de galería y seguimiento

- Todos los usuarios pueden:
  - Ver estado de vehículos
  - Ver fotos (lectura)
  - Ver seguimiento (lectura)

## 📊 Ejemplo de Flujo

1. **Creación de Vehículo**
   - Estado inicial: `disponible`
   - Sin seguimiento
   - Sin fotos

2. **Agregar a Stock**
   - Subir fotos (exterior, interior, detalles, documentos)
   - Estado sigue siendo `disponible`

3. **Crear Minuta**
   - Estado cambia a `proceso_venta`
   - Se crea seguimiento automático (en_progreso)
   - Vendedor actualiza porcentaje según progreso

4. **Venta Cerrada**
   - Estado cambia a `pos_venta`
   - Seguimiento en espera de pago (puede estar estancado)
   - Se confirma pago → estado `vendido`

5. **Historial Disponible**
   - Todas las fotos se conservan
   - Historial de seguimiento completo
   - Auditoría de cambios

## 🐛 Fixes Incluidos

- Mejor manejo de transacciones en creación de minutas
- Mejora de rendimiento en carga de vehículos
- Sincronización de estado entre frontend y backend
- Validación de datos en endpoints de galería y seguimiento

## 📝 Nota para Desarrolladores

- Las funciones de galería usan `FileReader` y `DataURL` para demo
- En producción, considerar usar servicio de almacenamiento (AWS S3, Firebase Storage)
- El reordenamiento de fotos usa campo `ordenamiento` en DB
- Los seguimientos mantienen historial completo (no son overwrite)

## 🚀 Siguientes Pasos Recomendados

1. Implementar hojas de cálculo de pagos/cuotas
2. Agregar calendario de vencimientos de cuotas
3. Sistema de notificaciones de vencimientos
4. Reporte de vehículos estancados
5. Dashboard de KPIs de ventas
6. Integración con servicio de almacenamiento para fotos

---

**Versión:** v2.6.0  
**Fecha:** 16 de Enero 2026  
**Cambios:** 6 archivos modificados, 979 líneas agregadas
