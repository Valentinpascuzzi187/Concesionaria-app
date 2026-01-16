# 📋 ESPECIFICACIÓN COMPLETA DE CAMBIOS - SITIO WEB DE GRAZIA AUTOMOTORES v2.9.0

## DOCUMENTO PARA REPLICAR EN v3.0

**Propósito**: Este documento lista TODOS los cambios visuales, de diseño, tipografía, colores, formularios, animaciones y componentes que se implementaron en el sitio web actual. Usar este documento como referencia para aplicar EXACTAMENTE lo mismo en la app De Grazia Automotores v3.0.

---

## 1. PALETA DE COLORES CORPORATIVA

### CSS Variables (`:root`)
```css
--color-primary: #4a90e2      /* Azul corporativo - Principal */
--color-secondary: #d4af37    /* Oro - Detalles premium */
--color-base: #1a1a1a         /* Negro - Fondo base */
--color-light: #f5f5f5        /* Gris claro - Fondos claros */
--color-dark: #2d2d2d         /* Gris oscuro - Textos oscuros */
--color-success: #2ecc71      /* Verde - Estados positivos */
--color-danger: #e74c3c       /* Rojo - Errores/Alertas */
--color-warning: #f39c12      /* Naranja - Advertencias */
```

### Aplicación de Colores
- **Fondo principal**: Linear gradient 135deg: #1a1a1a → #2d2d2d
- **Navbar**: Fondo blanco con borde top 3px en oro (#d4af37)
- **Botones principales**: Azul #4a90e2 con hover más oscuro (#5a67d8)
- **Bordes**: Azul #4a90e2 (2px) o gris #ddd (inputs)
- **Títulos**: Azul #4a90e2 o negro #333
- **Texto body**: #333 (oscuro) sobre fondo blaro
- **Acentos**: Oro #d4af37 en detalles

---

## 2. TIPOGRAFÍA

### Font Stack
```css
font-family: 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', sans-serif;
```

### Pesos y Tamaños

| Elemento | Peso | Tamaño | Letter-spacing | Detalles |
|----------|------|--------|-----------------|----------|
| Navbar h1 | 700 bold | 1.5rem / 1rem (móvil) | 1px | Color azul #4a90e2 |
| Card h2 | 600 | 1.8rem | 0px | Borde bottom azul 2px |
| Labels | 500 | 1rem | 0px | Color #555 |
| Botones | 600 | 1rem | 0.5px | UPPERCASE, color blanco |
| Nav buttons | 600 | 0.9rem / 0.8rem | 0.5px | UPPERCASE |
| Body text | 400 | 1rem | 0px | Color #333 |
| Stat cards | 700 | varía | 0px | Color blanco |

---

## 3. COMPONENTES Y ESTILOS

### 3.1 NAVBAR
**Ubicación**: Arriba de la página  
**Estructura**:
- Contenedor blanco con box-shadow 0 4px 6px rgba(0,0,0,0.1)
- Border-top 3px solid #d4af37 (oro)
- Padding: 1rem (desktop) → 0.8rem (tablet) → 0.6rem (móvil)
- Border-radius: 10px
- Display: flex, flex-direction: column, align-items: center, gap: 1rem

**Logo**:
- Tamaño: 60px × 60px (desktop) → 50px (tablet) → 45px (móvil)
- Border-radius: 50% (círculo)
- Box-shadow: 0 2px 8px rgba(0,0,0,0.15)
- Border: 2px solid #d4af37 (oro)
- Object-fit: cover

**Título (h1)**:
- Color: #4a90e2 (azul)
- Font-size: 1.5rem (desktop) → 1.2rem (tablet) → 1rem (móvil)
- Font-weight: 700
- Letter-spacing: 1px
- Text-align: center
- Margin: 0

**Botones de navegación**:
- Padding: 0.6rem 1rem (desktop) → 0.5rem 0.8rem (tablet) → 0.4rem 0.6rem (móvil)
- Border: 2px solid #4a90e2 (azul)
- Background: white (default) → #4a90e2 (hover/active)
- Color: #4a90e2 (default) → white (hover/active)
- Border-radius: 8px
- Font-weight: 600
- Font-size: 0.9rem (desktop) → 0.8rem (tablet) → 0.75rem (móvil)
- Text-transform: uppercase
- Letter-spacing: 0.5px
- Transition: all 0.3s ease
- **Hover**: Background azul, color blanco, box-shadow 0 4px 12px rgba(74,144,226,0.3), transform translateY(-2px)
- **Active**: Igual que hover

---

### 3.2 CARDS
**Contenedor**:
- Background: white
- Padding: 2rem
- Border-radius: 10px
- Box-shadow: 0 4px 6px rgba(0,0,0,0.1)
- Margin-bottom: 2rem

**Títulos (h2)**:
- Color: #333 (gris oscuro)
- Font-size: 1.8rem
- Margin-bottom: 1.5rem
- Padding-bottom: 0.5rem
- Border-bottom: 2px solid #4a90e2 (azul)

---

### 3.3 FORMULARIOS
**Contenedor de grupos**:
- Margin-bottom: 1rem

**Form-row** (para 2 columnas):
- Display: grid
- Grid-template-columns: 1fr 1fr
- Gap: 1rem
- **En móvil (<768px)**: Grid-template-columns: 1fr (una columna)

**Labels**:
- Display: block
- Margin-bottom: 0.5rem
- Color: #555 (gris)
- Font-weight: 500

**Inputs, Select, Textarea**:
- Width: 100%
- Padding: 0.8rem
- Border: 2px solid #ddd (gris claro)
- Border-radius: 5px
- Font-size: 1rem
- Transition: border-color 0.3s ease
- **Focus**: Outline none, border-color #4a90e2 (azul)

**Textarea**:
- Resize: vertical
- Min-height: 100px

---

### 3.4 BOTONES
**Estilos generales**:
- Padding: 0.8rem 1.5rem
- Border: none
- Border-radius: 5px
- Cursor: pointer
- Font-size: 1rem
- Font-weight: 500
- Transition: all 0.3s ease
- Margin-right: 0.5rem

**`.btn-primary`** (Botón primario azul):
- Background: #4a90e2 (azul)
- Color: white
- **Hover**: Background #5a67d8, transform translateY(-2px)

**`.btn-secondary`** (Botón secundario gris):
- Background: #6c757d
- Color: white
- **Hover**: Background #5a6268

---

### 3.5 MENSAJES
**Contenedor**:
- Padding: 1rem
- Border-radius: 5px
- Margin-top: 1rem
- Font-weight: 500

**`.message.success`** (Exitoso):
- Background: #d4edda (verde claro)
- Color: #155724 (verde oscuro)
- Border: 1px solid #c3e6cb

**`.message.error`** (Error):
- Background: #f8d7da (rojo claro)
- Color: #721c24 (rojo oscuro)
- Border: 1px solid #f5c6cb

---

### 3.6 DASHBOARD GRID
**Contenedor**:
- Display: grid
- Grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))
- Gap: 1.5rem
- Margin-top: 2rem

