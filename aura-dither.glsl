// Four-colour aura raster from the node's SDF.
// Bands run red on the outer edge to a black void at the core.

/** @sdf */
uniform sampler2D u_sdf;

/** @resolution */
uniform vec2 u_resolution;

/**
 * @label Radius
 * @default 60
 * @range 8, 500
 */
uniform float u_radius;

/**
 * @label Core
 * @default 0
 * @range 0, 2
 */
uniform int u_core;

float Bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
#define Bayer4(a) (Bayer2(0.5 * (a)) * 0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(0.5 * (a)) * 0.25 + Bayer2(a))

const vec3 RED   = vec3(0.941, 0.196, 0.098);
const vec3 GREEN = vec3(0.361, 0.788, 0.122);
const vec3 BLUE  = vec3(0.118, 0.196, 0.902);
const vec3 BLACK = vec3(0.0);

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 tc = fc / u_resolution;
  float d = texture2D(u_sdf, tc).r;

  float n = fract(sin(dot(floor(fc), vec2(12.9898, 78.233))) * 43758.5453);

  if (d <= 0.0) {
    if (d > -8.0 && n > 0.965) {
      float k = fract(n * 7.0);
      vec3 c = k < 0.34 ? RED : (k < 0.67 ? GREEN : BLUE);
      gl_FragColor = vec4(c, 1.0);
      return;
    }
    gl_FragColor = vec4(BLACK, 1.0);
    return;
  }

  float t = d / u_radius;
  t += (Bayer8(fc) - 0.5) * 0.07;

  vec3 core = u_core == 1 ? BLUE : (u_core == 2 ? RED : BLACK);

  vec3 col;
  if (t < 0.06)      col = RED;
  else if (t < 0.16) col = GREEN;
  else if (t < 0.30) col = BLUE;
  else               col = core;

  gl_FragColor = vec4(col, 1.0);
}
