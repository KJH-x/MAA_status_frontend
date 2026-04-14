uniform float uTime;
uniform vec2 uCursor;
uniform float uHover;
uniform float uFalloff;
uniform float uAmplitude;
uniform float uSinkStrength;
uniform float uRippleStrength;
uniform float uCursorVelocity;

varying float vHeight;
varying float vDistance;
varying vec2 vUv;

void main() {
  vUv = uv;

  // Distance from each vertex to the current cursor UV point.
  float d = distance(uv, uCursor);
  vDistance = d;

  // Positive lift near cursor (Gaussian falloff).
  float lift = exp(-d * d * uFalloff) * uAmplitude * uHover;

  // Broad, subtle negative displacement for the outer area.
  float sink = exp(-d * d * (uFalloff * 0.25)) * uSinkStrength * uHover;

  // Optional ripple, stronger while cursor velocity is high.
  float rippleMask = exp(-d * 8.0) * uHover;
  float ripple = sin(d * 46.0 - uTime * 6.5) * rippleMask * uRippleStrength * clamp(uCursorVelocity * 0.08, 0.0, 1.0);

  float displacement = lift - sink + ripple;
  vHeight = displacement;

  vec3 displaced = position;
  displaced.z += displacement;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
