precision mediump float;

uniform sampler2D uniTexture;

varying vec2 varUV;
varying vec3 varPoint;
varying vec3 varNormal;

void main() {
    vec3 color = texture2D( uniTexture, varUV ).rgb;
    float d = dot(normalize(varPoint), normalize(varNormal));
    float light = abs(d) * .6 + 0.5;

    if (!gl_FrontFacing) {
        float x = mod(gl_FragCoord.x, 2.0);
        float y = mod(gl_FragCoord.y, 2.0);
        if (x > 0.9 || y > 0.9) discard;
    }

    gl_FragColor = vec4(color * light, 1.0);
}