**Stat Cards**:
- Background: Linear gradient 135deg: #4a90e2 → #2d2d2d
- Color: white
- Padding: 2rem
- Border-radius: 10px
- Text-align: center
- Box-shadow: 0 4px 6px rgba(0,0,0,0.1)
- Transition: transform 0.3s ease
- **Hover**: Transform scale(1.05) o translateY(-5px)

---

### 3.7 TABLAS
**Estilos generales**:
- Width: 100%
- Border-collapse: collapse
- Border-spacing: 0

**Encabezados (thead th)**:
- Background: #f8f9fa (gris muy claro)
- Color: #333
- Padding: 1rem
- Font-weight: 600
- Border-bottom: 2px solid #4a90e2

**Celdas (td)**:
- Padding: 0.8rem 1rem
- Border-bottom: 1px solid #eee
- Color: #333

**Filas hover**:
- Background: #f5f5f5 (gris claro)

---

## 4. ANIMACIONES Y TRANSICIONES

### Keyframes
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Aplicación**: Secciones al cambiar (0.3s ease-in)

### Transiciones Globales
- Botones: all 0.3s ease (color, background, shadow, transform)
- Inputs: border-color 0.3s ease (al focus)
- Nav buttons: all 0.3s ease (hover, active)
- Cards: transform 0.3s ease (hover)

