#!/bin/bash

echo "🚀 Generando APK actualizado con Minuta Profesional v2.0"

# Verificar si estamos en el directorio correcto
if [ ! -d "android" ]; then
    echo "❌ Error: No se encuentra el directorio android"
    exit 1
fi

# Entrar al directorio android
cd android

# Limpiar build anterior
echo "🧹 Limpiando build anterior..."
./gradlew clean

# Generar APK debug
echo "📱 Generando APK debug..."
./gradlew assembleDebug

# Verificar si se generó el APK
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ APK generado exitosamente!"
    echo "📍 Ubicación: android/app/build/outputs/apk/debug/app-debug.apk"
    
    # Copiar APK al directorio principal
    cp app/build/outputs/apk/debug/app-debug.apk ../concesionaria-app-v2.apk
    echo "📋 APK copiado a: concesionaria-app-v2.apk"
    
    # Mostrar información del APK
    echo ""
    echo "📊 Información del APK:"
    ls -lh ../concesionaria-app-v2.apk
    
    echo ""
    echo "🎯 Para instalar en tu dispositivo:"
    echo "1. Transfiere el archivo 'concesionaria-app-v2.apk' a tu teléfono"
    echo "2. Habilita 'Instalación de fuentes desconocidas' en configuración"
    echo "3. Abre el archivo APK y sigue las instrucciones"
    
    echo ""
    echo "🔐 Credenciales de prueba:"
    echo "Email: admin@concesionaria.com"
    echo "Password: Halcon2716@"
    
else
    echo "❌ Error: No se pudo generar el APK"
    exit 1
fi
