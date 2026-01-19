var VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform float u_Size;
void main() {
  gl_Position = a_Position;
  gl_PointSize = u_Size;
}
`;

var FSHADER_SOURCE = `
precision mediump float;
uniform vec4 u_FragColor;
void main() {
  gl_FragColor = u_FragColor;
}
`;

var gl;
var shapesList = [];
var currentBrush = 'point';
var canvas;
var a_Position, u_FragColor, u_Size;

class Point {
  constructor(x, y, size, color) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
  }
  render() {
    gl.disableVertexAttribArray(a_Position);
    gl.vertexAttrib3f(a_Position, this.x, this.y, 0.0);
    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniform1f(u_Size, this.size);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class Triangle {
  constructor(vertices, size, color) {
    this.vertices = vertices;
    this.size = size;
    this.color = color;
  }
  render() {
    gl.enableVertexAttribArray(a_Position);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniform1f(u_Size, this.size);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

class Circle {
  constructor(x, y, radius, segments, size, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.segments = segments;
    this.size = size;
    this.color = color;
  }
  render() {
    gl.enableVertexAttribArray(a_Position);
    var vertices = [];
    for (let i = 0; i < this.segments; i++) {
      let theta1 = (i / this.segments) * 2 * Math.PI;
      let theta2 = ((i + 1) / this.segments) * 2 * Math.PI;
      vertices.push(
        this.x, this.y,
        this.x + this.radius * Math.cos(theta1), this.y + this.radius * Math.sin(theta1),
        this.x + this.radius * Math.cos(theta2), this.y + this.radius * Math.sin(theta2)
      );
    }
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniform1f(u_Size, this.size);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
  }
}

function main() {
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas, { preserveDrawingBuffer: true, alpha: false });
  if (!gl) return;
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) return;

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');

  canvas.onmousedown = handleMouse;
  canvas.onmousemove = handleMouse;

  renderAllShapes();
}

function handleMouse(ev) {
  if (ev.type === 'mousemove' && ev.buttons !== 1) return;
  var rect = ev.target.getBoundingClientRect();
  var x = ((ev.clientX - rect.left) - canvas.width / 2) / (canvas.width / 2);
  var y = (canvas.height / 2 - (ev.clientY - rect.top)) / (canvas.height / 2);
  var color = [
    parseFloat(document.getElementById('rSlider').value),
    parseFloat(document.getElementById('gSlider').value),
    parseFloat(document.getElementById('bSlider').value),
    1.0
  ];
  var size = parseFloat(document.getElementById('sizeSlider').value);

  if (currentBrush === 'point') {
    shapesList.push(new Point(x, y, size, color));
  } else if (currentBrush === 'triangle') {
    var s = size / 200;
    shapesList.push(new Triangle([x, y + s, x - s, y - s, x + s, y - s], size, color));
  } else if (currentBrush === 'circle') {
    var segments = parseInt(document.getElementById('segmentSlider').value);
    var radius = size / 200;
    shapesList.push(new Circle(x, y, radius, segments, size, color));
  }
  renderAllShapes();
}

function renderAllShapes() {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  shapesList.forEach(s => s.render());
}

function setBrush(type) {
  currentBrush = type;
}

function clearCanvas() {
  shapesList = [];
  renderAllShapes();
}