### Effects Específicos
- **Botones hover**: 
  - Transform: translateY(-2px)
  - Box-shadow: 0 4px 12px rgba(74,144,226,0.3)
  - Transición smooth 0.3s

- **Cards hover**:
  - Transform: scale(1.05) o translateY(-5px)
  - Transición smooth 0.3s

---

## 5. RESPONSIVE DESIGN

### Breakpoints

#### Desktop (>1200px)
- Max-width container: 1200px
- Navbar padding: 1rem
- Logo: 60px × 60px
- H1: 1.5rem
- Form-row: 2 columnas
- Nav buttons: 0.6rem 1rem

#### Tablet (768px - 1200px)
```css
@media (max-width: 768px) {
  .navbar { padding: 0.8rem; }
  .navbar-brand .brand-logo { width: 50px; height: 50px; }
  .navbar-brand h1 { font-size: 1.2rem; }
  .nav-btn { padding: 0.5rem 0.8rem; font-size: 0.8rem; }
  .form-row { grid-template-columns: 1fr; }
}
```

#### Mobile (<480px)
```css
@media (max-width: 480px) {
  body { padding: 10px; }
  .navbar { padding: 0.6rem; gap: 0.8rem; }
  .navbar-brand .brand-logo { width: 45px; height: 45px; }
  .navbar-brand h1 { font-size: 1rem; }
  .navbar-menu { gap: 0.3rem; }
  .nav-btn { padding: 0.4rem 0.6rem; font-size: 0.75rem; border-width: 1px; }
}
```

---

## 6. ESTRUCTURA HTML GENERAL

### Layout Principal
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Concesionaria - Sistema de Gestión</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <!-- NAVBAR -->
    <nav class="navbar">
      <div class="navbar-brand">
        <img class="brand-logo" src="/assets/logo.png">
        <h1>De Grazia - Automotores</h1>
      </div>
      <div class="navbar-menu">
        <!-- BOTONES NAV: Login, Register, Dashboard, Stock, etc. -->
      </div>
    </nav>

    <!-- SECCIONES -->
    <section id="login" class="section active">
      <!-- FORMULARIO LOGIN -->
    </section>

    <section id="dashboard" class="section">
      <!-- DASHBOARD GRID CON STAT-CARDS -->
    </section>

    <!-- MÁS SECCIONES: Stock, Clientes, Minutas, Pagos, Reportes -->
  </div>
