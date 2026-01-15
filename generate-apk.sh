#!/bin/bash

echo "🚗 Generando APK de Concesionaria Pro..."

# Verificar si tenemos Android Studio o Gradle
if ! command -v ./android/gradlew &> /dev/null; then
    echo "❌ No se encuentra Gradle. Asegúrate de tener Android Studio instalado."
    echo ""
    echo "📋 Pasos manuales:"
    echo "1. Abre Android Studio"
    echo "2. Importa el proyecto desde la carpeta 'android'"
    echo "3. Espera que descargue las dependencias"
    echo "4. Ve a Build → Build Bundle(s) / APK(s) → Build APK(s)"
    echo ""
    exit 1
fi

# Generar APK debug
echo "🔨 Generando APK Debug..."
cd android

# Limpiar proyecto
./gradlew clean

# Generar APK
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK generado exitosamente!"
    echo "📱 Ubicación: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "📋 Para instalar:"
    echo "1. Transfiere el APK a tu celular"
    echo "2. Activa 'Fuentes desconocidas' en configuración"
    echo "3. Instala el APK"
    echo ""
    echo "🌐 La app funciona completamente offline!"
    echo "💾 Los datos se guardan localmente en el dispositivo"
    echo ""
    
    # Copiar APK a ubicación más accesible
    cp app/build/outputs/apk/debug/app-debug.apk ../Concesionaria-Pro.apk
    echo "📁 APK copiado a: $(pwd)/../Concesionaria-Pro.apk"
    
else
    echo "❌ Error al generar el APK"
    echo "Verifica que tengas Android Studio y SDK instalados"
    exit 1
fi

cd ..
