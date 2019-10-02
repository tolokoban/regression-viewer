precision mediump float;

uniform vec3 uniColor;

varying vec3 varPoint;
varying vec3 varNormal;

void main() {
    float d = dot(normalize(varPoint), normalize(varNormal));
    float light = abs(d) * .6 + 0.5;

    gl_FragColor = vec4(uniColor * light, 1.0);
}
