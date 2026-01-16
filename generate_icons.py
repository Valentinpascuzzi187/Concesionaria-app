#!/usr/bin/env python3
"""
Generador de íconos Android para De Grazia Automotores v3.0
Crea íconos en todos los tamaños requeridos con paleta corporativa
"""

from PIL import Image, ImageDraw
import os
import shutil
from pathlib import Path

# Colores corporativos De Grazia
COLOR_PRIMARY = (74, 144, 226)      # #4a90e2 Azul
COLOR_GOLD = (212, 175, 55)         # #d4af37 Oro
COLOR_DARK = (26, 26, 26)           # #1a1a1a Negro
COLOR_LIGHT = (245, 245, 245)       # #f5f5f5 Gris claro

# Tamaños de íconos Android
ICON_SIZES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

STORE_SIZE = 512

def create_icon_with_logo(size, logo_path=None):
    """
    Crea un ícono con logo escalado y fondo corporativo
    """
    # Crear fondo corporativo (gradiente azul)
    img = Image.new('RGBA', (size, size), COLOR_LIGHT)
    draw = ImageDraw.Draw(img)
    
    # Dibujar fondo degradado (simulado con colores sólidos)
    # Parte superior: azul más claro
    for y in range(size // 2):
        alpha = int(255 * (y / (size // 2)) * 0.3)
        draw.rectangle([(0, y), (size, y + 1)], fill=(*COLOR_PRIMARY, alpha))
    
    # Intento de cargar logo existente
    if logo_path and os.path.exists(logo_path):
        try:
            logo = Image.open(logo_path)
            # Redimensionar logo al 80% del ícono
            logo_size = int(size * 0.8)
            logo_resized = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
            
            # Centrar logo
            offset = (size - logo_size) // 2
            img.paste(logo_resized, (offset, offset), logo_resized if logo.mode == 'RGBA' else None)
        except Exception as e:
            print(f"  ⚠ Error al cargar logo: {e}")
    
    # Dibujar círculo de borde oro
    border_width = max(2, size // 48)
    draw.ellipse(
        [(border_width, border_width), (size - border_width, size - border_width)],
        outline=COLOR_GOLD,
        width=border_width
    )
    
    return img

def create_foreground_icon(size):
    """
    Crea el icono foreground para Adaptive Icons (Android 8+)
    """
    # Fondo transparente
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Dibujar círculo con logo (120% size para que se corte correctamente)
    circle_size = int(size * 1.2)
    offset = (size - circle_size) // 2
    
    # Fondo azul en círculo
    draw.ellipse(
        [(offset, offset), (offset + circle_size, offset + circle_size)],
        fill=COLOR_PRIMARY
    )
    
    # Logo si existe
    logo_path = 'public/assets/logo.png'
    if os.path.exists(logo_path):
        try:
            logo = Image.open(logo_path)
            logo_size = int(size * 0.6)
            logo_resized = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
            logo_offset = (size - logo_size) // 2
            img.paste(logo_resized, (logo_offset, logo_offset), logo_resized if logo.mode == 'RGBA' else None)
        except:
            pass
    
    return img

def create_background_icon(size):
    """
    Crea el fondo para Adaptive Icons (Android 8+)
    """
    # Fondo con gradiente corporativo
    img = Image.new('RGB', (size, size), COLOR_LIGHT)
    draw = ImageDraw.Draw(img)
    
    # Degradado diagonal de oro y azul
    for i in range(size):
        ratio = i / size
        r = int(COLOR_DARK[0] + (COLOR_LIGHT[0] - COLOR_DARK[0]) * ratio)
        g = int(COLOR_DARK[1] + (COLOR_LIGHT[1] - COLOR_DARK[1]) * ratio)
        b = int(COLOR_DARK[2] + (COLOR_LIGHT[2] - COLOR_DARK[2]) * ratio)
        draw.rectangle([(0, i), (size, i + 1)], fill=(r, g, b))
    
    return img

def main():
    print("\n" + "="*70)
    print("  GENERADOR DE ÍCONOS - De Grazia Automotores v3.0")
    print("="*70)
    
    base_res_path = 'android/app/src/main/res'
    logo_path = 'public/assets/logo.png'
    
    # Verificar logo
    if not os.path.exists(logo_path):
        print(f"\n⚠ Logo no encontrado en {logo_path}")
        print("  Se crearán íconos solo con colores corporativos")
    else:
        print(f"\n✓ Logo encontrado: {logo_path}")
    
    # Generar íconos regulares
    print("\n📱 Generando íconos regulares...")
    for dpi, size in ICON_SIZES.items():
        folder = f'{base_res_path}/mipmap-{dpi}'
        os.makedirs(folder, exist_ok=True)
        
        # Ícono regular
        icon = create_icon_with_logo(size, logo_path)
        icon_path = f'{folder}/ic_launcher.png'
        icon.save(icon_path, 'PNG')
        print(f"  ✓ {dpi:8} ({size:3}x{size:3}): {icon_path}")
        
        # Ícono redondo
        round_icon = icon.copy()
        draw = ImageDraw.Draw(round_icon)
        draw.ellipse([(0, 0), (size, size)], outline=COLOR_GOLD, width=2)
        round_path = f'{folder}/ic_launcher_round.png'
        round_icon.save(round_path, 'PNG')
    
    # Adaptive Icons (Android 8+)
    print("\n🎨 Generando Adaptive Icons...")
    for dpi, size in ICON_SIZES.items():
        folder = f'{base_res_path}/mipmap-{dpi}'
        
        # Foreground (logo)
        foreground = create_foreground_icon(size)
        fg_path = f'{folder}/ic_launcher_foreground.png'
        foreground.save(fg_path, 'PNG')
        print(f"  ✓ Foreground {dpi:8}: {fg_path}")
        
        # Background
        background = create_background_icon(size)
        bg_path = f'{folder}/ic_launcher_background.png'
        background.save(bg_path, 'PNG')
    
    # Adaptive Icon definition (XML)
    print("\n📄 Generando definición Adaptive Icon...")
    anydpi_folder = f'{base_res_path}/mipmap-anydpi-v26'
    os.makedirs(anydpi_folder, exist_ok=True)
    
    adaptive_xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
'''
    
    with open(f'{anydpi_folder}/ic_launcher.xml', 'w') as f:
        f.write(adaptive_xml)
    print(f"  ✓ Adaptive icon definition: {anydpi_folder}/ic_launcher.xml")
    
    with open(f'{anydpi_folder}/ic_launcher_round.xml', 'w') as f:
        f.write(adaptive_xml)
    print(f"  ✓ Adaptive icon round definition: {anydpi_folder}/ic_launcher_round.xml")
    
    # Ícono para Play Store
    print("\n🏪 Generando ícono para Play Store...")
    store_icon = create_icon_with_logo(STORE_SIZE, logo_path)
    store_path = f'android_icons_store/ic_launcher_{STORE_SIZE}x{STORE_SIZE}.png'
    os.makedirs('android_icons_store', exist_ok=True)
    store_icon.save(store_path, 'PNG')
    print(f"  ✓ Play Store icon ({STORE_SIZE}x{STORE_SIZE}): {store_path}")
    
    print("\n" + "="*70)
    print("  ✅ ÍCONOS GENERADOS CORRECTAMENTE")
    print("="*70)
    print("\n📋 Resumen:")
    print(f"  • Íconos regulares: {len(ICON_SIZES)} tamaños")
    print(f"  • Adaptive Icons: ✓ (Android 8+)")
    print(f"  • Ícono Play Store: ✓ ({STORE_SIZE}x{STORE_SIZE})")
    print(f"  • Ubicación: {base_res_path}/")
    print("\n✨ Los íconos usan la paleta corporativa De Grazia:")
    print(f"  • Azul primario: #4a90e2")
    print(f"  • Oro: #d4af37")
    print(f"  • Fondo: #1a1a1a → #f5f5f5")
    print("\n")

if __name__ == '__main__':
    main()
