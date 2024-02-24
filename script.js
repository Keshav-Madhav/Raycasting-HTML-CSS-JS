const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

//resize canvas
window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
  canvas.width = window.innerWidth - 2;
  canvas.height = window.innerHeight - 1;
}
resizeCanvas();

let boundaries = [];
let rays = [];
let light;

// class to create boundaries
class Boundaries {
  constructor(x1, y1, x2, y2, color){
    this.a= {x: x1, y: y1};
    this.b= {x: x2, y: y2};
    this.color = color;
  }

  draw(){
    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.strokeStyle = this.color;
    ctx.stroke();
  }
}
  
// Generate random boundaries
for (let i = 0; i < 5; i++) {
  const x1 = Math.random() * canvas.width;
  const y1 = Math.random() * canvas.height;
  const x2 = Math.random() * canvas.width;
  const y2 = Math.random() * canvas.height;
  const color = 'white';
  boundaries.push(new Boundaries(x1, y1, x2, y2, color));
}


// class to create rays
class Rays{
  constructor(x, y, angle, color){
    this.pos = {x: x, y: y};
    this.dir = {x: Math.cos(angle), y: Math.sin(angle)};
    this.color = color;
  }

  draw(){
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(this.pos.x + this.dir.x * 5, this.pos.y + this.dir.y * 5);
    ctx.strokeStyle = this.color;
    ctx.stroke();

    this.update(this.pos.x + this.dir.x * 10, this.pos.y + this.dir.y * 10);
  }

  update(x, y){
    this.dir.x = x - this.pos.x;
    this.dir.y = y - this.pos.y;

    const length = Math.sqrt(this.dir.x * this.dir.x + this.dir.y * this.dir.y);
    this.dir.x /= length;
    this.dir.y /= length;
  }

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


class lightSource {
  constructor(x, y, color, rayColor){
    this.pos = {x: x, y: y};
    this.rays = [];
    this.color = color;

    for (let i = 0; i < 360; i += 0.5){
      this.rays.push(new Rays(this.pos.x, this.pos.y, i * Math.PI / 180, rayColor));
    }
  }

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

  spread(){
    for (let ray of this.rays){
      let closest = null;
      let record = Infinity;

      for (let boundary of boundaries){
        const point = ray.cast(boundary);
        if (point){
          const distance = Math.sqrt((this.pos.x - point.x) * (this.pos.x - point.x) + (this.pos.y - point.y) * (this.pos.y - point.y));
          if (distance < record){
            record = distance;
            closest = point;
          }
        }
      }

      if (closest){
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(closest.x, closest.y);
        ctx.strokeStyle = this.color;
        ctx.stroke();
      }

      else{
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(ray.pos.x + ray.dir.x * 1000, ray.pos.y + ray.dir.y * 1000);
        ctx.strokeStyle = this.color;
        ctx.stroke();
      }
    }
  }

  move(x, y){
    this.pos.x = x;
    this.pos.y = y;
  }
}
light = new lightSource(400, 400, 'rgba(255, 255, 237, 0.05)', 'rgba(255, 255, 0, 0.8)');


// event listener to move light source
canvas.addEventListener('mousemove', (e) => {
  light.move(e.clientX, e.clientY);
});

// function to draw on canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  light.draw();

  for (let boundary of boundaries){
    boundary.draw();
    light.spread(boundary);
  }
  
  requestAnimationFrame(draw);
}

draw();