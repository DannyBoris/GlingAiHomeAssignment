import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron';
import path, { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { menuTemplate } from './menu';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobe from 'ffprobe-static';

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobe.path);

console.log(process.env.NODE_ENV);

const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 2000,
    height: 2000,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: true,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));
  ipcMain.on('transcode-video', async (event, params) => {
    console.log('Transcoding video');
    const outputPath = path.join(__dirname, 'output.mp4');
    const { url, clips } = params;
    const visibleClips = clips.filter((clip) => !clip.isHidden);
    if (visibleClips.length === 0) return;
    if (visibleClips.length === clips.length) {
      return console.log('No hidden clips');
    }
    const videoResponse = await fetch(url);
    const videoBlob = await videoResponse.blob();
    const arrayBuffer = await videoBlob.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    console.log('Transcoding video:', url);
    try {
      let completed = 0;
      visibleClips.forEach((clip, index: number) => {
        const [start, end] = clip.range;
        const output = path.join(__dirname, `output-${index + 1}.mp4`);
        ffmpeg(outputPath)
          .setStartTime(start)
          .setDuration(end - start)
          .output(output)
          .on('end', () => {
            completed++;
            if (completed === visibleClips.length) {
              console.log('Finished transcoding');
              const mergeBase = ffmpeg();
              visibleClips.forEach((_, index: number) => {
                mergeBase.input(path.join(__dirname, `output-${index + 1}.mp4`));
              });
              mergeBase
                .on('end', () => {
                  event.sender.send('transcode-video-complete', {
                    binary: fs.readFileSync(path.join(__dirname, 'output-merged.mp4')),
                  });
                  fs.unlinkSync(outputPath);
                })
                .on('error', (err) => console.log(err))
                .mergeToFile(
                  path.join(__dirname, 'output-merged.mp4'),
                  path.join(__dirname, 'temp'),
                );
            }
          })
          .run();
      });
    } catch (e: any) {
      console.log(e.code);
      console.log(e.msg);
    }
  });

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
