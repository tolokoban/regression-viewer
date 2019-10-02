import Vert from './shader/plane.vert'
import Frag from './shader/plane.frag'

import Program, { IShaders } from '../../../tfw/webgl/program'
import { V3 } from '../../../tfw/webgl/math'
import Color from '../../../tfw/color'
import Util from '../../../tfw/util'
import Data from '../../data'
import { IPlanePainter } from './types'

const RAMP = [
    Color.fromArrayRGB([0,1,0]),
    Color.fromArrayRGB([1,1,0]),
    Color.fromArrayRGB([1,0,0])
]

class AxisPainter {
    private readonly prg: Program
    private readonly buff: WebGLBuffer

    constructor(private gl: WebGLRenderingContext,
        shaders: IShaders,
        data: Data) {
        this.prg = new Program(gl, shaders)
        this.buff = this.initBuffer(data)
    }

    paint(transfo: Float32Array, camera: Float32Array, planeIndexes: number[]) {
        const { gl, prg, buff } = this

        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.LESS)
        gl.cullFace(gl.BACK)
        gl.disable(gl.CULL_FACE)
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        prg.use()
        prg.$uniTransfo = transfo
        prg.$uniCamera = camera
        prg.bindAttribs(buff, "attPoint", "attNormal")

        planeIndexes.forEach((planeIdx: number, index: number) => {
            console.info("planeIdx, planeIndexes=", planeIdx, planeIndexes);
            const color = planeIndexes.length < 2 ?
                RAMP[0] :
                Color.ramp(RAMP, index / (planeIndexes.length - 1))
            console.log(color.stringify())
            prg.$uniColor = new Float32Array([color.R, color.G, color.B])
            gl.bindBuffer(gl.ARRAY_BUFFER, buff)
            gl.drawArrays(gl.TRIANGLE_STRIP, 4 * planeIdx, 4)
        })
    }

    private initBuffer(data: Data): WebGLBuffer {
        const { gl } = this
        if (!gl) throw Error("No WebGL context!")
        const buffer = gl.createBuffer()
        if (!buffer) {
            throw Error("Unable to create a WebGL buffer!")
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.createPlaneVertices(data), gl.STATIC_DRAW);
        return buffer
    }

    /**
     * Create a buffer to hold the points in the scene.
     * Each point is represented by 3 float attributes:
     * x1, x2 and y.
     */
    private createPlaneVertices(data: Data): Float32Array {
        const vertices: number[] = []
        const x1 = data.x1Min
        const X1 = data.x1Max
        const x2 = data.x2Min
        const X2 = data.x2Max

        const u = new Float32Array(3)
        const v = new Float32Array(3)
        const n = new Float32Array(3)

        for (let planeIndex = 0 ; planeIndex < data.planesCount ; planeIndex++) {
            const plane = data.getPlane(planeIndex)
            console.info("plane=", plane);
            // A, B, C and D are he corners of the plane.
            const ay = plane.getY(X1, x2)
            const by = plane.getY(X1, X2)
            const cy = plane.getY(x1, x2)
            const dy = plane.getY(x1, X2)
            // Let's compute the normal.
            u[0] = X1 - x1
            u[1] = 0
            u[2] = 0
            v[0] = 0
            v[1] = X2 - x2
            v[2] = 0
            V3.cross(u, v, n)
            V3.normalize(n, n)
            // Add 4 vertices with attributes position and normal.
            vertices.push(
                X1, x2, ay, n[0], n[1], n[2],
                X1, X2, by, n[0], n[1], n[2],
                x1, x2, cy, n[0], n[1], n[2],
                x1, X2, dy, n[0], n[1], n[2]
            )
        }
        return new Float32Array(vertices)
    }
}


export default {
    async create(gl: WebGLRenderingContext, data: Data): Promise<IPlanePainter> {
        const shaders: IShaders = {
            vert: await Util.loadTextFromURL(Vert),
            frag: await Util.loadTextFromURL(Frag)
        }

        return new AxisPainter(gl, shaders, data)
    }
}
