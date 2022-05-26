import { base64ToTempFilePath, createImage, IRotatePictureRotateParams } from '../../utils'
Component({
    data: {
        rotateCanvas: null,
        rotateContext: null,
    },
    lifetimes: {
        ready() {
            const q = this.createSelectorQuery();
            q.select('#rotate').fields({ node: true, size: true })
            q.exec((res) => {
                const rotateCanvas = res[0].node;
                const rotateContext = rotateCanvas.getContext('2d');

                const dpr = wx.getSystemInfoSync().pixelRatio

                rotateContext.scale(dpr, dpr);

                this.data.rotateCanvas = rotateCanvas;
                this.data.rotateContext = rotateContext;
            })
        }
    },
    methods: {
        /**
         * 旋转图片
         * @param p 
         * @returns 
         */
        async rotate(p: IRotatePictureRotateParams) {
            const rotateCanvas: HTMLCanvasElement = this.data.rotateCanvas
            const rotateContext: CanvasRenderingContext2D = this.data.rotateContext;
            const rotateImage = p.image ?? await createImage(rotateCanvas, p.src);
            
            const rad = p.angle / 180 * Math.PI;
            let x = 0;
            let y = 0;
            // 正常
            if (p.angle % 180 == 0) {
                rotateCanvas.width = +rotateImage.width;
                rotateCanvas.height = +rotateImage.height;
            }

            // 旋转 
            else if (p.angle % 90 == 0) {
                rotateCanvas.width = +rotateImage.height;
                rotateCanvas.height = +rotateImage.width;
                x = (rotateCanvas.width - rotateCanvas.height) / 2;
                y = (rotateCanvas.height - rotateCanvas.width) / 2;
            }

            rotateContext.translate(rotateCanvas.width / 2, rotateCanvas.height / 2)
            rotateContext.rotate(rad)
            rotateContext.translate(-rotateCanvas.width / 2, -rotateCanvas.height / 2)
            rotateContext.drawImage(rotateImage, x, y, +rotateImage.width, +rotateImage.height)
            rotateContext.translate(rotateCanvas.width / 2, rotateCanvas.height / 2)
            rotateContext.rotate(-rad)
            rotateContext.translate(-rotateCanvas.width / 2, -rotateCanvas.height / 2)
            const base64 = rotateCanvas.toDataURL();
            rotateContext.clearRect(0, 0, rotateCanvas.width, rotateCanvas.height)
            const tempFilePath = await base64ToTempFilePath(base64)
            return {
                base64,
                tempFilePath,
                width: rotateCanvas.width,
                height: rotateCanvas.height
            }
        }
    }
})