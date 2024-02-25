// Get the canvas and its 2D rendering context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Resize the canvas to fit the window
window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
  canvas.width = window.innerWidth - 2;
  canvas.height = window.innerHeight - 1;
}
resizeCanvas();

// Arrays to store boundaries, rays, and light sources
let boundaries = [];
let rays = [];
let lights = [];
let i = 0; // Index for the current light source
let hue = 0; // Initial hue value for color variation

// Number of rays to cast
let maxRayCount = 14400;
const rayNumber = 3600;
let rayCount = 3600; // Current number of rays being cast

// Variables for touch event handling
let tapTime = 0;
let tapTimeout;

let wallColor = 'black';

// Class to create boundaries
class Boundaries {
  constructor(x1, y1, x2, y2, color){
    this.a = {x: x1, y: y1};
    this.b = {x: x2, y: y2};
    this.color = color;
  }

  // Method to draw boundaries
  draw(){
    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.strokeStyle = this.color;
    ctx.stroke();
  }
}
  
// Maze dimensions
let mazeRows = 20;
let mazeCols = 40;
let cellWidth = canvas.width / mazeCols;
let cellHeight = canvas.height / mazeRows;

// Initialize maze with all walls
let maze = new Array(mazeRows);
for (let i = 0; i < mazeRows; i++) {
  maze[i] = new Array(mazeCols).fill(1);
}

// Recursive function to carve paths
function carve(x, y) {
  // Define the carving directions
  let directions = [
    [-1, 0], // Up
    [1, 0], // Down
    [0, -1], // Left
    [0, 1] // Right
  ];

  // Randomize the directions
  directions.sort(() => Math.random() - 0.5);

  // Try carving in each direction
  for (let [dx, dy] of directions) {
    let nx = x + dx * 2;
    let ny = y + dy * 2;

    if (nx >= 0 && nx < mazeRows && ny >= 0 && ny < mazeCols && maze[nx][ny] === 1) {
      maze[x + dx][y + dy] = 0;
      maze[nx][ny] = 0;
      carve(nx, ny);
    }
  }
}

// Start carving from the upper-left corner
carve(1, 1);
// Generate optimized boundaries for the maze
for (let i = 0; i < mazeRows; i++) {
  for (let j = 0; j < mazeCols; j++) {
    if (maze[i][j] === 1) {
      let x1 = j * cellWidth;
      let y1 = i * cellHeight;
      let x2 = (j + 1) * cellWidth;
      let y2 = (i + 1) * cellHeight;

      // Check the neighboring cells
      if (i > 0 && maze[i - 1][j] === 0) { // Top
        boundaries.push(new Boundaries(x1, y1, x2, y1, wallColor));
      }
      if (j > 0 && maze[i][j - 1] === 0) { // Left
        boundaries.push(new Boundaries(x1, y1, x1, y2, wallColor));
      }
      if (j < mazeCols - 1 && maze[i][j + 1] === 0) { // Right
        boundaries.push(new Boundaries(x2, y1, x2, y2, wallColor));
      }
      if (i < mazeRows - 1 && maze[i + 1][j] === 0) { // Bottom
        boundaries.push(new Boundaries(x1, y2, x2, y2, wallColor));
      }
    }
  }
}


// Create boundaries around the canvas
boundaries.push(new Boundaries(0, 0, canvas.width, 0, 'white'));
boundaries.push(new Boundaries(0, 0, 0, canvas.height, 'white'));
boundaries.push(new Boundaries(canvas.width, 0, canvas.width, canvas.height, 'white'));
boundaries.push(new Boundaries(0, canvas.height, canvas.width, canvas.height, 'white'));

// Class to create rays
class Rays {
  constructor(x, y, angle, color){
    this.pos = {x: x, y: y};
    this.dir = {x: Math.cos(angle), y: Math.sin(angle)};
    this.color = color;
  }

  // Method to draw rays
  draw(){
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(this.pos.x + this.dir.x * 5, this.pos.y + this.dir.y * 5);
    ctx.strokeStyle = this.color;
    ctx.stroke();

    this.update(this.pos.x + this.dir.x * 10, this.pos.y + this.dir.y * 10);
  }

  // Method to update ray direction
  update(x, y){
    this.dir.x = x - this.pos.x;
    this.dir.y = y - this.pos.y;

    const length = Math.sqrt(this.dir.x * this.dir.x + this.dir.y * this.dir.y);
    this.dir.x /= length;
    this.dir.y /= length;
  }

  // Method to cast ray and detect intersections with boundaries
  cast(bound){
    const x1 = bound.a.x;
    const y1 = bound.a.y;

    const x2 = bound.b.x;
    const y2 = bound.b.y;

    const x3 = this.pos.x;
    const y3 = this.pos.y;

    const x4 = this.pos.x + this.dir.x;
    const y4 = this.pos.y + this.dir.y;

    const denominator = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
    const numeratorT = (x1-x3)*(y3-y4) - (y1-y3)*(x3-x4);
    const numeratorU = -((x1-x2)*(y1-y3) - (y1-y2)*(x1-x3));

    if (denominator == 0){
      return;
    }

    const t = numeratorT / denominator;
    const u = numeratorU / denominator;

    if (t > 0 && t < 1 && u > 0){
      const point = {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      }
      return point;
    } else {
      return;
    }
  }
}

