/**
 * OPTIMIZACIONES ANDROID MODERNO (Android 10-16)
 * De Grazia Automotores v3.0
 * 
 * Este módulo implementa automatizaciones inteligentes, rendimiento
 * y experiencia de usuario óptima para dispositivos Android modernos.
 */

// ============================================================================
// 1. ESTADO GLOBAL - Gestión de Estado y Automatización
// ============================================================================

const AndroidOptimizations = {
  // Estado de la aplicación
  state: {
    currentSection: null,
    isLoading: false,
    hasError: false,
    screenOrientation: 'portrait',
    isAppMinimized: false,
    savedState: {}
  },

  // Inicializar optimizaciones
  async init() {
    console.log('🚀 Inicializando optimizaciones Android moderno...');
    
    // Detectar y aplicar configuraciones
    this.detectDevice();
    this.setupPerformanceOptimizations();
    this.setupAutoSaveState();
    this.setupOrientationHandling();
    this.setupAccessibility();
    this.setupGestureHandling();
    this.setupDarkModeCompat();
    
    console.log('✅ Optimizaciones Android inicializadas');
  },

  // =========================================================================
  // 2. DETECCIÓN DE DISPOSITIVO Y DENSIDAD
  // =========================================================================
  
  detectDevice() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    console.log(`📱 Dispositivo: ${width}x${height} @ ${dpr}dpr`);
    
    // Ajustar escala de fuente dinámicamente
    if (width < 480) {
      document.documentElement.style.fontSize = '14px';
    } else if (width < 768) {
      document.documentElement.style.fontSize = '15px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
    
    // Detectar notch/safe areas
    this.detectSafeAreas();
  },

  detectSafeAreas() {
    if (window.visualViewport) {
      const vv = window.visualViewport;
      console.log(`📍 Safe areas - Top: ${vv.offsetTop}px, Left: ${vv.offsetLeft}px`);
    }
    
    // Aplicar safe areas dinámicamente
    const style = document.documentElement.style;
    style.setProperty('--safe-area-top', `${this.getSafeAreaInset('top')}px`);
    style.setProperty('--safe-area-bottom', `${this.getSafeAreaInset('bottom')}px`);
    style.setProperty('--safe-area-left', `${this.getSafeAreaInset('left')}px`);
    style.setProperty('--safe-area-right', `${this.getSafeAreaInset('right')}px`);
  },

  getSafeAreaInset(position) {
    // Fallback si env() no está soportado
    const computed = getComputedStyle(document.documentElement);
    const value = computed.getPropertyValue(`--safe-area-inset-${position}`);
    return parseInt(value) || 0;
  },

  // =========================================================================
  // 3. OPTIMIZACIÓN DE RENDIMIENTO
  // =========================================================================

  setupPerformanceOptimizations() {
    // Lazy loading de imágenes
    if ('IntersectionObserver' in window) {
      this.setupLazyLoading();
    }
    
    // Optimizar scroll
    this.setupSmoothScroll();
    
    // Prevenir reflows innecesarios
    this.setupRenderOptimizations();
    
    console.log('⚡ Optimizaciones de rendimiento aplicadas');
  },

  setupLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        }
      });
    }, { rootMargin: '50px' });

    document.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });
  },

  setupSmoothScroll() {
    // Usar momentum scroll nativo
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.style.webkitOverflowScrolling = 'touch';
  },

  setupRenderOptimizations() {
    // Usar will-change solo cuando sea necesario
    const animatedElements = document.querySelectorAll('[data-animated]');
    animatedElements.forEach(el => {
      el.addEventListener('animationstart', () => {
        el.style.willChange = 'transform, opacity';
      });
      el.addEventListener('animationend', () => {
        el.style.willChange = 'auto';
      });
    });
  },

  // =========================================================================
  // 4. GESTIÓN AUTOMÁTICA DE ESTADO
  // =========================================================================

  setupAutoSaveState() {
    // Guardar estado cuando la app se minimiza
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveAppState();
        console.log('💾 Estado guardado (app minimizada)');
      } else {
        this.restoreAppState();
        console.log('📂 Estado restaurado (app reanudada)');
      }
    });

    // Guardar estado al cambiar orientación
    window.addEventListener('orientationchange', () => {
      this.saveAppState();
      console.log('💾 Estado guardado (cambio de orientación)');
    });

    // Guardar estado periódicamente
    setInterval(() => {
      if (!document.hidden) {
        this.saveAppState();
      }
    }, 10000); // Cada 10 segundos
  },

  saveAppState() {
    const state = {
      currentSection: this.state.currentSection,
      timestamp: Date.now(),
      scrollPosition: window.scrollY,
      formData: this.captureFormData()
    };

    try {
      localStorage.setItem('deGrazia_appState', JSON.stringify(state));
    } catch (e) {
      console.warn('No se pudo guardar estado:', e.message);
    }
  },

  restoreAppState() {
    try {
      const saved = localStorage.getItem('deGrazia_appState');
      if (saved) {
        const state = JSON.parse(saved);
        
        // Restaurar sección
        if (state.currentSection) {
          this.showSection(state.currentSection);
        }
        
        // Restaurar datos de formulario
        if (state.formData) {
          this.restoreFormData(state.formData);
        }
        
        // Restaurar scroll
        if (state.scrollPosition) {
          setTimeout(() => {
            window.scrollTo(0, state.scrollPosition);
          }, 100);
        }
        
        console.log('✅ Estado restaurado exitosamente');
      }
    } catch (e) {
      console.warn('Error al restaurar estado:', e.message);
    }
  },

  captureFormData() {
    const data = {};
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.id) {
        data[input.id] = input.value;
      }
    });
    return data;
  },

  restoreFormData(data) {
    Object.keys(data).forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.value = data[id];
      }
    });
  },

  // =========================================================================
  // 5. MANEJO DE ORIENTACIÓN
  // =========================================================================

  setupOrientationHandling() {
    window.addEventListener('resize', () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const orientation = isPortrait ? 'portrait' : 'landscape';
      
      if (this.state.screenOrientation !== orientation) {
        this.state.screenOrientation = orientation;
        this.onOrientationChange(orientation);
      }
    });

    // Inicial
    this.detectDevice();
  },

  onOrientationChange(orientation) {
    console.log(`📐 Orientación: ${orientation}`);
    
    // Recalcular safe areas
    this.detectSafeAreas();
    
    // Trigger resize event para elementos responsivos
    window.dispatchEvent(new Event('orientationchanged'));
  },

  // =========================================================================
  // 6. AUTOMÁTICA DE FORMULARIOS INTELIGENTE
  // =========================================================================

  setupFormAutomation() {
    // Auto-focus inteligente
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          // Scroll automático hacia el input
          setTimeout(() => {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 200);
        }
      });
    });

    // Auto-hide del teclado al completar
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur(); // Oculta el teclado
        }
      });
    });
  },

  // =========================================================================
  // 7. ESTADOS AUTOMÁTICOS (Loading, Error, Empty)
  // =========================================================================

  showLoading(container = null) {
    const target = container || document.body;
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
      <div class="spinner-content">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>
    `;
    target.appendChild(spinner);
    this.state.isLoading = true;
  },

  hideLoading() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) spinner.remove();
    this.state.isLoading = false;
  },

  showError(message, duration = 5000) {
    const error = document.createElement('div');
    error.className = 'message error';
    error.textContent = message;
    error.style.animation = 'slideInUp 0.3s ease';
    document.body.appendChild(error);

    setTimeout(() => {
      error.style.animation = 'slideInUp 0.3s ease reverse';
      setTimeout(() => error.remove(), 300);
    }, duration);

    this.state.hasError = true;
  },

  showSuccess(message, duration = 3000) {
    const success = document.createElement('div');
    success.className = 'message success';
    success.textContent = message;
    success.style.animation = 'slideInUp 0.3s ease';
    document.body.appendChild(success);

    setTimeout(() => {
      success.style.animation = 'slideInUp 0.3s ease reverse';
      setTimeout(() => success.remove(), 300);
    }, duration);
  },

  showEmptyState(container, title = 'Sin datos', message = '') {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-content">
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;
    container.appendChild(empty);
  },

  // =========================================================================
  // 8. GESTOS NATIVOS ANDROID
  // =========================================================================

  setupGestureHandling() {
    // Back gesture (dispositivos con gesture bar)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        // Simular back button
        this.onBackPressed();
      }
    });

    // Swipe para navegación
    this.setupSwipeNavigation();
  },

  setupSwipeNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    }, false);
  },

  handleSwipe(startX, endX) {
    const diff = startX - endX;
    const minSwipe = 50;

    if (Math.abs(diff) > minSwipe) {
      if (diff > 0) {
        // Swipe left - siguiente
        console.log('← Swipe left');
      } else {
        // Swipe right - atrás
        console.log('→ Swipe right');
        this.onBackPressed();
      }
    }
  },

  onBackPressed() {
    const sections = document.querySelectorAll('.section');
    const active = document.querySelector('.section.active');
    
    if (active && active.id !== 'login') {
      // Si hay una sección activa que no es login, volver a login
      this.showSection('login');
    } else if (active && active.id === 'login') {
      // En login, salir de la app
      console.log('Presione back nuevamente para salir');
    }
  },

  // =========================================================================
  // 9. MODO OSCURO COMPATIBLE
  // =========================================================================

  setupDarkModeCompat() {
    // Detectar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').media !== 'not all') {
      const darkMode = window.matchMedia('(prefers-color-scheme: dark)');
      
      darkMode.addListener((e) => {
        this.applyDarkMode(e.matches);
      });

      // Aplicar inicial
      this.applyDarkMode(darkMode.matches);
    }
  },

  applyDarkMode(enabled) {
    if (enabled) {
      document.documentElement.style.colorScheme = 'dark';
      console.log('🌙 Modo oscuro activado');
    } else {
      document.documentElement.style.colorScheme = 'light';
      console.log('☀️ Modo claro activado');
    }
  },

  // =========================================================================
  // 10. ACCESIBILIDAD
  // =========================================================================

  setupAccessibility() {
    // Aumentar tap targets mínimos
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach(btn => {
      const style = window.getComputedStyle(btn);
      const height = parseInt(style.height);
      const width = parseInt(style.width);
      
      if (height < 44 || width < 44) {
        btn.style.minHeight = '44px';
        btn.style.minWidth = '44px';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
      }
    });

    // ARIA labels
    this.ensureAriaLabels();
  },

  ensureAriaLabels() {
    const unlabeled = document.querySelectorAll('button:not([aria-label]), [role="button"]:not([aria-label])');
    unlabeled.forEach((el, idx) => {
      if (!el.textContent.trim()) {
        el.setAttribute('aria-label', `Botón ${idx + 1}`);
      }
    });
  },

  // =========================================================================
  // 11. UTILIDADES
  // =========================================================================

  showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(id);
    if (section) {
      section.classList.add('active');
      this.state.currentSection = id;
      
      // Scroll to top
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AndroidOptimizations.init();
  });
} else {
  AndroidOptimizations.init();
}

// Exportar para uso en otros scripts
window.AndroidOptimizations = AndroidOptimizations;
