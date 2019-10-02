export interface IPlanePainter {
    paint: (transfo: Float32Array, camera: Float32Array, planeIndexes: number[]) => void
}
