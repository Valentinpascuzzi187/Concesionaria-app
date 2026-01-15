# 🔄 Actualizar APK - Guía Rápida

## ✅ Cambios sincronizados (Enero 2025)

### 🆕 Últimas actualizaciones incluidas:
- ✅ **URL Railway fija** (no modificable por usuarios)
- ✅ **Registro de dispositivo** (ID único + info del dispositivo)
- ✅ **Fecha/hora del dispositivo** en auditoría
- ✅ **Admin limitado** (rol sin premium)
- ✅ **Exportación Excel/JSON** mejorada
- ✅ **Interfaz oculta** para configuración de servidor

---

## 🚀 Generar APK actualizado

### Opción 1: Android Studio (Recomendado)

1. **Abre Android Studio**
2. **File → Open**
3. **Selecciona la carpeta:**
   ```
   /Users/macbookair/Desktop/concesionaria-app/android
   ```
4. **Espera que cargue** (5-10 minutos primera vez)
5. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
6. **Espera la compilación** (2-5 minutos)

### 📍 El APK estará en:
```
/Users/macbookair/Desktop/concesionaria-app/android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Opción 2: Línea de comandos (si tienes Java 17)

```bash
cd /Users/macbookair/Desktop/concesionaria-app/android
./gradlew assembleDebug
```

---

## 📱 Instalar APK actualizado

### En tu dispositivo Android:

1. **Desinstala la versión anterior** (si existe)
2. **Copia el nuevo APK** a tu celular
3. **Habilita instalación** de fuentes desconocidas
4. **Instala el APK**

### ⚠️ Importante:
- Los datos se mantienen en el servidor Railway
- Al reinstalar, solo vuelve a iniciar sesión
- Todos tus datos estarán ahí

---

## 🔐 Credenciales

```
📧 Email: admin@concesionaria.com
🔑 Password: Halcon2716@
```

---

## 🌐 Servidor configurado

El APK usa automáticamente:
```
https://concesionaria-app-production.up.railway.app
```

**No es necesario configurar nada** ✅

---

## 🛠️ Solución de problemas

### Error: "Unsupported class file major version 69"
**Solución:**
1. En Android Studio: **File → Settings**
2. **Build, Execution, Deployment → Build Tools → Gradle**
3. **Gradle JDK:** Selecciona **17**
4. **Apply** y reinicia

### Error: "SDK not found"
**Solución:**
1. **Tools → SDK Manager**
2. Instala **Android 13 (API 33)**
3. Reinicia Android Studio

### El APK no se genera
**Solución:**
1. Cierra Android Studio
2. Elimina la carpeta: `android/.gradle`
3. Abre Android Studio de nuevo
4. Espera que reconstruya el proyecto
5. Intenta generar el APK nuevamente

---

## 📊 Verificar que el APK esté actualizado

Después de instalar, verifica:

1. **Login funciona** con las credenciales premium
2. **No aparece campo** para configurar servidor
3. **Auditoría muestra** dispositivo y fecha
4. **Exportación funciona** (Excel/JSON)
5. **Usuarios muestra** opción de crear admin limitado

---

## 🎉 ¡Listo!

Tu APK está actualizado con:
- 🔒 Seguridad mejorada
- 📱 Tracking de dispositivos
- 👥 Roles de administrador
- 📊 Exportación de datos
- 🌐 Conexión fija a Railway

**¡A distribuir!** 🚀
