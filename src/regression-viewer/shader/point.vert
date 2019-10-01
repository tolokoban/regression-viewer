uniform mat4 uniTransfo;
uniform float uniPointSize;

attribute vec3 attPoint;

void main() {
  // Une simple multiplication permet d'appliquer
  // la perspective.
  gl_Position = uniTransfo * vec4( attPoint, 1.0 );
  gl_PointSize = 16.0;  // uniPointSize / (1.0 + abs(gl_Position.z));
}
