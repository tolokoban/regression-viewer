import React from "react"
import Data from './data'
import Util from '../tfw/util'
import Program from '../tfw/webgl/program'
import Resize from '../tfw/webgl/resize'
import { M4 } from '../tfw/webgl/math'

import VertPoint from './shader/point.vert'
import FragPoint from './shader/point.frag'

import "./app.css"

const BPE = (new Float32Array()).BYTES_PER_ELEMENT

interface IPrograms {
    point: Program
}
interface IShaders {
    point: { vert: string, frag: string }
}

export default class App extends React.Component<{}, {}> {
    private readonly refCanvas: React.RefObject<HTMLCanvasElement> = React.createRef()
    private gl: WebGLRenderingContext|null = null
    private buffPoint: WebGLBuffer = 0
    private readonly camera: Float32Array
    private readonly perspective: Float32Array
    private readonly transfo: Float32Array
    private prg: IPrograms|null = null
    private latitude: number = 0
    private longitude: number = 0
    private distance: number = 0
    private readonly data: Data

    constructor(props: {}) {
        super(props)
        this.data = new Data()
        this.perspective = new Float32Array(16)
        this.transfo = new Float32Array(16)
        this.camera = new Float32Array(16)
        this.distance = this.data.getRadius() * 2
    }

    async componentDidMount() {
        try {
            const canvas = this.refCanvas.current
            if (!canvas) throw Error("No canvas!")
            const gl = canvas.getContext("webgl", {})
            if (!gl) throw Error("No WebGL context!")
            this.gl = gl

            const shaders = await this.loadShaders()
            console.info("shaders=", shaders);
            this.initWebGL(shaders)
            requestAnimationFrame(this.paint)
            this.distance = this.data.getRadius() * 2
        }
        catch (ex) {
            console.error("Unable to init WebGL!\n", ex)
        }
    }

    private async loadShaders() {
        return {
            point: {
                vert: await Util.loadTextFromURL(VertPoint),
                frag: await Util.loadTextFromURL(FragPoint)
            }
        }
    }

    private paint = (time: number) => {
        const { gl, prg } = this
        if (!gl || !prg) return

        Resize(gl)
        gl.enable( gl.DEPTH_TEST );
        gl.clearColor( 0.1, 0.1, 0.1, 1 );
        gl.clearDepth( 1 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        gl.depthFunc( gl.LESS );

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
        const radius = this.data.getRadius()
        M4.perspective(
            Math.PI / 2, aspect,
            radius * 0.01, radius * 2 + this.distance,
            this.perspective)
        const center = this.data.getCenter()
        M4.cameraPolar(
            center.x1, center.x2, center.y,
            this.distance, this.latitude, this.longitude
        )
        M4.mul(this.perspective, this.camera, this.transfo)

        prg.point.use()
        prg.point.$uniTransfo = this.transfo
        prg.point.$uniPointSize = 100
        prg.point.$uniColor = new Float32Array([0.2, 0.7, 1.0])

        const block = 3 * BPE;

        gl.enableVertexAttribArray( prg.point.$attPoint );
        gl.vertexAttribPointer( prg.point.$attPoint, 3, gl.FLOAT, false, block, 0 * BPE );

        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffPoint );
        gl.drawArrays( gl.POINTS, 0, this.data.pointsCount );

        requestAnimationFrame(this.paint)
    }

    private initWebGL(shaders: IShaders) {
        try {
            this.initBuffers()
            this.prg = this.initShaders(shaders)
        }
        catch (ex) {
            throw ex
        }
    }

    private initShaders(shaders: IShaders): IPrograms {
        const { gl } = this
        if (!gl) throw Error("No WebGL context!")
        const prgPoint = new Program(gl, {
            vert: shaders.point.vert, frag: shaders.point.frag
        })

        return {
            point: prgPoint
        }
    }

    private initBuffers() {
        const { gl } = this
        if (!gl) throw Error("No WebGL context!")
        const buffer = gl.createBuffer()
        if (!buffer) {
            throw Error("Unable to create a WebGL buffer!")
        }
        this.buffPoint = buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer );
        gl.bufferData(gl.ARRAY_BUFFER, this.createPointVertices(), gl.STATIC_DRAW );
    }

    private createPointVertices(): Float32Array {
        const vertices = new Float32Array(this.data.pointsCount * 3)
        let idxDst = 0
        for (let idxSrc = 0 ; idxSrc < this.data.pointsCount ; idxSrc++) {
            const point = this.data.getPoint(idxSrc)
            vertices[idxDst++] = point.x1
            vertices[idxDst++] = point.x2
            vertices[idxDst++] = point.y
        }
        return vertices
    }

    render() {
        return (<div className="regressionViewer-App thm-bg0">
            <canvas ref={this.refCanvas}></canvas>
        </div>)
    }
}
