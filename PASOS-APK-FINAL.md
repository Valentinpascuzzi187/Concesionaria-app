# 📱 Pasos para generar el APK final (configurado con Railway)

## 🎯 Configuración ya realizada
✅ URL del servidor: **https://concesionaria-app-production.up.railway.app**  
✅ No es modificable por el usuario  
✅ Fecha/hora del dispositivo registrada  
✅ Identificador de dispositivo guardado  

## 🔨 Generar APK con Android Studio

### Paso 1: Abrir Android Studio
1. Abre **Android Studio**
2. Click en **"Open"** (o **"Open an existing project"**)

### Paso 2: Navegar al proyecto
1. Pega esta ruta exacta:
   ```
   /Users/macbookair/Desktop/concesionaria-app/android
   ```
2. Selecciona la carpeta **android**
3. Click en **"OK"**

### Paso 3: Esperar la carga
- Android Studio descargará dependencias (puede tardar 5-10 minutos)
- Verás una barra de progreso abajo

### Paso 4: Generar el APK
1. Cuando termine, ve al menú superior:
   **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Espera a que termine de compilar (2-5 minutos)

### Paso 5: Encontrar el APK
El APK se guardará en:
```
/Users/macbookair/Desktop/concesionaria-app/android/app/build/outputs/apk/debug/app-debug.apk
```

## 📲 Instalar el APK

### En un dispositivo Android:
1. Copia el archivo `app-debug.apk` a tu celular
2. Ve a **Configuración → Seguridad**
3. Activa **"Fuentes desconocidas"** o **"Instalar apps desconocidas"**
4. Haz clic en el APK para instalar

### Credenciales de acceso:
```
📧 Email: admin@concesionaria.com
🔑 Password: Halcon2716@
```

## ✅ Características del APK

- 🌐 **Siempre conectado a Railway** (no configurable)
- 📱 **Funciona offline** para datos básicos
- 🔍 **Registra dispositivo y fecha/hora**
- 👤 **Soporta admin premium y admin limitado**
- 📊 **Exportación a Excel y JSON**
- 🔄 **Sincronización automática**

## 🚨 Si tienes problemas

### Error: "Unsupported class file major version 69"
Significa que necesitas Java 17. Solución:
1. En Android Studio: **File → Settings → Build Tools → Gradle**
2. Selecciona **Gradle JDK: 17**
3. Click **Apply** y reintenta

### Error: "SDK not found"
1. En Android Studio: **Tools → SDK Manager**
2. Instala **Android 13 (API level 33)**
3. Reinicia Android Studio

## 🎉 Listo para usar

Una vez instalado, el APK:
- Se conectará automáticamente a Railway
- No permitirá cambiar la URL
- Funcionará desde cualquier lugar del mundo
- Guardará todos los datos en la nube

**¡Listo para distribuir!** 🚀
