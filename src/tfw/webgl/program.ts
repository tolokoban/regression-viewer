const BPE = (new Float32Array()).BYTES_PER_ELEMENT;

export interface IShaders { vert: string, frag: string }

interface IAttrib extends WebGLActiveInfo {
    typeName: string,
    length: number,
    location: number
}
interface IAttribsDic {
    [key: string]: IAttrib
}
interface IUniformsDic {
    [key: string]: WebGLUniformLocation
}

/**
 * Creating  a  WebGL  program  for shaders  is  painful.  This  class
 * simplifies the process.
 *
 * @class Program
 *
 * Object properties starting with `$` are WebGL uniforms or attributes.
 * Uniforms behave as expected: you can read/write a value.
 * Attributes when read, return the location. And when written, enable/disabled
 * this attribute. So you read integers and writte booleans.
 *
 * @param gl - WebGL context.
 * @param codes  - Object  with two  mandatory attributes:  `vert` for
 * vertex shader and `frag` for fragment shader.
 * @param  includes  -  (optional)  If  defined,  the  `#include  foo`
 * directives  of  shaders   will  be  replaced  by   the  content  of
 * `includes.foo`.
 */
export default class Program {
    readonly gl: WebGLRenderingContext
    readonly BPE: number
    readonly program: WebGLProgram
    private _typesNamesLookup: {[key: number]: string}
    readonly attribs: IAttribsDic
    readonly uniforms: IUniformsDic

    constructor(gl: WebGLRenderingContext,
        codes: IShaders,
        includes: { [key: string]: string } = {}) {
        if (typeof codes.vert !== 'string') {
            throw Error('[webgl.program] Missing attribute `vert` in argument `codes`!');
        }
        if (typeof codes.frag !== 'string') {
            throw Error('[webgl.program] Missing attribute `frag` in argument `codes`!');
        }

        codes = parseIncludes(codes, includes);

        this.gl = gl;
        Object.freeze(this.gl);
        this.BPE = BPE;
        Object.freeze(this.BPE);

        this._typesNamesLookup = getTypesNamesLookup(gl);

        const shaderProgram = gl.createProgram();
        if (!shaderProgram) {
            throw Error('Unable to create WebGLProgram!')
        }
        this.program = shaderProgram;
        const vertShader = getVertexShader(gl, codes.vert)
        gl.attachShader(shaderProgram, vertShader)
        const fragShader = getFragmentShader(gl, codes.frag)
        gl.attachShader(shaderProgram, fragShader)
        gl.linkProgram(shaderProgram)


        this.use = function() {
            gl.useProgram(shaderProgram);
        };

        this.attribs = this.createAttributes();
        this.uniforms = this.createUniforms();
    }

