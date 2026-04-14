precision highp float;

uniform float uHover;

varying float vHeight;
varying float vDistance;
varying vec2 vUv;

void main() {
  // Radial mask keeps this looking like a clean circular interface.
  vec2 centered = vUv - vec2(0.5);
  float radius = length(centered) * 2.0;
  float edgeFade = smoothstep(1.02, 0.9, radius);

  vec3 base = vec3(0.08, 0.14, 0.24);
  vec3 accent = vec3(0.35, 0.64, 1.0);

  float centerGlow = exp(-vDistance * 11.0);
  float depthLight = clamp(0.5 + vHeight * 6.0, 0.0, 1.0);
  float ring = smoothstep(0.85, 0.25, radius);

  vec3 color = mix(base, accent, centerGlow * 0.7 + ring * 0.25);
  color += accent * depthLight * 0.35;
  color += vec3(0.08, 0.13, 0.24) * (0.22 + uHover * 0.18);

  float alpha = edgeFade * 0.97;
  gl_FragColor = vec4(color, alpha);
}
