import {ipcRenderer} from 'electron';

const modalBtn = document.querySelector('#modalBtn');
const droptext = document.querySelector('#drop-text');
const dropzone = document.querySelector('#dropzone');
const header = document.querySelector('#header');
const input = document.querySelector('#input');
const number = document.querySelector('#number');
const generation = document.querySelector('#generation');

let path, iteration;

document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.modal');
  var instances = M.Modal.init(elems);
});

dropzone.addEventListener('dragover', e => {
    e.stopPropagation();
    e.preventDefault();
},false);


dropzone.addEventListener('drop', e => {
    e.stopPropagation();
    e.preventDefault();

    if(e.dataTransfer.files[0].name.indexOf('sql') < 0) 
        alert('you must drag only sql file');
    else {
        droptext.style.display = 'none';
        dropzone.style.display = 'none';
        header.style.display = 'none';
        modalBtn.style.display = 'block';
        input.innerHTML = e.dataTransfer.files[0].name;

        path = e.dataTransfer.files[0].name;
        console.log(path)
    }
},false);

generation.addEventListener('click', () => {
  iteration = Number(number.value);
  ipcRenderer.send('drop', {
    iteration: iteration,
    path: path,
  });
},false);

ipcRenderer.on('clear', () => {
  droptext.style.display = 'block';
  dropzone.style.display = 'block';
  header.style.display = 'block';
  modalBtn.style.display = 'none';
});