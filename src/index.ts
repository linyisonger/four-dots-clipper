
import { Vector2 } from 'ru-toolkit-mathematics'
import { sort, scaling, timestamp, triangle, base64ToTempFilePath, createImage, IFourDotsClipperClipResult, IFourDotsClipperConfig, IClipPictureClipParams, errConfig } from './utils'

interface IData {
    /** 操作的点 */
    points: Vector2[]
    /** 操作点的半径、颜色、错误颜色 */
    pointRaduis: number
    pointColor: string
    pointErrColor: string
    /** 操作线的宽度、颜色、错误颜色 */
    lineWidth: number
    lineColor: string
    lineErrColor: string
    /** 渲染间隔 */
    renderInterval: number
    /** 是否允许三角形 */
    allowTriangle: boolean
    /** 操作层canvas */
    operateCanvas: any
    operateContext: CanvasRenderingContext2D
    /** 操作层宽度、高度 */
    operateWidth: number
    operateHeight: number
    /** 盒子宽度、高度 */
    boxWidth: number
    boxHeight: number
    /** 图片资源 */
    image: CanvasImageSource
    /** 图片X、Y坐标 */
    imageX: number
    imageY: number
    /** 图片旋转角度 */
    imageAngle: number
    /** 图片宽度、高度 */
    imageWidth: number
    imageHeight: number
    /** 裁切层canvas */
    clipCanvas: any
    clipContext: CanvasRenderingContext2D
    /** 移动索引 */
    moveingIndex: number
    /** 最后渲染时间 */
    lastRenderTime: number
}

interface ISelectorQueryRes {
    height: number
    node: any
    nodeCanvasType: string
    width: number
}

/** 默认值 */
const defaultConfig: IFourDotsClipperConfig = {
    allowTriangle: false,
    renderInterval: 20,
    color: "#B4CF66",
    errColor: "#FF5A33",
    point: {
        raduis: 10,
    },
    line: {
        width: 2
    }
}
/**
 * @Author 林一怂儿
 * @Date 2022/05/03 02:58:01 
 */
