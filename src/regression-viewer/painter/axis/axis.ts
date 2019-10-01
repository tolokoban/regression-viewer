import Vert from './shader/axis.vert'
import Frag from './shader/axis.frag'

import Program, { IShaders } from '../../../tfw/webgl/program'
import Texture from '../../../tfw/webgl/texture'
import Util from '../../../tfw/util'
import Data from '../../data'
import { IAxisPainter } from './types'

interface ITextures {
    x1: WebGLTexture,
    x2: WebGLTexture,
    y: WebGLTexture
}

const BACKGROUND = "#cde"

class AxisPainter {
    private readonly prg: Program
    private readonly buff: WebGLBuffer
    private readonly textures: ITextures

    constructor(private gl: WebGLRenderingContext,
        shaders: IShaders,
        data: Data) {
        this.prg = new Program(gl, shaders)
        this.buff = this.initBuffer(data)
        this.textures = this.createTextures()
    }

    paint(transfo: Float32Array, camera: Float32Array) {
        const { gl, prg, buff, textures } = this

        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.LESS)
        gl.cullFace(gl.BACK)
        gl.disable(gl.CULL_FACE)
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        prg.use()
        prg.$uniTransfo = transfo
        prg.$uniCamera = camera

        prg.bindAttribs(buff, "attPoint", "attNormal", "attUV")

        prg.$uniTexture = 0
        gl.activeTexture(gl.TEXTURE0);

        gl.bindTexture(gl.TEXTURE_2D, textures.x1);
        gl.bindBuffer(gl.ARRAY_BUFFER, buff)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        gl.bindTexture(gl.TEXTURE_2D, textures.y);
        gl.bindBuffer(gl.ARRAY_BUFFER, buff)
        gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4)

        gl.bindTexture(gl.TEXTURE_2D, textures.x2);
        gl.bindBuffer(gl.ARRAY_BUFFER, buff)
        gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4)
    }

    private createTextures(): ITextures {
        const { gl } = this

        const canvas1 = Texture.createCanvas(1024, 1024)
        const ctx1 = canvas1.getContext("2d")
        if (!ctx1) {
            throw Error("Unable to create a 2D context on a canvas!")
        }
        ctx1.fillStyle = BACKGROUND
        ctx1.fillRect(0, 0, 1024, 1024)
        ctx1.strokeStyle = "#224"
        ctx1.lineWidth = 10
        ctx1.beginPath()
        ctx1.moveTo(0, 1023);
        ctx1.lineTo(1000, 1023);
        ctx1.lineTo(970, 993);
        ctx1.moveTo(0, 1023);
        ctx1.lineTo(0, 23);
        ctx1.lineTo(30, 53);
        ctx1.stroke()
        ctx1.font = "80px sans-serif"
        ctx1.fillStyle = "#224"
        ctx1.fillText("Y", 40, 120);
        const tex1 = Texture.createFromCanvas(gl, canvas1)

        const canvas2 = Texture.createCanvas(1024, 1024)
        const ctx2 = canvas2.getContext("2d")
        if (!ctx2) {
            throw Error("Unable to create a 2D context on a canvas!")
        }
        ctx2.fillStyle = BACKGROUND
        ctx2.fillRect(0, 0, 1024, 1024)
        ctx2.strokeStyle = "#226"
        ctx2.lineWidth = 10
        ctx2.beginPath()
        ctx2.moveTo(0, 1023);
        ctx2.lineTo(1000, 1023);
        ctx2.lineTo(970, 993);
        ctx2.moveTo(0, 1023);
        ctx2.lineTo(0, 23);
        ctx2.lineTo(30, 53);
        ctx2.stroke()
        ctx2.font = "80px sans-serif"
        ctx2.fillStyle = "#226"
        ctx2.fillText("X1", 40, 120);
        const tex2 = Texture.createFromCanvas(gl, canvas2)

        const canvas3 = Texture.createCanvas(1024, 1024)
        const ctx3 = canvas3.getContext("2d")
        if (!ctx3) {
            throw Error("Unable to create a 2D context on a canvas!")
        }
        ctx3.fillStyle = BACKGROUND
        ctx3.fillRect(0, 0, 1024, 1024)
        ctx3.strokeStyle = "#224"
        ctx3.lineWidth = 10
        ctx3.beginPath()
        ctx3.moveTo(0, 1023);
        ctx3.lineTo(1000, 1023);
        ctx3.lineTo(970, 993);
        ctx3.moveTo(0, 1023);
        ctx3.lineTo(0, 23);
        ctx3.lineTo(30, 53);
        ctx3.stroke()
        ctx3.font = "80px sans-serif"
        ctx3.fillStyle = "#226"
        ctx3.fillText("X2", 40, 120);
        const tex3 = Texture.createFromCanvas(gl, canvas3)

        return {
            x1: tex1,
            x2: tex2,
            y: tex3
        }
    }

    private initBuffer(data: Data): WebGLBuffer {
        const { gl } = this
        if (!gl) throw Error("No WebGL context!")
        const buffer = gl.createBuffer()
        if (!buffer) {
            throw Error("Unable to create a WebGL buffer!")
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.createAxisVertices(data), gl.STATIC_DRAW);
        return buffer
    }

    /**
     * Create a buffer to hold the points in the scene.
     * Each point is represented by 3 float attributes:
     * x1, x2 and y.
     */
    private createAxisVertices(data: Data): Float32Array {
        const center = data.getCenter()
        const radius = data.getRadius() * 1.02
        const x1 = center.x1 - radius
        const X1 = center.x1 + radius
        const x2 = center.x2 - radius
        const X2 = center.x2 + radius
        const y = center.y - radius
        const Y = center.y + radius

        const vertices = new Float32Array([
            x1, X2, y, 1, 0, 0, 1, 1,
            x1, X2, Y, 1, 0, 0, 1, 0,
            x1, x2, y, 1, 0, 0, 0, 1,
            x1, x2, Y, 1, 0, 0, 0, 0,

            X1, x2, y, 0, 0, 1, 1, 1,
            X1, X2, y, 0, 0, 1, 1, 0,
            x1, x2, y, 0, 0, 1, 0, 1,
            x1, X2, y, 0, 0, 1, 0, 0,

            x1, x2, Y, 0, 1, 0, 1, 1,
            X1, x2, Y, 0, 1, 0, 1, 0,
            x1, x2, y, 0, 1, 0, 0, 1,
            X1, x2, y, 0, 1, 0, 0, 0
        ])
        return vertices
    }


}


export default {
    async create(gl: WebGLRenderingContext, data: Data): Promise<IAxisPainter> {
        const shaders: IShaders = {
            vert: await Util.loadTextFromURL(Vert),
            frag: await Util.loadTextFromURL(Frag)
        }

        return new AxisPainter(gl, shaders, data)
    }
}
