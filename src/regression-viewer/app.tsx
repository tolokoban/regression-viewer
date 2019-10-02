import React from "react"
import Resize from '../tfw/webgl/resize'
import { M4 } from '../tfw/webgl/math'
import Storage from '../tfw/storage'
import Gesture from '../tfw/gesture'
import Checkbox from '../tfw/view/checkbox'
import Data from './data'
import { IEvent, IWheelEvent } from '../tfw/gesture/types'
import PointPainter from './painter/point'
import { IPointPainter } from './painter/point/types'
import AxisPainter from './painter/axis'
import { IAxisPainter } from './painter/axis/types'
import PlanePainter from './painter/plane'
import { IPlanePainter } from './painter/plane/types'

import "./app.css"

interface IAppState {
    planes: number[]
}

export default class App extends React.Component<{}, IAppState> {
    private readonly refCanvas: React.RefObject<HTMLCanvasElement> = React.createRef()
    private gl: WebGLRenderingContext|null = null
    private readonly camera: Float32Array
    private readonly perspective: Float32Array
    private readonly transfo: Float32Array
    private latitude: number = 0
    private longitude: number = 0
    private distance: number = 0
    private saveLat: number = 0
    private saveLng: number = 0
    private saveDis: number = 0
    private readonly data: Data
    private pointPainter: IPointPainter|null = null
    private axisPainter: IAxisPainter|null = null
    private planePainter: IPlanePainter|null = null
    private readonly allPlanes: number[]

    constructor(props: {}) {
        super(props)
        this.data = new Data()
        this.perspective = new Float32Array(16)
        this.transfo = new Float32Array(16)
        this.camera = new Float32Array(16)
        this.distance = this.data.getRadius() * 3

        const planes: number[] = []
        for (let i = 0 ; i < this.data.planesCount ; i++) {
            planes.push(i)
        }
        this.state = {
            planes: Storage.local.get("regression-viewer/app/planes", [0, 7, 18])
        }
        this.allPlanes = planes.slice()
    }

    async componentDidMount() {
        try {
            const canvas = this.refCanvas.current
            if (!canvas) throw Error("No canvas!")
            this.attachGestures(canvas)
            const gl = canvas.getContext("webgl", {})
            if (!gl) throw Error("No WebGL context!")
            this.gl = gl

            this.pointPainter = await PointPainter.create(gl, this.data)
            this.axisPainter = await AxisPainter.create(gl, this.data)
            this.planePainter = await PlanePainter.create(gl, this.data)

            requestAnimationFrame(this.paint)
        }
        catch (ex) {
            console.error("Unable to init WebGL!\n", ex)
        }
    }

    private attachGestures(canvas: HTMLCanvasElement) {
        Gesture(canvas).on({
            down: this.handleDown,
            pan: this.handlePan,
            wheel: this.handleWheel
        })
    }

    private handleWheel = (evt: IWheelEvent) => {
        const radius = this.data.getRadius()
        const dir = 0.06 * (evt.deltaY > 0 ? +1 : -1)
        this.distance = clamp(this.distance + dir * radius, radius / 2, radius * 4)
    }

    private handleDown = () => {
        this.saveLat = this.latitude
        this.saveLng = this.longitude
        this.saveDis = this.distance
    }

    private handlePan = (evt: IEvent) => {
        const canvas = evt.target as HTMLCanvasElement
        if (!canvas) return
        const x = (evt.x - evt.startX) / canvas.clientWidth
        const y = (evt.y - evt.startY) / canvas.clientHeight

        if (evt.buttons === 1) {
            this.longitude = this.saveLng - Math.PI * x
            this.latitude = clamp(this.saveLat + Math.PI * y, -1.5, 1.5)
        }
        else {
            const radius = this.data.getRadius()
            this.distance = clamp(this.saveDis + 4 * radius * y, radius / 2, radius * 4)
        }
    }

    private paint = (time: number) => {
        requestAnimationFrame(this.paint)

        const { gl, data } = this
        if (!gl) return
        const { pointPainter, axisPainter, planePainter } = this
        if (!pointPainter || !axisPainter || !planePainter) return

        Resize(gl)
        gl.clearColor( 1, 1, 1, 1 );
        gl.clearDepth( 1 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
        const radius = data.getRadius()

        M4.perspective(
            Math.PI / 2, aspect,
            radius * 0.001, radius * 10 + this.distance,
            this.perspective)
        const center = data.getCenter()
        M4.cameraPolar(
            center.x1, center.x2, center.y,
            this.distance,
            this.latitude,
            this.longitude + Math.PI / 2,
            this.camera
        )
        M4.mul(this.perspective, this.camera, this.transfo)

        // Painting Dots.
        pointPainter.paint(this.transfo)

        // Painting Axis.
        axisPainter.paint(this.transfo, this.camera)

        // Painting Planes.
        planePainter.paint(this.transfo, this.camera, this.state.planes)
    }

    handlePlaneClick = (planeIndex: number, visible: boolean) => {
        const planes = this.state.planes.filter((idx: number) => idx !== planeIndex)
        if (visible) {
            planes.push(planeIndex)
            planes.sort()
        }
        this.setState({ planes })
        Storage.local.set("regression-viewer/app/planes", planes)
    }

    render() {
        const { planes } = this.state

        return (<div className="regressionViewer-App thm-bg0">
            <nav className="thm-bg2 thm-ele-nav">{
                this.allPlanes.map((idx: number) => (
                    <Checkbox
                        key={`Plane-${idx}`}
                        wide={true}
                        label={`Plane #${idx + 1}`}
                        value={planes.indexOf(idx) !== -1}
                        onChange={(v: boolean) => this.handlePlaneClick(idx, v)}/>
                ))
            }</nav>
            <canvas ref={this.refCanvas}></canvas>
        </div>)
    }
}


function clamp(value: number, min: number, max: number): number {
    if (value < min) return min
    if (value > max) return max
    return value
}
