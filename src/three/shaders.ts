/*
 * The voxel field: one instanced draw, every voxel placed in the vertex shader.
 *
 * Each instance knows only its index. From it the shader derives four target
 * layouts and blends between neighbouring ones as the page scrolls:
 *   0 TERRAIN  fbm heightfield, sculpted by the pointer
 *   1 DIE      a chip floorplan: pads, cores, cache banks, signal traces
 *   2 FLOOR    a quiet lab floor beneath the project exhibits
 *   3 CUBE     the field reassembles into an m×m×m cube (g² = m³)
 *
 * Shading borrows from the FPGA GPU in the voxel-engine project: block grid lines
 * in the fragment stage and ordered dithering before output.
 */

const noise = /* glsl */ `
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * snoise(p); p *= 2.03; a *= 0.5; }
  return s;
}
float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
`

export const voxelVertex = /* glsl */ `
uniform float uTime;
uniform float uState;
uniform float uGrid;
uniform float uCube;
uniform float uCell;
uniform float uCubeCell;
uniform vec4 uPointer;   // xz world, presence 0..1, hold 0..1
uniform vec4 uShock;     // xz world, age seconds, strength
uniform mat3 uCubeRot;
uniform float uHover;
uniform float uIntro;

attribute float aIndex;

varying vec3 vNormal;
varying vec3 vWorld;
varying vec2 vUv;
varying float vLocalY;
varying float vHeight;
varying float vEmissive;
varying float vKind;
varying float vRand;

${noise}

struct Voxel { vec3 base; vec3 scale; float height; float emissive; bool centred; };

Voxel terrain(vec2 p, float r) {
  float n = fbm(p * 0.052 + vec2(uTime * 0.011, -uTime * 0.007));
  float ridge = 1.0 - abs(snoise(p * 0.028 + 7.31));
  float h = smoothstep(-0.55, 0.8, n);
  h = h * h * (0.55 + 0.45 * ridge);
  float height = 0.3 + h * 9.5 * uIntro;

  float d = distance(p, uPointer.xy);
  height += uPointer.z * (1.6 + uPointer.w * 3.4) * exp(-d * d / 16.0);

  float ringR = uShock.z * 20.0;
  float ds = distance(p, uShock.xy);
  float ring = exp(-pow(ds - ringR, 2.0) * 0.25) * exp(-uShock.z * 1.3) * uShock.w;
  height += ring * 2.6;

  // Terrace into half-voxel steps so the field reads as stacked blocks.
  height = max(0.25, floor(height * 2.0 + 0.5) * 0.5);

  Voxel v;
  v.base = vec3(p.x, 0.0, p.y);
  v.scale = vec3(uCell * 0.94, height, uCell * 0.94);
  v.height = clamp((height - 0.25) / 9.5, 0.0, 1.0);
  v.emissive = ring * 0.85 + uPointer.z * exp(-d * d / 5.0) * 0.18 * step(0.5, fract(r * 7.0 + uTime * 0.8));
  v.centred = false;
  return v;
}

Voxel die(vec2 cell, vec2 p, float r) {
  vec2 u = cell / (uGrid - 1.0);
  vec2 q = (u - 0.5) * 2.0;
  vec2 aq = abs(q);
  float edge = max(aq.x, aq.y);
  float h = 0.14;
  float e = 0.0;

  bool core = aq.x > 0.1 && aq.x < 0.44 && aq.y > 0.1 && aq.y < 0.44;
  bool cache = q.y > 0.52 && q.y < 0.74 && aq.x < 0.66;
  bool io = q.y < -0.52 && q.y > -0.74 && aq.x < 0.66;
  bool pll = aq.x > 0.56 && aq.x < 0.74 && aq.y < 0.3;

  if (edge > 0.88) {
    float along = aq.x > aq.y ? cell.y : cell.x;
    h = mod(along, 2.0) < 1.0 ? 0.62 : 0.1;
  } else if (edge > 0.8) {
    h = 0.06;
  } else if (core) {
    h = 0.85 + 0.35 * step(0.55, r);
    e = 0.55 * step(0.992, fract(r * 31.7 + uTime * 0.45));
  } else if (cache) {
    h = 0.48 + 0.1 * mod(cell.x, 2.0);
  } else if (io || pll) {
    h = 0.34;
  } else {
    float tx = 1.0 - step(0.5, mod(cell.x, 6.0));
    float ty = 1.0 - step(0.5, mod(cell.y, 6.0));
    float trace = max(tx, ty);
    h = mix(0.14, 0.22, trace);
    float sx = smoothstep(0.9, 1.0, fract(u.y * 1.4 - uTime * 0.32 + hash(cell.x) * 3.0));
    float sy = smoothstep(0.9, 1.0, fract(u.x * 1.4 + uTime * 0.27 + hash(cell.y + 7.0) * 3.0));
    e = max(tx * sx, ty * sy);
  }

  Voxel v;
  v.base = vec3(p.x * 0.82, 0.0, p.y * 0.82);
  v.scale = vec3(uCell * 0.8, h, uCell * 0.8);
  v.height = clamp(h / 1.2, 0.0, 1.0);
  v.emissive = e;
  v.centred = false;
  return v;
}

Voxel floorplane(vec2 p, float r) {
  float wave = 0.5 + 0.5 * sin(dot(p, vec2(0.17, 0.11)) + uTime * 0.6);
  float h = 0.05 + 0.16 * wave * (0.6 + 0.4 * r);
  float rings = smoothstep(0.82, 1.0, 0.5 + 0.5 * sin(length(p) * 0.55 - uTime * 2.6));
  Voxel v;
  v.base = vec3(p.x * 1.4, -1.2, p.y * 1.4);
  v.scale = vec3(uCell * 1.2, h, uCell * 1.2);
  v.height = 0.08 + 0.1 * wave;
  v.emissive = uHover * rings * 0.3 * exp(-length(p) / 16.0);
  v.centred = false;
  return v;
}

Voxel cube(float r) {
  float m = uCube;
  vec3 c = vec3(mod(aIndex, m), mod(floor(aIndex / m), m), floor(aIndex / (m * m)));
  vec3 off = (c - (m - 1.0) * 0.5) * uCubeCell;
  float breathe = 1.0 + 0.035 * sin(uTime * 0.9 - length(off) * 0.9);
  Voxel v;
  v.base = uCubeRot * (off * breathe) + vec3(0.0, 4.4, 0.0);
  v.scale = vec3(uCubeCell * 0.8);
  v.height = c.y / (m - 1.0);
  v.emissive = 0.9 * step(0.9965, fract(r * 91.3 + uTime * 0.07));
  v.centred = true;
  return v;
}

Voxel stateAt(float k, vec2 cell, vec2 p, float r) {
  if (k < 0.5) return terrain(p, r);
  if (k < 1.5) return die(cell, p, r);
  if (k < 2.5) return floorplane(p, r);
  return cube(r);
}

vec3 placeLocal(Voxel v, vec3 pos) {
  vec3 local = (v.centred ? pos - vec3(0.0, 0.5, 0.0) : pos) * v.scale;
  return v.centred ? uCubeRot * local : local;
}

void main() {
  vec2 cell = vec2(mod(aIndex, uGrid), floor(aIndex / uGrid));
  vec2 p = (cell - (uGrid - 1.0) * 0.5) * uCell;
  float r = hash(aIndex + 0.5);

  float s = clamp(uState, 0.0, 3.0);
  float k = min(floor(s), 2.0);
  float t = s - k;
  float delay = r * 0.4;
  float tt = clamp((t - delay) / 0.6, 0.0, 1.0);
  float e = tt * tt * (3.0 - 2.0 * tt);

  // Only evaluate both layouts while this voxel is actually in transit.
  Voxel a;
  Voxel b;
  if (e <= 0.0) {
    a = stateAt(k, cell, p, r);
    b = a;
  } else if (e >= 1.0) {
    b = stateAt(k + 1.0, cell, p, r);
    a = b;
  } else {
    a = stateAt(k, cell, p, r);
    b = stateAt(k + 1.0, cell, p, r);
  }

  vec3 localA = placeLocal(a, position);
  vec3 localB = placeLocal(b, position);
  vec3 nA = a.centred ? uCubeRot * normal : normal;
  vec3 nB = b.centred ? uCubeRot * normal : normal;

  float lift = sin(e * 3.14159) * (1.2 + r * (k > 1.5 ? 6.0 : 2.5));
  vec3 world = mix(a.base + localA, b.base + localB, e) + vec3(0.0, lift, 0.0);

  vNormal = normalize(mix(nA, nB, e));
  vWorld = world;
  vUv = uv;
  vLocalY = mix(localA.y, localB.y, e);
  vHeight = mix(a.height, b.height, e);
  vEmissive = mix(a.emissive, b.emissive, e);
  vKind = k + e;
  vRand = r;

  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`

