const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

//resize canvas
window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
  canvas.width = window.innerWidth - 2;
  canvas.height = window.innerHeight - 1;
}
resizeCanvas();