    private createAttributes(): IAttribsDic {
        const { gl, program } = this
        const attribs: IAttribsDic = {};
        const attribsCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let index = 0; index < attribsCount; index++) {
            const item: IAttrib | null = gl.getActiveAttrib(program, index) as IAttrib;
            if (!item) continue
            item.typeName = this.getTypeName(item.type);
            item.length = this.getSize(gl, item);
            item.location = gl.getAttribLocation(program, item.name);
            attribs[item.name] = item;
            Object.defineProperty(this, '$' + item.name, {
                value: item.location,
                writable: false,
                enumerable: true,
                configurable: false
            });
        }
        return attribs
    }

    private getSize(gl: WebGLRenderingContext, item: IAttrib): number {
        switch (item.type) {
            case gl.FLOAT_VEC4:
                return 4;
            case gl.FLOAT_VEC3:
                return 3;
            case gl.FLOAT_VEC2:
                return 2;
            case gl.FLOAT:
                return 1;
            default:
                throw Error("[webgl.program:getSize] I don't know the size of the attribute '" + item.name +
                    "' because I don't know the type " + this.getTypeName(item.type) + "!");
        }
    }

    use() {
        this.gl.useProgram(this.program)
    }

    getTypeName(typeId: number) {
        return this._typesNamesLookup[typeId];
    }

    bindAttribs(buffer: WebGLBuffer, ...names: string[]) {
        const that = this
        const { gl } = this
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

        let totalSize = 0
        for (const name of names) {
            const attrib = that.attribs[name]
            if (!attrib) {
                throw Error("Cannot find attribute \"" + name + "\"!\n" +
                    "It may be not active because unused in the shader.\n" +
                    "Available attributes are: " + Object.keys(that.attribs).map(function(name) {
                        return '"' + name + '"';
                    }).join(", ") + ` (${that.attribs.length})`)
            }
            totalSize += (attrib.size * attrib.length) * BPE
        }

        let offset = 0;
        for (const name of names) {
            const attrib = that.attribs[name];
            gl.enableVertexAttribArray(attrib.location)
            gl.vertexAttribPointer(
                attrib.location,
                attrib.size * attrib.length,
                gl.FLOAT,
                false, // No normalisation.
                totalSize,
                offset
            )
            offset += (attrib.size * attrib.length) * BPE
        }
    }

    private createUniforms(): IUniformsDic {
        const { gl, program } = this
        const uniforms: IUniformsDic = {};
        const uniformsCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let index = 0; index < uniformsCount; index++) {
            const item = gl.getActiveUniform(program, index);
            if (!item) continue
            const location = gl.getUniformLocation(program, item.name)
            if (!location) continue
            uniforms[item.name] = location
            Object.defineProperty(this, '$' + item.name, {
                set: this.createUniformSetter(item, uniforms[item.name], this._typesNamesLookup),
                get: this.createUniformGetter(item),
                enumerable: true,
                configurable: false
            });
        }

        return uniforms
    }

    private createUniformSetter(item: WebGLActiveInfo,
                                nameGL: WebGLUniformLocation,
                                lookup: {[key: number]: string}) {
        const { gl } = this
        const nameJS = '_$' + item.name;

        switch (item.type) {
            case gl.BYTE:
            case gl.UNSIGNED_BYTE:
            case gl.SHORT:
            case gl.UNSIGNED_SHORT:
            case gl.INT:
            case gl.UNSIGNED_INT:
            case gl.SAMPLER_2D: // For textures, we specify the texture unit.
                if (item.size === 1) {
                    return function(this: {[key: string]: number}, v: number) {
                        gl.uniform1i(nameGL, v);
                        this[nameJS] = v;
                    };
                } else {
                    return function(this: {[key: string]: Int32List}, v: Int32List) {
                        gl.uniform1iv(nameGL, v);
                        this[nameJS] = v;
                    };
                }
            case gl.FLOAT:
                if (item.size === 1) {
                    return function(this: {[key: string]: number}, v: number) {
                        gl.uniform1f(nameGL, v);
                        this[nameJS] = v;
                    };
                } else {
                    return function(this: {[key: string]: Float32List}, v: Float32List) {
                        gl.uniform1fv(nameGL, v);
                        this[nameJS] = v;
                    };
                }
            case gl.FLOAT_VEC2:
                if (item.size === 1) {
                    return function(this: {[key: string]: Float32List}, v: Float32List) {
                        gl.uniform2fv(nameGL, v);
                        this[nameJS] = v;
                    };
                } else {
                    throw Error(
                        "[webgl.program.createWriter] Don't know how to deal arrays of FLOAT_VEC2 in uniform `" +
                        item.name + "'!'"
                    );
                }
            case gl.FLOAT_VEC3:
                if (item.size === 1) {
                    return function(this: {[key: string]: Float32List}, v: Float32List) {
                        gl.uniform3fv(nameGL, v);
                        this[nameJS] = v;
                    };
                } else {
                    throw Error(
                        "[webgl.program.createWriter] Don't know how to deal arrays of FLOAT_VEC3 in uniform `" +
                        item.name + "'!'"
                    );
                }
            case gl.FLOAT_VEC4:
                if (item.size === 1) {
                    return function(this: {[key: string]: Float32List}, v: Float32List) {
                        gl.uniform4fv(nameGL, v);
                        this[nameJS] = v;
                    };
                } else {
                    throw Error(
                        "[webgl.program.createWriter] Don't know how to deal arrays of FLOAT_VEC4 in uniform `" +
                        item.name + "'!'"
                    );
                }
            case gl.FLOAT_MAT3:
                if (item.size === 1) {
                    return function(this: {[key: string]: Float32List}, v: Float32List) {
                        gl.uniformMatrix3fv(nameGL, false, v);
                        this[nameJS] = v;
                    };
                } else {
                    throw Error(
                        "[webgl.program.createWriter] Don't know how to deal arrays of FLOAT_MAT3 in uniform `" +
                        item.name + "'!'"
                    );
                }
            case gl.FLOAT_MAT4:
                if (item.size === 1) {
                    return function(this: {[key: string]: Float32List}, v: Float32List) {
                        gl.uniformMatrix4fv(nameGL, false, v);
                        this[nameJS] = v;
                    };
                } else {
                    throw Error(
                        "[webgl.program.createWriter] Don't know how to deal arrays of FLOAT_MAT4 in uniform `" +
                        item.name + "'!'"
                    );
                }
            default:
                throw Error(
                    "[webgl.program.createWriter] Don't know how to deal with uniform `" +
                    item.name + "` of type " + lookup[item.type] + "!"
                );
        }
    }

    private createUniformGetter(item: WebGLActiveInfo) {
        var name = '_$' + item.name;
        return function(this: {[key: string]: any}) {
            return this[name];
        };
    }

}

