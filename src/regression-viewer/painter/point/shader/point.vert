uniform mat4 uniTransfo;
uniform float uniPointSize;

attribute vec3 attPoint;

void main() {
  gl_Position = uniTransfo * vec4( attPoint, 1.0 );
  gl_PointSize = max(2.0, uniPointSize / gl_Position.w);
}
