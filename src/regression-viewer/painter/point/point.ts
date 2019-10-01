import VertPoint from './shader/point.vert'
import FragPoint from './shader/point.frag'

import Program, { IShaders } from '../../../tfw/webgl/program'
import Util from '../../../tfw/util'
import Data from '../../data'

export interface IPointPainter {
    paint: (transfo: Float32Array) => void
}

class PointPainter {
    private readonly prg: Program
    private readonly buff: WebGLBuffer
    private readonly pointsCount: number

    constructor(private gl: WebGLRenderingContext,
                shaders: IShaders,
                data: Data) {
        this.prg = new Program(gl, shaders)
        this.buff = this.initBuffer(data)
        this.pointsCount = data.pointsCount
    }

    paint(transfo: Float32Array) {
        const { gl, prg, buff, pointsCount } = this

        gl.enable( gl.DEPTH_TEST );
        gl.depthFunc( gl.LESS );

        const minSize = Math.min(gl.canvas.clientWidth, gl.canvas.clientHeight)

        prg.use()
        prg.$uniTransfo = transfo
        prg.$uniPointSize = minSize * 0.06
        prg.$uniColor = new Float32Array([0.2, 0.7, 1.0])

        prg.bindAttribs(buff, "attPoint")

        gl.bindBuffer( gl.ARRAY_BUFFER, buff )
        gl.drawArrays( gl.POINTS, 0, pointsCount )

    }

    private initBuffer(data: Data): WebGLBuffer {
        const { gl } = this
        if (!gl) throw Error("No WebGL context!")
        const buffer = gl.createBuffer()
        if (!buffer) {
            throw Error("Unable to create a WebGL buffer!")
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer );
        gl.bufferData(gl.ARRAY_BUFFER, this.createPointVertices(data), gl.STATIC_DRAW );
        return buffer
    }

    /**
     * Create a buffer to hold the points in the scene.
     * Each point is represented by 3 float attributes:
     * x1, x2 and y.
     */
    private createPointVertices(data: Data): Float32Array {
        const vertices = new Float32Array(data.pointsCount * 3)
        let idxDst = 0
        for (let idxSrc = 0 ; idxSrc < data.pointsCount ; idxSrc++) {
            const point = data.getPoint(idxSrc)
            vertices[idxDst++] = point.x1
            vertices[idxDst++] = point.x2
            vertices[idxDst++] = point.y
        }
        return vertices
    }


}


export default {
    async create(gl: WebGLRenderingContext, data: Data): Promise<IPointPainter> {
        const shaders: IShaders = {
            vert: await Util.loadTextFromURL(VertPoint),
            frag: await Util.loadTextFromURL(FragPoint)
        }

        return new PointPainter(gl, shaders, data)
    }
}