Component({
    properties: {
        /** 图片地址 */
        src: String,
        /** 配置 */
        config: Object
    },
    data: {
        points: [],
        pointRaduis: 0,
        pointColor: "",
        pointErrColor: "",
        lineWidth: 0,
        lineColor: "",
        lineErrColor: "",
        renderInterval: 0,
        allowTriangle: false,
        operateCanvas: null,
        operateContext: null,
        operateWidth: 0,
        operateHeight: 0,
        boxWidth: 0,
        boxHeight: 0,
        image: null,
        imageX: 0,
        imageY: 0,
        imageWidth: 0,
        imageHeight: 0,
        clipCanvas: null,
        clipContext: null,
        moveingIndex: -1,
        lastRenderTime: 0,
        imageAngle: 0,
    } as IData,
    lifetimes: {
        ready() {
            /** 获取配置 */
            let config: IFourDotsClipperConfig = this.properties.config;

            /** 操作点的半径、颜色、错误颜色 */
            let pointRaduis = config?.point?.raduis ?? defaultConfig.point.raduis;
            let pointColor = config?.point?.color ?? config?.color ?? defaultConfig.color;
            let pointErrColor = config?.point?.errColor ?? config?.errColor ?? defaultConfig.errColor;
            /** 操作线的宽度、颜色、错误颜色 */
            let lineWidth = config?.line?.width ?? defaultConfig.line.width;
            let lineColor = config?.point?.color ?? config?.color ?? defaultConfig.color;
            let lineErrColor = config?.line?.errColor ?? config?.errColor ?? defaultConfig.errColor;
            /** 渲染间隔 */
            let renderInterval = config?.renderInterval ?? defaultConfig.renderInterval;
            /** 是否允许三角形 */
            let allowTriangle = config?.allowTriangle ?? defaultConfig.allowTriangle;

            const dpr = wx.getSystemInfoSync().pixelRatio
            const q = this.createSelectorQuery();
            q.select('#clip').fields({ node: true, size: true })
            q.select("#operate").fields({ node: true, size: true })

            q.exec(async (res: ISelectorQueryRes[]) => {

                const operateCanvas = res[1].node
                const operateContext: CanvasRenderingContext2D = operateCanvas.getContext('2d')
                const operateWidth = res[1].width;
                const operateHeight = res[1].height;


                const boxWidth = operateWidth - pointRaduis * 2;
                const boxHeight = operateHeight - pointRaduis * 2;

                operateCanvas.width = operateWidth * dpr;
                operateCanvas.height = operateHeight * dpr;

                operateContext.scale(dpr, dpr);

                const clipCanvas = res[0].node
                const clipContext: CanvasRenderingContext2D = clipCanvas.getContext('2d')


                // clipContext.scale(dpr, dpr);

                this.data.operateCanvas = operateCanvas;
                this.data.operateContext = operateContext;

                this.data.operateWidth = operateWidth;
                this.data.operateHeight = operateHeight;

                this.data.boxWidth = boxWidth;
                this.data.boxHeight = boxHeight;


                this.data.clipCanvas = clipCanvas;
                this.data.clipContext = clipContext;



                this.data.pointColor = pointColor;
                this.data.pointErrColor = pointErrColor;
                this.data.pointRaduis = pointRaduis;

                this.data.lineColor = lineColor;
                this.data.lineErrColor = lineErrColor;
                this.data.lineWidth = lineWidth;

                this.data.renderInterval = renderInterval;
                this.data.allowTriangle = allowTriangle;

                await this.imageChange(this.properties.src)
                this.reset();
                this.render()

            });
        }
    },
    methods: {
        async imageChange(src: string) {
            const dpr = wx.getSystemInfoSync().pixelRatio

            let {
                operateCanvas,
                operateContext,
                operateWidth,
                operateHeight,
                clipContext,
                image,
                imageX,
                imageY,
                imageWidth,
                imageHeight,

                lineColor,
                lineErrColor,
                lineWidth,

                pointRaduis,
                pointColor,
                pointErrColor,
                points,

                boxWidth,
                boxHeight,

                clipCanvas

            }: IData = this.data;


            image = await createImage(operateCanvas, src)

            const { ow, oh } = scaling(+image.width, +image.height, boxWidth, boxHeight)

            imageWidth = ow;
            imageHeight = oh;

            imageX = (boxWidth - imageWidth) / 2 + pointRaduis;
            imageY = (boxHeight - imageHeight) / 2 + pointRaduis;

            clipCanvas.width = ow * dpr
            clipCanvas.height = oh * dpr
            clipContext.scale(dpr, dpr);

            this.data.image = image;
            this.data.imageWidth = imageWidth;
            this.data.imageHeight = imageHeight;
            this.data.imageX = imageX;
            this.data.imageY = imageY;

        },
        render() {
            let {
                operateContext,
                operateWidth,
                operateHeight,
                image,
                imageX,
                imageY,
                imageWidth,
                imageHeight,

                lineColor,
                lineErrColor,
                lineWidth,

                pointRaduis,
                pointColor,
                pointErrColor,
                points,

            }: IData = this.data;

            // 清空画布
            operateContext.clearRect(0, 0, operateWidth, operateHeight);

            operateContext.drawImage(image, imageX, imageY, imageWidth, imageHeight);
            operateContext.beginPath();
            operateContext.strokeStyle = lineColor;
            operateContext.lineWidth = lineWidth;
            operateContext.fillStyle = pointColor;
            // 三角行的点
            const trianglePoints = triangle(points);

            // 检查是否存在
            if (trianglePoints.length > 0) {
                operateContext.strokeStyle = lineErrColor;
                operateContext.fillStyle = pointErrColor;
                for (let i = 0; i < trianglePoints.length; i++) {
                    let tmp = trianglePoints[i];
                    i == 0 ? operateContext.moveTo(tmp.x, tmp.y) : operateContext.lineTo(tmp.x, tmp.y)
                }
            }
            else {
                points = sort(points);
                for (let i = 0; i < points.length; i++) {
                    let tmp = points[i];
                    i == 0 ? operateContext.moveTo(tmp.x, tmp.y) : operateContext.lineTo(tmp.x, tmp.y)
                }
            }
            operateContext.closePath();
            operateContext.stroke()
            // 点
            for (let i = 0; i < points.length; i++) {
                operateContext.lineWidth = 1;
                let tmp = points[i];
                operateContext.beginPath();
                operateContext.arc(tmp.x, tmp.y, pointRaduis - 1, 0, 2 * Math.PI);
                operateContext.stroke();
                operateContext.fill();
            }
            this.data.point = points;

        },
        touchstart(e) {
            let { points, pointRaduis }: IData = this.data;
            let { x, y } = e.changedTouches[0]
            this.data.moveingIndex = points.findIndex(p => Math.abs(p.x - x) < pointRaduis && Math.abs(p.y - y) < pointRaduis);
            this.render();
        },
        touchmove(e) {

            let {
                moveingIndex,
                renderInterval,
                points,
                imageX,
                imageY,
                imageWidth,
                imageHeight,
                lastRenderTime,
            }: IData = this.data
            if (moveingIndex == -1) return;
            if (timestamp() - lastRenderTime < renderInterval) return;
            this.data.lastRenderTime = timestamp();

            let { x, y } = e.changedTouches[0]
            if (imageX > x) points[moveingIndex].x = imageX;
            else if (x > imageX + imageWidth) points[moveingIndex].x = imageX + imageWidth
            else points[moveingIndex].x = x;

            if (imageY > y) points[moveingIndex].y = imageY;
            else if (y > imageY + imageHeight) points[moveingIndex].y = imageY + imageHeight
            else points[moveingIndex].y = y;

            this.render();
        },
        /** 裁切 */
        async clip(): Promise<IFourDotsClipperClipResult> {
            let {
                image,
                imageX,
                imageY,
                imageWidth,
                imageHeight,
                clipCanvas,
                clipContext,
                points,

                pointRaduis,

                allowTriangle,

                operateWidth,
                operateHeight,
            }: IData = this.data;

            const dpr = wx.getSystemInfoSync().pixelRatio

            points = sort(points);
            // 三角形
            let trianglePoints = triangle(points);

            if (allowTriangle && trianglePoints.length > 0) points = trianglePoints
            else if (!allowTriangle && trianglePoints.length > 0) throw errConfig.NotAllowTriangle;

            clipContext.restore();
            clipContext.clearRect(0, 0, operateWidth, operateHeight)
            clipContext.save();
            clipContext.beginPath();
            clipContext.lineWidth = 0;

            for (let i = 0; i < points.length; i++) {
                let tmp = points[i];
                i == 0 ? clipContext.moveTo(tmp.x - imageX, tmp.y - imageY) : clipContext.lineTo(tmp.x - imageX, tmp.y - imageY)
            }
            clipContext.closePath();
            clipContext.clip();
            clipContext.drawImage(image, 0, 0, imageWidth, imageHeight);


            /** 偏移量 */
            let offsetMinX = 9999;
            let offsetMinY = 9999;
            let offsetMaxX = -9999
            let offsetMaxY = -9999;
            for (let i = 0; i < points.length; i++) {
                if (points[i].x < offsetMinX) offsetMinX = points[i].x;
                if (points[i].y < offsetMinY) offsetMinY = points[i].y;
                if (points[i].x > offsetMaxX) offsetMaxX = points[i].x;
                if (points[i].y > offsetMaxY) offsetMaxY = points[i].y;
            }
            let offsetWidth = offsetMaxX - offsetMinX
            let offsetHeight = offsetMaxY - offsetMinY

            offsetMinX -= imageX;
            offsetMinY -= imageY;

            let base64 = clipCanvas.toDataURL();
            clipContext.restore();
            clipContext.clearRect(0, 0, operateWidth, operateHeight)

            return await this.selectComponent("#cp").clip({
                src: base64,
                x: offsetMinX * dpr,
                y: offsetMinY * dpr,
                width: offsetWidth * dpr,
                height: offsetHeight * dpr
            } as IClipPictureClipParams)

        },
        /**
         * 旋转角度
         * @version 1.0.9
         * @param angle 角度
         */
        async rotate(angle: number) {
            let {
                image
            }: IData = this.data;
            this.data.imageAngle += angle;
            let rr = await this.selectComponent("#rp").rotate({
                image: image,
                angle
            })
            await this.imageChange(rr.tempFilePath)
            this.reset();
            this.render();
        },
        /**
         * @version 1.0.9 复位
         */
        reset() {
            let {
                image,
                imageX,
                imageY,
                imageWidth,
                imageHeight,
                clipCanvas,
                clipContext,
                points,

                pointRaduis,

                allowTriangle,

                operateWidth,
                operateHeight,
            }: IData = this.data;


            points = [
                Vector2.c(imageX, imageY),
                Vector2.c(imageX + imageWidth, imageY),
                Vector2.c(imageX + imageWidth, imageY + imageHeight),
                Vector2.c(imageX, imageY + imageHeight)
            ];

            this.data.points = points;
            this.render();
        }
    },
    observers: {
        "src": async function (newValue) {
            const { image, operateCanvas }: IData = this.data;
            const src = (image as any)?.src;
            if (operateCanvas != null && src != newValue) {
                await this.imageChange(newValue);
                this.reset();
                this.render();
            }
        }
    }
})