export const voxelFragment = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uAccent;
uniform vec3 uCamPos;
uniform float uFogNear;
uniform float uFogFar;
uniform float uDebug;

varying vec3 vNormal;
varying vec3 vWorld;
varying vec2 vUv;
varying float vLocalY;
varying float vHeight;
varying float vEmissive;
varying float vKind;
varying float vRand;

float bayer4(vec2 p) {
  ivec2 i = ivec2(mod(p, 4.0));
  int idx = i.x + i.y * 4;
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return float(m[idx]) / 16.0;
}

vec3 hue(float h) {
  return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 L = normalize(vec3(-0.45, 0.85, 0.32));
  float diff = max(dot(n, L), 0.0);
  float hemi = 0.5 + 0.5 * n.y;

  // Terrain: charcoal valleys to bone-white peaks. Later states: machined metal.
  float hh = smoothstep(0.04, 1.0, vHeight);
  vec3 terrainCol = mix(vec3(0.05, 0.053, 0.058), vec3(0.86, 0.845, 0.81), pow(hh, 1.25));
  vec3 metalCol = mix(vec3(0.05, 0.052, 0.058), vec3(0.2, 0.2, 0.21), hh);
  vec3 albedo = mix(terrainCol, metalCol, clamp(vKind, 0.0, 1.0));

  vec3 col = albedo * (0.16 + 0.34 * hemi + 0.78 * diff);

  vec3 V = normalize(uCamPos - vWorld);
  float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);
  col += fres * 0.06;

  // Block grid lines. Side faces get a line every half unit of height so tall
  // columns read as stacked voxels, like the FPGA renderer's grid lines.
  vec2 g = abs(n.y) > 0.5 ? vUv : vec2(vUv.x, fract(vLocalY * 2.0));
  vec2 w = fwidth(g) * 1.2;
  vec2 lines = smoothstep(vec2(0.0), w, min(g, 1.0 - g));
  float line = 1.0 - min(lines.x, lines.y);
  col = mix(col, col * 0.5, line * 0.85);

  col += uAccent * vEmissive * 1.5;

  if (uDebug > 0.5) {
    col = mix(col, hue(vRand) * 0.7, 0.55) + line * vec3(0.2, 1.0, 0.7) * 0.5;
  }

  float dist = length(vWorld - uCamPos);
  col = mix(col, uBg, smoothstep(uFogNear, uFogFar, dist));

  col += (bayer4(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`
