export default { createCanvas, createFromCanvas }


function createFromCanvas(gl: WebGLRenderingContext, canvas: HTMLCanvasElement): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) {
        throw Error("Unable to create a new texture! Maybe the memory is full.")
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

    return texture;
}


function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas")
    canvas.setAttribute("width", `${width}`)
    canvas.setAttribute("height", `${height}`)
    return canvas
}
