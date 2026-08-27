// Horizontal scanline overlay: 1px black lines at 6% opacity every 3px.

/** @resolution */
uniform vec2 u_resolution;

void main() {
  float y = mod(gl_FragCoord.y, 3.0);
  float a = y < 1.0 ? 0.06 : 0.0;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
}
