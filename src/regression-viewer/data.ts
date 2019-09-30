import Data from './data.yaml'

interface IPoint3D {
    y: number, x1: number, x2: number
}

class Plane {
    //  Y = c + a1.X1 + a2.X2
    private readonly a1: number
    private readonly a2: number
    private readonly c: number

    constructor(coeffs: [number, number, number]) {
        this.c = coeffs[0]
        this.a1 = coeffs[1]
        this.a2 = coeffs[2]
    }
}

export default class DataManager {
    private readonly points: IPoint3D[]
    private readonly planes: Plane[]
    private x1Min: number = 0
    private x1Max: number = 0
    private x2Min: number = 0
    private x2Max: number = 0
    private yMin: number = 0
    private yMax: number = 0

    constructor() {
        console.info("Data=", Data);
        const that = this
        if (Data.points.length > 0) {
            const point = Data.points[0]
            const y = point[0]
            const x1 = point[1]
            const x2 = point[2]
            this.x1Min = x1
            this.x1Max = x1
            this.x2Min = x2
            this.x2Max = x2
            this.yMin = y
            this.yMax = y
        }
        this.points = Data.points.map((p: [number, number, number]) => {
            const y = p[0]
            const x1 = p[1]
            const x2 = p[2]
            that.yMin = Math.min(that.yMin, y)
            that.yMax = Math.min(that.yMax, y)
            that.x1Min = Math.min(that.x1Min, x1)
            that.x1Max = Math.min(that.x1Max, x1)
            that.x2Min = Math.min(that.x2Min, x2)
            that.x2Max = Math.min(that.x2Max, x2)
            return { x1, x2, y }
        })
        this.planes = Data.planes.map((p: [number, number, number]) => ({
            c: p[0],
            a1: p[1],
            a2: p[2]
        }))
    }

    getCenter(): IPoint3D {
        return {
            y: 0.5 * (this.yMin + this.yMax),
            x1: 0.5 * (this.x1Min + this.x1Max),
            x2: 0.5 * (this.x2Min + this.x2Max)
        }
    }

    getRadius(): number {
        return Math.max(
            this.yMax - this.yMin,
            Math.max(
                this.x1Max - this.x1Min,
                this.x2Max - this.x2Min
            )
        ) * 0.5
    }

    get pointsCount() { return this.points.length }

    get planesCount() { return this.planes.length }

    getPoint(index: number): IPoint3D {
        return this.points[index]
    }

    getPlane(index: number): Plane {
        return this.planes[index]
    }
}
