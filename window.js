const electron = require('electron');
const path = require('path');
const url = require('url');
const parser = require('./parser.js');
let file = undefined;

// SET ENV
process.env.NODE_ENV = 'development';

const {app, BrowserWindow, Menu, ipcMain, dialog} = electron;

let mainWindow;


// Listen for app to be ready
app.on('ready', function(){
  // Create new window
  mainWindow = new BrowserWindow({});
  // Load html in window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file:',
    slashes:true
  }));
  // Quit app when closed
  mainWindow.on('closed', function(){
    app.quit();
  });

  // Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert menu
  Menu.setApplicationMenu(mainMenu);

  ipcMain.on('drop', (event, data) => {
    file = data.path;
    parser.notice(data.path, data.iteration);
    parser.generate();
  });
  
});


function createWindow() {
    addWindow = new BrowserWindow({
        width:900,
        height:900,
        title:'About Program'
    });
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'subWindow.html'),
        protocol: 'file:',
        slashes:true
    }));
    addWindow.on('close', function(){
        addWindow = null;
    });
}

// Create menu template
const mainMenuTemplate =  [
  // Each object is a dropdown
  {
    label: 'Info',
    submenu:[
      {
        label:'About Developer',
        click() {
            createWindow();
        }
      },
      {
        label: 'Quit',
        accelerator:process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click(){
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Init',
    submenu: [
      {
        label: 'clear',
        click() {
          mainWindow.webContents.send('clear', null);
        }
      }
    ]
  },
  {
    label: 'Extract',
    submenu:[
      {
        label: 'to JSON',
        click() {
          if(!file) {
            dialog.showMessageBox({
              type: 'error',
              message: 'You must drag file before extracting',
              buttons: []
            });
          } else 
              parser.toJSON();
        }
      },
      {
        label: 'to SQL',
        click() {
          if(!file) {
            dialog.showMessageBox({
              type: 'error',
              message: 'You must drag file before extracting',
              buttons: []
            });
          } else 
              parser.generate();
        }
      }
    ]
  }
];

// If OSX, add empty object to menu
if(process.platform == 'darwin'){
  mainMenuTemplate.unshift({});
}

// Add developer tools option if in dev
if(process.env.NODE_ENV !== 'production'){
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu:[
      {
        role: 'reload'
      },
      {
        label: 'Toggle DevTools',
        accelerator:process.platform == 'darwin' ? 'Command+Shift+I' : 'Ctrl+I',
        click(item, focusedWindow){
          focusedWindow.toggleDevTools();
        }
      }
    ]
  });
}