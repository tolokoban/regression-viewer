precision mediump float;

uniform vec3 uniColor;

void main() {
    vec2 pos = gl_PointCoord.xy - vec2(.5, .5);
    float radius = 2.0 * length(pos);
    if (radius > 1.0) {
        discard;
    }

    vec3 color = uniColor * mix(1.0, 0.5, radius);
    gl_FragColor = vec4(color, 1.0);
}
