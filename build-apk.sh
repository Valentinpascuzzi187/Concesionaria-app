#!/bin/bash

echo "🔧 Configurando Capacitor para Android APK..."

# Inicializar Capacitor si no está inicializado
if [ ! -d "android" ]; then
    echo "📱 Creando proyecto Android..."
    npx cap init "Concesionaria Pro" "com.concesionaria.app"
    npx cap add android
fi

# Sincronizar archivos web con Android
echo "🔄 Sincronizando archivos web..."
npx cap sync android

echo "✅ Proyecto Android listo en la carpeta 'android'"
echo ""
echo "📋 Pasos para generar el APK:"
echo "1. Abre Android Studio"
echo "2. Importa el proyecto desde la carpeta 'android'"
echo "3. Espera que descargue las dependencias"
echo "4. Ve a Build → Build Bundle(s) / APK(s) → Build APK(s)"
echo "5. El APK se guardará en android/app/build/outputs/apk/debug/"
echo ""
echo "🚀 Si quieres generar APK firmado para Play Store:"
echo "1. Ve a Build → Generate Signed Bundle / APK"
echo "2. Sigue el asistente para crear la clave"
echo ""
echo "📱 El APK funcionará sin conexión a internet una vez generado!"
echo "🌐 Para actualizar la URL del servidor, edita public/mobile.html"
