import Color from './color'

describe("tfw/color", () => {
    describe("Color.ramp()", () => {
        describe("Three colors and ten steps", () => {
            const RAMP  = [
                Color.fromArrayRGB([0,1,0]),
                Color.fromArrayRGB([1,1,0]),
                Color.fromArrayRGB([1,0,0])
            ]

            function check(alpha: number, expected: [number, number, number]) {
                describe(`alpha=${alpha}`, () => {
                    const color = Color.ramp(RAMP, alpha)
                    it('should match RED', () => {
                        expect(color.R).toBeCloseTo(expected[0], 6)
                    })
                    it('should match GREEN', () => {
                        expect(color.G).toBeCloseTo(expected[1], 6)
                    })
                    it('should match BLUE', () => {
                        expect(color.B).toBeCloseTo(expected[2], 6)
                    })
                })
            }

            check(0, RAMP[0].toArrayRGB())
            check(0.1, [0.2,1,0])
            check(0.2, [0.4,1,0])
            check(0.3, [0.6,1,0])
            check(0.4, [0.8,1,0])
            check(0.5, RAMP[1].toArrayRGB())
            check(0.6, [1,0.8,0])
            check(0.7, [1,0.6,0])
            check(0.8, [1,0.4,0])
            check(0.9, [1,0.2,0])
            check(1, RAMP[2].toArrayRGB())
        })
    })
})