</body>
</html>
```

---

## 7. COMPONENTES ESPECIALES

### 7.1 CARRUSEL DE IMÁGENES
**Requisitos**:
- Auto-rotación cada 3-5 segundos
- Botones prev/next (opcional)
- Indicadores de página (dots)
- Transición suave fade o slide

### 7.2 SELECTOR DE ESTADOS
**Estados de vehículos**:
- "Disponible" - Color verde
- "Vendido" - Color gris
- "Proceso" - Color naranja
- "Reservado" - Color azul

**Badges**:
- Background: Color del estado
- Color: white
- Padding: 0.4rem 0.8rem
- Border-radius: 20px
- Font-size: 0.8rem
- Font-weight: 600

### 7.3 MODAL/DIÁLOGOS
**Overlay**:
- Position: fixed
- Top/Left/Right/Bottom: 0
- Background: rgba(0,0,0,0.5)
- Z-index: 1000

**Contenedor modal**:
- Background: white
- Border-radius: 10px
- Padding: 2rem
- Max-width: 500px
- Margin: 10% auto

---

## 8. ESPACIADO (PADDING Y MARGIN)

### Estándares
- **Muy pequeño**: 0.5rem
- **Pequeño**: 1rem
- **Medio**: 1.5rem
- **Grande**: 2rem
- **Extra grande**: 3rem

### Aplicación
- Body padding: 20px (desktop) → 10px (móvil)
- Container max-width: 1200px
- Card padding: 2rem
- Gap en grids: 1.5rem (dashboard) → 1rem (formularios)

---

## 9. SOMBRAS Y EFECTOS DE PROFUNDIDAD

### Box Shadows Estándar
- **Sutil**: `0 2px 8px rgba(0,0,0,0.1)`
- **Medio**: `0 4px 6px rgba(0,0,0,0.1)`
- **Fuerte**: `0 4px 12px rgba(74,144,226,0.3)`

### Aplicación
- Navbar: 0 4px 6px rgba(0,0,0,0.1)
- Cards: 0 4px 6px rgba(0,0,0,0.1)
- Buttons hover: 0 4px 12px rgba(74,144,226,0.3)
- Logo: 0 2px 8px rgba(0,0,0,0.15)

---

## 10. INTERACTIVIDAD

### Estados de Botones
- **Default**: White bg, azul border/text
- **Hover**: Azul bg, white text, shadow, transform -2px
- **Active**: Azul bg, white text, shadow
- **Disabled**: Gris claro, cursor not-allowed, opacity 0.5

### Estados de Inputs
- **Default**: White bg, gris border #ddd
- **Focus**: White bg, azul border #4a90e2, box-shadow inset
- **Error**: White bg, rojo border, red text

### Estados de Links
- **Default**: Azul #4a90e2, underline
- **Hover**: Más oscuro, underline
- **Visited**: Púrpura (opcional)

---

## 11. FUNCIONALIDADES JAVASCRIPT

### Cambio de Secciones
- Función `showSection(id)` alterna visibilidad
- Agrega clase `.active` a sección visible
- Remueve de otras secciones
- Trigger animación fadeIn

### Validación de Formularios
- Email: validación regex
- Campos required: validación antes de submit
- Mensajes de error/éxito inline

### Notificaciones
- Clase `.message.success` o `.message.error`
- Aparecen debajo del formulario
- Auto-desaparecen después de 5 segundos (opcional)

---

## 12. ARCHIVOS Y ASSETS

### Ubicación de Archivos
```
/public/
├── index.html          (Estructura principal)
├── style.css           (Todos los estilos)
├── app.js              (Lógica JavaScript)
└── /assets/
    ├── logo.png
    └── logo.svg
```

### Requisitos de Imágenes
- Logo: 60×60px mínimo (escalable a 192×192 para PWA)
- Vehículos: 800×600px mínimo
- Iconos: 32×32px SVG

---

## RESUMEN DE CAMBIOS CLAVES

1. **Colores**: Paleta corporativa con variables CSS (azul #4a90e2, oro #d4af37, negro #1a1a1a)
2. **Tipografía**: Trebuchet MS con pesos 400-700 y letter-spacing
3. **Navbar**: Blanco con borde dorado superior, logo con círculo y border oro
4. **Formularios**: Inputs con border azul al focus, labels en gris oscuro
5. **Botones**: Azul primario con hover transform, bordes en defaul
6. **Cards**: Título con borde azul inferior, sombra sutil
7. **Dashboard**: Grid responsive con stat-cards gradiente azul
8. **Animaciones**: fadeIn 0.3s, transiciones smooth en hover
9. **Responsive**: Breakpoints 768px y 480px con ajustes proporcionales
10. **Mensajes**: Success (verde) y Error (rojo) con estilos diferenciados

---

**Nota Final**: Este documento es la especificación COMPLETA. Usa este contenido exacto como prompt para replicar el diseño en la app v3.0.
