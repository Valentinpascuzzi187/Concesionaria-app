# PROMPT PARA v3.0 - "De Grazia Automotores v3.0"

**Copia y pega este texto completo como tu próximo mensaje para implementar EXACTAMENTE los cambios del sitio web en la app**

---

## INSTRUCCIONES: Implementar diseño web en app De Grazia v3.0

Quiero que repliques EXACTAMENTE todos los cambios del sitio web de De Grazia Automotores actual en una app Android llamada "De Grazia Automotores v3.0". TODOS los cambios, colores, tipografía, formularios, espaciados, animaciones, todo.

### PALETA DE COLORES CORPORATIVA

Usa estas variables CSS en :root:
- `--color-primary: #4a90e2` (Azul - Botones, títulos, bordes)
- `--color-secondary: #d4af37` (Oro - Detalles, navbar border)
- `--color-base: #1a1a1a` (Negro - Fondo principal)
- `--color-dark: #2d2d2d` (Gris oscuro - Textos, fondos)
- `--color-light: #f5f5f5` (Gris claro - Fondos alternos)
- `--color-success: #2ecc71` (Verde - OK)
- `--color-danger: #e74c3c` (Rojo - Errores)
- `--color-warning: #f39c12` (Naranja - Advertencias)

**Fondo**: Linear gradient 135deg: #1a1a1a → #2d2d2d

### TIPOGRAFÍA

Font stack: `'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', sans-serif`

Pesos y tamaños:
- **Navbar h1**: 700 bold, 1.5rem, letter-spacing 1px, color azul #4a90e2
- **Card h2**: 600, 1.8rem, borde-bottom 2px azul, color #333
- **Labels**: 500, color #555
- **Botones**: 600, UPPERCASE, letter-spacing 0.5px
- **Body text**: 400, color #333

### NAVBAR

Estructura:
- Contenedor: white, padding 1rem, border-radius 10px, box-shadow 0 4px 6px rgba(0,0,0,0.1)
- Borde superior: 3px solid oro #d4af37
- Display: flex, flex-direction: column, gap 1rem

**Logo**:
- 60×60px, border-radius 50% (círculo)
- Border: 2px solid oro #d4af37
- Box-shadow: 0 2px 8px rgba(0,0,0,0.15)

**Botones nav**:
- Default: white bg, azul border 2px, azul text
- Hover/Active: azul bg, white text, box-shadow 0 4px 12px rgba(74,144,226,0.3), transform translateY(-2px)
- Padding: 0.6rem 1rem
- Border-radius: 8px
- Font-weight: 600
- Text-transform: uppercase

### CARDS

- Background: white, padding 2rem, border-radius 10px
- Box-shadow: 0 4px 6px rgba(0,0,0,0.1)
- h2: border-bottom 2px azul #4a90e2, color #333

### FORMULARIOS

**Contenedor form-row**:
- Display: grid, grid-template-columns: 1fr 1fr (mobile: 1fr)
- Gap: 1rem

**Inputs/Select/Textarea**:
- Padding: 0.8rem
- Border: 2px solid #ddd
- Border-radius: 5px
- Focus: border-color azul #4a90e2, outline none

**Labels**:
- Font-weight: 500, color #555, margin-bottom 0.5rem

### BOTONES

`.btn-primary`:
- Background: azul #4a90e2, color white
- Padding: 0.8rem 1.5rem
- Border-radius: 5px
- Hover: background #5a67d8, transform translateY(-2px)

### MENSAJES

`.message.success`: bg #d4edda, color #155724, border 1px solid #c3e6cb
`.message.error`: bg #f8d7da, color #721c24, border 1px solid #f5c6cb

### DASHBOARD GRID

- Display: grid, grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))
- Gap: 1.5rem

**Stat-cards**:
- Background: linear-gradient 135deg azul #4a90e2 → gris #2d2d2d
- Color: white
- Padding: 2rem
- Border-radius: 10px
- Text-align: center
- Box-shadow: 0 4px 6px rgba(0,0,0,0.1)
- Hover: transform scale(1.05)

### ANIMACIONES

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Aplicar a secciones: animation fadeIn 0.3s ease-in

### RESPONSIVE

**Tablet (≤768px)**:
- Navbar padding: 0.8rem
- Logo: 50×50px
- h1: 1.2rem
- Nav buttons: 0.5rem 0.8rem, font-size 0.8rem
- Form-row: grid-template-columns 1fr

**Mobile (≤480px)**:
- Body padding: 10px
- Navbar padding: 0.6rem
- Logo: 45×45px
- h1: 1rem
- Nav buttons: 0.4rem 0.6rem, font--size 0.75rem

### ESPACIADO

- Small: 0.5rem
- Medium: 1rem
- Large: 1.5rem
- XL: 2rem
- XXL: 3rem

### SOMBRAS

- Sutil: 0 2px 8px rgba(0,0,0,0.1)
- Medio: 0 4px 6px rgba(0,0,0,0.1)
- Fuerte: 0 4px 12px rgba(74,144,226,0.3)

### COMPONENTES ESPECIALES

**Carrusel**:
- Auto-rotación cada 3-5 segundos
- Transición fade smooth
- Dots indicadores

**Badges de estado**:
- "Disponible": verde #2ecc71
- "Vendido": gris #6c757d
- "Proceso": naranja #f39c12
- "Reservado": azul #4a90e2
- Padding: 0.4rem 0.8rem, border-radius 20px, font-weight 600

**Tablas**:
- thead th: bg #f8f9fa, border-bottom 2px azul, font-weight 600
- td: padding 0.8rem 1rem, border-bottom 1px #eee
- tr:hover: bg #f5f5f5

### FUNCIONALIDADES

- `showSection(id)` para cambiar secciones
- Validación de emails y campos required
- Mensajes auto-disappear en 5 segundos
- Focus states azul en inputs
- Transform effects en hover

### ESTRUCTURA HTML

```html
<nav class="navbar">
  <div class="navbar-brand">
    <img class="brand-logo" src="/assets/logo.png">
    <h1>De Grazia - Automotores</h1>
  </div>
  <div class="navbar-menu">
    <button class="nav-btn">Login</button>
    <button class="nav-btn">Dashboard</button>
    <!-- más botones -->
  </div>
</nav>

<section id="login" class="section active">
  <div class="card">
    <h2>Iniciar Sesión</h2>
    <form>
      <div class="form-group">
        <label>Email</label>
        <input type="email">
      </div>
      <button class="btn btn-primary">Entrar</button>
    </form>
  </div>
</section>
```

### IMPORTANTE

- Usa CSS variables para todos los colores
- Aplica media queries para responsive
- Mantén animaciones smooth 0.3s ease
- Colores exactos: NO aproximados
- Tipografía Trebuchet MS obligatoria
- Toda la app debe verse IDÉNTICA a la web
- Incluye todas las secciones: Login, Dashboard, Stock, Clientes, Minutas, Pagos, Reportes

### RESULTADO ESPERADO

La app v3.0 debe verse EXACTAMENTE igual al sitio web actual en:
- Colores corporativos
- Tipografía y pesos
- Espaciados y alineaciones
- Formularios y inputs
- Botones y efectos
- Cards y layout
- Animaciones
- Responsive en móvil

---

**FIN DEL PROMPT PARA v3.0**

Usa este texto en tu siguiente mensaje al asistente para que replique el diseño web exactamente en la aplicación Android.