/**
 * This is a preprocessor for shaders.
 * Directives  `#include`  will be  replaced  by  the content  of  the
 * correspondent attribute in `includes`.
 */
function parseIncludes(codes: IShaders, includes: { [key: string]: string }): IShaders {
    return {
        vert: parseInclude(codes.vert, includes),
        frag: parseInclude(codes.frag, includes)
    }
}

function parseInclude(code: string, includes: { [key: string]: string }): string {
    return code.split('\n').map(function(line) {
        if (line.trim().substr(0, 8) !== '#include') return line;
        const pos = line.indexOf('#include') + 8;
        let includeName = line.substr(pos).trim();
        // We accept all this systaxes:
        // #include foo
        // #include 'foo'
        // #include <foo>
        // #include "foo"
        if ("'<\"".indexOf(includeName.charAt(0)) > -1) {
            includeName = includeName.substr(1, includeName.length - 2);
        }
        const snippet = includes[includeName];
        if (typeof snippet !== 'string') {
            console.error("Include <" + includeName + "> not found in ", includes);
            throw Error("Include not found in shader: " + includeName);
        }
        return snippet;
    }).join("\n");
}




function getShader(type: number, gl: WebGLRenderingContext, code: string): WebGLShader {
    if (type !== gl.VERTEX_SHADER && type !== gl.FRAGMENT_SHADER) {
        throw Error('Type must be VERTEX_SHADER or FRAGMENT_SHADER!')
    }
    const shader = gl.createShader(type);
    if (!shader) {
        throw Error(`Unable to create a ${type === gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT"} shader!`)
    }
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(code);
        console.error("An error occurred compiling the shader: " + gl.getShaderInfoLog(shader));
        throw Error(`Unable to create a ${type === gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT"} shader!`)
    }

    return shader;
}

function getFragmentShader(gl: WebGLRenderingContext, code: string) {
    return getShader(gl.FRAGMENT_SHADER, gl, code);
}

function getVertexShader(gl: WebGLRenderingContext, code: string) {
    return getShader(gl.VERTEX_SHADER, gl, code);
}

function getTypesNamesLookup(gl: WebGLRenderingContext): {} {
    var lookup: {[key: number]: string} = {}

    for (let k in gl) {
        if (k !== k.toUpperCase()) continue
        const v = (gl as {[key: string]: any})[k]
        if (typeof v === 'number') {
            lookup[v] = k
        }
    }
    return lookup
}