// Class to create light sources
class lightSource {
  constructor(x, y, color, rayColor){
    this.pos = {x: x, y: y};
    this.rays = [];
    this.color = color;

    // Generate rays for the light source
    for (let i = 0; i < 360; i += (360 / rayCount)){
      this.rays.push(new Rays(this.pos.x, this.pos.y, i * Math.PI / 180, rayColor));
    }
  }

  // Method to draw light source and its rays
  draw(){
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    for(let ray of this.rays){
      ray.pos.x = this.pos.x;
      ray.pos.y = this.pos.y;
      ray.draw();
    }
  }

  // Method to spread rays and detect intersections with boundaries
  spread(){
    for (let ray of this.rays){
      let closest = null;
      let record = Infinity;

      for (let boundary of boundaries) {
        const point = ray.cast(boundary);
        if (point) {
          const distance = Math.hypot(this.pos.x - point.x, this.pos.y - point.y);
          if (distance < record) {
            record = distance;
            closest = point;
          }
        }
      }

      if (closest) {
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(closest.x, closest.y);
        ctx.strokeStyle = this.color;
        ctx.stroke();
      }
    }
  }

  // Method to move the light source
  move(x, y){
    this.pos.x = x;
    this.pos.y = y;
  }

  // Method to update the number of rays for the light source
  updateRayCount(rayCount) {
    this.rays = [];
    for (let i = 0; i < 360; i += (360 / rayCount)){
      this.rays.push(new Rays(this.pos.x, this.pos.y, i * Math.PI / 180, this.rayColor));
    }
  }
}

// Create initial light source
lights.push(new lightSource(400, 400, 'rgba(255, 255, 237, 0.03)', 'rgba(255, 255, 0, 0.03)'));

// Event listener to move light source with mouse
canvas.addEventListener('mousemove', (e) => {
  lights[i].move(e.clientX, e.clientY);
});

// Event listener to add new light source or change ray count with mouse click
canvas.addEventListener('click', (e) => {
  // Decrease ray count of old light source
  lights[i].updateRayCount(640);

  // Increase index
  i++;

  hue += 10;
  const rayColor = `hsla(${hue}, 100%, 50%, 0.8)`;
  const lightColor = `hsla(${hue}, 100%, 50%, 0.03)`;

  // Add new light source with increased ray count
  lights.push(new lightSource(e.clientX, e.clientY, lightColor, rayColor, 3200));

  // Make sure the new light source is the active one
  i = lights.length - 1;
});


// Event listener for keyboard input
window.addEventListener('keydown', (e) => {
  if (e.key === 'r') {
    lights = [];
    i = 0;
    hue = 0;
    lights.push(new lightSource(400, 400, 'rgba(255, 255, 237, 0.03)', 'rgba(255, 255, 0, 0.8)'));
  }
  else if ((e.key === 'ArrowUp' || e.key === 'w') && rayCount < maxRayCount) {
    // Increase ray count
    rayCount += 100;
    for (let light of lights) {
      light.updateRayCount(rayCount);
    }
  }
  else if ((e.key === 'ArrowDown' || e.key === 's') && rayCount > 100) {
    // Decrease ray count
    rayCount -= 100;
    for (let light of lights) {
      light.updateRayCount(rayCount);
    }
  }
  if (e.key === 'ArrowLeft' || e.key === 'a') {
    if (lights.length > 1) {
      lights[i].updateRayCount(640); // Decrease ray count of old light source
      i = (i === 0) ? lights.length - 1 : i - 1;
      lights[i].updateRayCount(3200); // Increase ray count of new light source
    }
  }
  else if (e.key === 'ArrowRight' || e.key === 'd') {
    if (lights.length > 1) {
      lights[i].updateRayCount(640); // Decrease ray count of old light source
      i = (i === lights.length - 1) ? 0 : i + 1;
      lights[i].updateRayCount(3200); // Increase ray count of new light source
    }
  }
  else if (e.key === 't') {
    wallColor = (wallColor === 'black') ? 'white' : 'black';
    for (let boundary of boundaries) {
      boundary.color = wallColor;
    }
  }
});

// Event listener to handle touch events
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  
  if (tapTime === 0) {
    tapTime = Date.now();
    tapTimeout = setTimeout(() => {
      // Single tap to move light source
      lights[i].move(touch.clientX, touch.clientY);
      tapTime = 0;
    }, 200);
  } else {
    clearTimeout(tapTimeout);
    tapTime = 0;
    i++;
    rayCount = rayNumber / (lights.length / 2);

    // Update ray count for existing light sources
    for (let light of lights) {
      light.updateRayCount(rayCount);
    }

    hue += 10;
    const rayColor = `hsla(${hue}, 100%, 50%, 0.8)`;
    const lightColor = `hsla(${hue}, 100%, 50%, 0.03)`;
    lights.push(new lightSource(touch.clientX, touch.clientY, lightColor, rayColor));
  }
});

// Event listener to move light source with touch
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  lights[i].move(touch.clientX, touch.clientY);
});

function changeMaxRayCount(count){
  maxRayCount = count;
  rayCount = rayNumber;
  return 'Max ray count changed to ' + count;
}

// Function to continuously draw on canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let light of lights){
    light.draw();
    light.spread();
  }

  for (let boundary of boundaries){
    boundary.draw();
  }
  
  requestAnimationFrame(draw);
}

draw();
