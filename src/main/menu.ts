import { app, MenuItemConstructorOptions, shell } from 'electron';

const isMac = process.platform === 'darwin';

const optionalViewMenuItems = [
  { role: 'reload' },
  { role: 'forceReload' },
  { role: 'toggleDevTools' },
  { type: 'separator' },
];

export const menuTemplate: Array<MenuItemConstructorOptions> = [
  // @ts-expect-error 2322
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        },
      ]
    : []),
  {
    label: 'File',
    // @ts-expect-error 2322
    submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
  },
  {
    label: 'Edit',
    // @ts-expect-error 2322
    submenu: [
      { role: 'selectAll', accelerator: 'CmdOrCtrl+A' },
      { role: 'cut', accelerator: 'CmdOrCtrl+X' },
      { role: 'copy', accelerator: 'CmdOrCtrl+C' },
      { role: 'paste', accelerator: 'CmdOrCtrl+V' },
    ],
  },
  {
    label: 'View',
    submenu: [
      // @ts-expect-error 2322
      ...optionalViewMenuItems,
      // @ts-expect-error 2322
      { role: 'resetZoom' },
      // @ts-expect-error 2322
      { role: 'zoomIn' },
      // @ts-expect-error 2322
      { role: 'zoomOut' },
      // @ts-expect-error 2322
      { type: 'separator' },
      // @ts-expect-error 2322
      { role: 'togglefullscreen' },
    ],
  },
  {
    label: 'Window',
    // @ts-expect-error 2322
    submenu: [{ role: 'minimize' }, { role: 'zoom' }],
  },
  {
    role: 'help',
    // @ts-expect-error 2322
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          await shell.openExternal('https://gling.ai');
        },
      },
    ],
  },
];
