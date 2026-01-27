const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow;
let server;

function startLocalServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
      const ext = path.extname(filePath);
      const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

async function createWindow() {
  const port = await startLocalServer();

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    backgroundColor: '#0f0f0f',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f0f0f',
      symbolColor: '#e5e5e5',
      height: 40
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadURL(`http://127.0.0.1:${port}/`);

  // Allow popups for Google OAuth
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('accounts.google.com') || url.includes('googleapis.com') || url.includes('firebaseapp.com')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 700,
          autoHideMenuBar: true,
          parent: mainWindow,
          modal: false
        }
      };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('fetch-og', async (event, url) => {
  try {
    const { net } = require('electron');
    return await new Promise((resolve, reject) => {
      const request = net.request(url);
      let body = '';
      request.on('response', (response) => {
        response.on('data', (chunk) => { body += chunk.toString(); });
        response.on('end', () => {
          const og = {};
          const titleMatch = body.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
            || body.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
          const descMatch = body.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)
            || body.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
          const imgMatch = body.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)
            || body.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);
          const htmlTitleMatch = body.match(/<title[^>]*>([^<]*)<\/title>/i);
          const metaDescMatch = body.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
            || body.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);

          og.ogTitle = (titleMatch && titleMatch[1]) || (htmlTitleMatch && htmlTitleMatch[1]) || '';
          og.ogDescription = (descMatch && descMatch[1]) || (metaDescMatch && metaDescMatch[1]) || '';
          og.ogImage = (imgMatch && imgMatch[1]) || '';

          try {
            const u = new URL(url);
            og.favicon = `${u.origin}/favicon.ico`;
          } catch(e) {
            og.favicon = '';
          }

          resolve(og);
        });
      });
      request.on('error', (err) => resolve({ ogTitle: '', ogDescription: '', ogImage: '', favicon: '' }));
      request.end();
    });
  } catch(e) {
    return { ogTitle: '', ogDescription: '', ogImage: '', favicon: '' };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});
