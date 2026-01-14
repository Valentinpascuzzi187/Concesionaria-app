const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Funciones de exportación y respaldo
ipcMain.handle('exportar-datos', async () => {
  try {
    const response = await fetch('http://localhost:4000/api/exportar-datos');
    const data = await response.json();
    
    // Seleccionar ubicación para guardar archivo
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar Datos Completos',
      defaultPath: `concesionaria_export_${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled) {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      return { success: true, message: 'Datos exportados correctamente', archivo: result.filePath };
    }
    
    return { success: false, message: 'Exportación cancelada' };
  } catch (error) {
    console.error('Error al exportar datos:', error);
    return { success: false, message: 'Error al exportar datos: ' + error.message };
  }
});

ipcMain.handle('importar-datos', async (event, datos) => {
  try {
    const response = await fetch('http://localhost:4000/api/importar-datos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ datos })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al importar datos:', error);
    return { success: false, message: 'Error al importar datos: ' + error.message };
  }
});

ipcMain.handle('descargar-respaldo', async () => {
  try {
    // Buscar el backup más reciente
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      return { success: false, message: 'No hay backups disponibles' };
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      return { success: false, message: 'No hay backups disponibles' };
    }
    
    const latestBackup = files[0];
    
    // Seleccionar ubicación para guardar
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Descargar Respaldo de Base de Datos',
      defaultPath: latestBackup.name,
      filters: [
        { name: 'Database Files', extensions: ['db'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled) {
      fs.copyFileSync(latestBackup.path, result.filePath);
      return { 
        success: true, 
        message: 'Respaldo descargado correctamente', 
        archivo: result.filePath,
        fecha: latestBackup.time
      };
    }
    
    return { success: false, message: 'Descarga cancelada' };
  } catch (error) {
    console.error('Error al descargar respaldo:', error);
    return { success: false, message: 'Error al descargar respaldo: ' + error.message };
  }
});
