// Misregistered aura: the RED band is sampled 3px to the right of the SDF,
// so it prints shifted 3px LEFT of the green/blue bands — a badly aligned run.
// Used once, on the guarantee "30".

/** @sdf */
uniform sampler2D u_sdf;

/** @resolution */
uniform vec2 u_resolution;

/**
 * @label Radius
 * @default 120
 * @range 8, 500
 */
uniform float u_radius;

float Bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
#define Bayer4(a) (Bayer2(0.5 * (a)) * 0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(0.5 * (a)) * 0.25 + Bayer2(a))

const vec3 RED   = vec3(0.941, 0.196, 0.098);
const vec3 GREEN = vec3(0.361, 0.788, 0.122);
const vec3 BLUE  = vec3(0.118, 0.196, 0.902);
const vec3 BLACK = vec3(0.0);

void main() {
  vec2 fc = gl_FragCoord.xy;
  float dith = (Bayer8(fc) - 0.5) * 0.07;

  float dBase = texture2D(u_sdf, fc / u_resolution).r;
  float dRed  = texture2D(u_sdf, (fc + vec2(3.0, 0.0)) / u_resolution).r;

  float tR = dRed / u_radius + dith;
  bool isRed = dRed > 0.0 && tR < 0.06;

  if (isRed) { gl_FragColor = vec4(RED, 1.0); return; }

  if (dBase <= 0.0) { gl_FragColor = vec4(BLACK, 1.0); return; }

  float t = dBase / u_radius + dith;
  vec3 col;
  if (t < 0.16)      col = GREEN;
  else if (t < 0.30) col = BLUE;
  else               col = BLACK;

  gl_FragColor = vec4(col, 1.0);
}
