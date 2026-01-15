#!/bin/bash

echo "🔨 Construyendo APK final con configuración Railway..."

# Verificar si Android Studio está instalado
if ! command -v ./android/gradlew &> /dev/null; then
    echo "❌ Error: No se encuentra el proyecto Android"
    echo "💡 Ejecuta primero: npx cap add android"
    exit 1
fi

# Entrar al directorio android
cd android

# Limpiar build anterior
echo "🧹 Limpiando build anterior..."
./gradlew clean

# Construir APK debug
echo "📱 Generando APK..."
./gradlew assembleDebug

# Verificar si se creó el APK
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ APK generado exitosamente!"
    echo "📍 Ubicación: android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "🚀 Para instalar en un dispositivo Android:"
    echo "1. Copia el archivo a tu celular"
    echo "2. Habilita 'Fuentes desconocidas' en Configuración"
    echo "3. Haz clic en el APK para instalar"
    echo ""
    echo "📋 Credenciales para login:"
    echo "Email: admin@concesionaria.com"
    echo "Password: Halcon2716@"
    echo ""
    echo "🌐 El APK usará automáticamente: https://concesionaria-app-production.up.railway.app"
else
    echo "❌ Error: No se pudo generar el APK"
    echo "💡 Revisa que tengas instalado Android Studio y el SDK de Android"
fi
