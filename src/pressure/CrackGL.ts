/**
 * Minimal WebGL crack renderer — procedural glass fractures, no PNG.
 * Uses WebGL1 for broad mobile Safari / Android coverage.
 */

import { buildCrackMesh, generateCrackNetwork, type CrackSegment } from './crackNetwork';

const VERT = `
attribute vec2 aPos;
attribute vec2 aSideAlong;
varying float vSide;
varying float vAlong;
void main() {
  vSide = aSideAlong.x;
  vAlong = aSideAlong.y;
  vec2 clip = aPos * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
varying float vSide;
varying float vAlong;
uniform float uOpacity;
uniform float uTime;
void main() {
  float side = abs(vSide);
  float core = smoothstep(1.0, 0.15, side);
  float rim = smoothstep(1.0, 0.55, side) * (1.0 - core);
  float sparkle = pow(core, 2.2) * (0.75 + 0.25 * sin(uTime * 3.0 + vAlong * 40.0));

  vec3 glass = vec3(0.55, 0.58, 0.62);
  vec3 highlight = vec3(0.95, 0.97, 1.0);
  vec3 col = mix(glass, highlight, sparkle);
  col += rim * vec3(0.35, 0.4, 0.48);

  float alpha = (core * 0.95 + rim * 0.35) * uOpacity;
  if (side > 0.35 && side < 0.85) {
    col *= 0.55;
    alpha = max(alpha, 0.18 * uOpacity * (1.0 - abs(side - 0.6) * 3.0));
  }
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Unable to create shader');
  }
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'compile error';
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Unable to create program');
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? 'link error';
    gl.deleteProgram(program);
    throw new Error(info);
  }
  return program;
}

export class CrackGLRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;
  private aPos: number;
  private aSideAlong: number;
  private uOpacity: WebGLUniformLocation | null;
  private uTime: WebGLUniformLocation | null;
  private segments: CrackSegment[];
  private vertCount = 0;
  private lastReveal = -1;

  constructor(canvas: HTMLCanvasElement, seed = 77) {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    }) || canvas.getContext('experimental-webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    }) as WebGLRenderingContext | null;

    if (!gl) {
      throw new Error('WebGL unavailable');
    }
    this.gl = gl;
    this.program = createProgram(gl);
    this.segments = generateCrackNetwork(seed);

    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error('Unable to allocate GL buffer');
    }
    this.buffer = buffer;

    this.aPos = gl.getAttribLocation(this.program, 'aPos');
    this.aSideAlong = gl.getAttribLocation(this.program, 'aSideAlong');
    this.uOpacity = gl.getUniformLocation(this.program, 'uOpacity');
    this.uTime = gl.getUniformLocation(this.program, 'uTime');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    const gl = this.gl;
    const w = Math.max(1, Math.floor(cssWidth * dpr));
    const h = Math.max(1, Math.floor(cssHeight * dpr));
    if (gl.canvas.width !== w || gl.canvas.height !== h) {
      gl.canvas.width = w;
      gl.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  }

  private rebuildMesh(reveal: number): void {
    const mesh = buildCrackMesh(this.segments, reveal);
    this.vertCount = mesh.length / 4;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.DYNAMIC_DRAW);
    this.lastReveal = reveal;
  }

  draw(reveal: number, opacity: number, timeSec: number): void {
    const gl = this.gl;
    const snapped = Math.round(reveal * 80) / 80;
    if (snapped !== this.lastReveal) {
      this.rebuildMesh(snapped);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    if (this.vertCount === 0 || opacity <= 0.01) {
      return;
    }

    gl.useProgram(this.program);
    gl.uniform1f(this.uOpacity, opacity);
    gl.uniform1f(this.uTime, timeSec);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.aPos);
    gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(this.aSideAlong);
    gl.vertexAttribPointer(this.aSideAlong, 2, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
  }
}
