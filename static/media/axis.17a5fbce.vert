uniform mat4 uniTransfo;
uniform mat4 uniCamera;

attribute vec3 attPoint;
attribute vec3 attNormal;
attribute vec2 attUV;

varying vec2 varUV;
varying vec3 varPoint;
varying vec3 varNormal;

void main() {
    varUV = attUV;
    vec4 point = vec4( attPoint, 1.0 );
    varPoint = vec3(uniCamera * point);
    varNormal = mat3(uniCamera) * attNormal;
    gl_Position = uniTransfo * point;
}
