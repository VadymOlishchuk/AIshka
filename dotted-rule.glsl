// Dotted pixel rule: a row of 4x4 squares with 4px gaps, #7A8285 at 40%.
// Apply to a frame/rectangle that is 4px tall.

/** @resolution */
uniform vec2 u_resolution;

void main() {
  float x = mod(gl_FragCoord.x, 8.0);
  float on = x < 4.0 ? 1.0 : 0.0;
  gl_FragColor = vec4(0.478, 0.510, 0.522, on * 0.4);
}
