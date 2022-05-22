import { base64ToTempFilePath, createImage, IClipPictureClipParams } from '../../utils'
Component({
    data: {
        clipCanvas: null,
        clipContext: null,
    },
    lifetimes: {
        ready() {
            const q = this.createSelectorQuery();
            q.select('#clip').fields({ node: true, size: true })
            q.exec((res) => {
                const clipCanvas = res[0].node;
                const clipContext = clipCanvas.getContext('2d')
                this.data.clipCanvas = clipCanvas;
                this.data.clipContext = clipContext;
            })
        }
    },
    methods: {
        /**
         * 裁切图片
         * @param p 
         * @returns 
         */
        async clip(p: IClipPictureClipParams) {
            const clipCanvas: HTMLCanvasElement = this.data.clipCanvas
            const clipContext: CanvasRenderingContext2D = this.data.clipContext;
            const clipImage = await createImage(clipCanvas, p.src);
            clipCanvas.width = p.width
            clipCanvas.height = p.height
            clipContext.drawImage(clipImage, p.x, p.y, p.width, p.height, 0, 0, p.width, p.height)
            const base64 = clipCanvas.toDataURL();
            clipContext.clearRect(0, 0, +clipImage.width, +clipImage.height)
            const tempFilePath = await base64ToTempFilePath(base64)
            return {
                base64,
                tempFilePath,
                width: p.width,
                height: p.height
            }
        }
    }
})