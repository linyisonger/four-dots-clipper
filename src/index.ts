
import { Vector2 } from 'ru-toolkit-mathematics'

export interface IFourDotsClipperConfigUnit {
    px: string,
    /** 用于适配不同分辨率的机型 */
    rpx: string
}
/**
 * 配置
 */
export interface IFourDotsClipperConfig {
    /**
     * 允许三角形 
     * 1.0.5
     */
    allowTriangle?: boolean
    /** 渲染间隔 ms */
    renderInterval?: number
    /** canvas最大宽度 */
    width?: number,
    /** canvas最大高度 */
    height?: number
    /** 单位 */
    unit?: keyof IFourDotsClipperConfigUnit
    /** 颜色 线与点 */
    color?: string,
    /** 错颜色 线与点 */
    errColor?: string
    /** 点 */
    point?: {
        /** 颜色 点 */
        color?: string,
        /** 错颜色 点 */
        errColor?: string,
        /** 半径 */
        raduis?: number,
    },
    /** 线 */
    line?: {
        /** 颜色 线 */
        color?: string,
        /** 错颜色 线 */
        errColor?: string,
        /** 宽度 */
        width?: number
    }
}
/**
 * 裁切的返回值
 */
export interface IFourDotsClipperClipResult {
    /** BASE64字符串 */
    base64: string,
    /** 临时图片 */
    tempFilePath: string,
    /** 渲染的图片宽度 */
    width: number,
    /** 渲染的图片高度 */
    height: number
}
/**
 * 缩放
 * @param ow 源图宽 
 * @param oh 源图高
 * @param tw 目标宽
 * @param th 目标高
 */
const scaling = (ow: number, oh: number, tw: number, th: number) => {
    let s = 0;
    if (ow > oh) {
        s = ow / oh;
        ow = tw;
        oh = ow / s
    }
    else {
        s = ow / oh;
        oh = th;
        ow = oh * s
    }

    if (th < oh) {
        s = ow / oh;
        oh = th;
        ow = oh * s
    }

    if (tw < ow) {
        s = ow / oh;
        ow = tw;
        oh = ow / s
    }
    return { ow, oh }
}
/**
 * 获取时间戳
 */
const timestamp = () => {
    return new Date().getTime();
}
/**
 * 点排序
 * @param points 
 */
const sort = (points: Vector2[]) => {

    let a = points[0]
    let b = points[1]
    let c = points[2]
    let d = points[3]
    if (Vector2.checkCross(a, b, c, d)) {
        b = points[2]
        c = points[1]
    }
    else if (Vector2.checkCross(a, d, c, b)) {
        a = points[1];
        b = points[0]
    }
    return [a, b, c, d]
}
/**
 * 获取临时图片
 * @param base64 
 * @returns 
 */
const base64ToTempFilePath = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const fs = wx.getFileSystemManager();
        const times = new Date().getTime();
        const tempFilePath = wx.env.USER_DATA_PATH + '/' + times + '.png';
        fs.writeFile({
            filePath: tempFilePath,
            data: base64.split(',')[1],
            encoding: 'base64',
            success: (res) => {
                resolve(tempFilePath)
            },
            fail: (err) => {
                reject(err)
            }
        });
    })
}
/** 三角形 */
const triangle = (points: Vector2[]): Vector2[] => {
    for (let i = 0; i < points.length; i++) {
        let curr = points[i];
        let other = points.filter((p, j) => i != j);
        if (Vector2.checkInTriangle(curr, other[0], other[1], other[2])) {
            return other;
        }
    }
    return [];
}
/** 获取图片 */
const createImage = (canvas: any, src: string): Promise<CanvasImageSource> => {
    return new Promise((resolve, reject) => {
        let img = canvas.createImage();
        img.src = src;
        img.onload = () => {
            resolve(img)
        }
    })

}

/** 默认值 */
const defaultConfig: IFourDotsClipperConfig = {
    allowTriangle: false,
    renderInterval: 20,
    width: 600,
    height: 300,
    unit: 'rpx',
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
 * 
 * 
 * 当 width < 2 * raduis || height < 2 * raduis;
 * 自动 width = 默认值 && height = 默认值 ;
 */
Component({
    properties: {
        /** 图片地址 */
        src: String,
        /** 宽度 */
        width: Number,
        /** 高度 */
        height: Number,
        /** 配置 */
        config: Object
    },
    data: {
        /** 记录四个点 */
        m_points: [] as Vector2[],
        m_width: 0,
        m_height: 0,
        m_unit: "",
        m_point_color: "",
        m_point_err_color: "",
        m_point_raduis: 0,
        m_line_color: "",
        m_line_err_color: "",
        m_line_width: 0,
        m_result_canvas: null,
        m_result_context: null,
        m_point_canvas: null,
        m_point_context: null,
        m_clip_canvas: null,
        m_clip_context: null,
        m_image: null,
        m_context_rotate: 0,
        r_width: 0,
        r_height: 0,
        b_width: 0,
        b_height: 0,
        i_x: 0,
        i_y: 0,
        i_width: 0,
        i_height: 0,
        m_moveing: -1,
        lasttime: 0,
        is_error: false
    },
    lifetimes: {
        ready() {
            let config = this.properties.config;

            let m_width = config?.width || this.properties.width || defaultConfig.width;
            let m_height = config?.height || this.properties.height || defaultConfig.height;
            let m_unit = config?.unit || defaultConfig.unit;
            let m_point_raduis = config?.point?.raduis || defaultConfig.point.raduis

            let m_point_color = config?.point?.color || config?.color || defaultConfig.color;
            let m_point_err_color = config?.point?.errColor || config?.errColor || defaultConfig.errColor;

            let m_line_color = config?.line?.color || config?.color || defaultConfig.color;
            let m_line_err_color = config?.line?.errColor || config?.errColor || defaultConfig.errColor;
            let m_line_width = config?.line?.width || defaultConfig.line.width
            let m_render_interval = config?.renderInterval || defaultConfig.renderInterval
            let m_allow_triangle = config?.allowTriangle || defaultConfig.allowTriangle

            this.data.m_render_interval = m_render_interval;
            this.data.m_point_color = m_point_color;
            this.data.m_point_err_color = m_point_err_color;
            this.data.m_line_color = m_line_color;
            this.data.m_line_err_color = m_line_err_color;
            this.data.m_line_width = m_line_width;
            this.data.m_allow_triangle = m_allow_triangle;

            this.setData({ m_width, m_height, m_unit, m_point_raduis })

            const dpr = wx.getSystemInfoSync().pixelRatio
            const q = this.createSelectorQuery();
            q.select('#result').fields({ node: true, size: true })
            q.select('#clip').fields({ node: true, size: true })
            q.select("#points").fields({ node: true, size: true })

            q.exec((res) => {

                const m_result_canvas = res[0].node;
                const m_clip_canvas = res[1].node;
                const m_point_canvas = res[2].node



                const m_result_context = m_result_canvas.getContext('2d')
                const m_clip_context = m_clip_canvas.getContext('2d')
                const m_point_context = m_point_canvas.getContext('2d')

                // 用于移动四个点
                const r_width = res[0].width;
                const r_height = res[0].height;
                const m_point_raduis = this.data.m_point_raduis;
                const b_width = r_width - m_point_raduis * 2
                const b_height = r_height - m_point_raduis * 2

                m_point_canvas.width = r_width * dpr
                m_point_canvas.height = r_height * dpr

                m_point_context.scale(dpr, dpr);
                let img = m_point_canvas.createImage();
                img.src = this.properties.src;
                img.onload = () => {
                    let { ow, oh } = scaling(img.width, img.height, b_width, b_height)
                    let i_x = (b_width - ow) / 2 + m_point_raduis;
                    let i_y = (b_height - oh) / 2 + m_point_raduis;



                    m_point_context.drawImage(img, i_x, i_y, ow, oh);
                    this.data.i_x = i_x;
                    this.data.i_y = i_y;
                    this.data.b_width = b_width;
                    this.data.b_height = b_height;
                    this.data.r_width = r_width;
                    this.data.r_height = r_height;
                    this.data.i_width = ow;
                    this.data.i_height = oh;
                    this.data.m_point_canvas = m_point_canvas;
                    this.data.m_point_context = m_point_context;
                    this.data.m_image = img;
                    this.data.m_points = [Vector2.c(i_x, i_y), Vector2.c(i_x + ow, i_y), Vector2.c(i_x + ow, i_y + oh), Vector2.c(i_x, i_y + oh)]



                    m_clip_canvas.width = ow * dpr
                    m_clip_canvas.height = oh * dpr
                    m_clip_context.scale(dpr, dpr);

                    this.data.m_clip_canvas = m_clip_canvas
                    this.data.m_clip_context = m_clip_context

                    this.data.m_result_canvas = m_result_canvas;
                    this.data.m_result_context = m_result_context;

                    this.requestAnimationFrame();


                };
            });
        }
    },
    methods: {
        requestAnimationFrame() {
            let { m_context_rotate, m_point_context, m_allow_triangle, m_image, i_x, i_y, i_width, i_height, r_width, r_height, m_line_color, m_line_err_color, m_line_width, m_points, m_point_raduis, m_point_color, m_point_err_color } = this.data;
            m_point_context.clearRect(0, 0, r_width, r_height)

            // 渲染图片
            m_point_context.translate(r_width / 2, r_height / 2)
            m_point_context.rotate(m_context_rotate);
            m_point_context.translate(-r_width / 2, -r_height / 2)
            m_point_context.drawImage(m_image, i_x, i_y, i_width, i_height);


            // 还原
            m_point_context.translate(r_width / 2, r_height / 2)
            m_point_context.rotate(-m_context_rotate);
            m_point_context.translate(-r_width / 2, -r_height / 2)


            m_point_context.beginPath();
            m_point_context.strokeStyle = m_line_color;
            m_point_context.lineWidth = m_line_width;
            m_point_context.fillStyle = m_point_color;

            let tp = triangle(m_points);
            let checkisPointInTranjgle = tp.length > 0;

            // 在的话
            if (checkisPointInTranjgle) {
                m_point_context.strokeStyle = m_line_err_color;
                m_point_context.fillStyle = m_point_err_color;
                for (let i = 0; i < tp.length; i++) {
                    let tmp = tp[i];
                    i == 0 ? m_point_context.moveTo(tmp.x, tmp.y) : m_point_context.lineTo(tmp.x, tmp.y)
                }
            }
            else {
                m_points = sort(m_points);
                for (let i = 0; i < m_points.length; i++) {
                    let tmp = m_points[i];
                    i == 0 ? m_point_context.moveTo(tmp.x, tmp.y) : m_point_context.lineTo(tmp.x, tmp.y)
                }
            }
            m_point_context.closePath();
            m_point_context.stroke()
            // 点
            for (let i = 0; i < m_points.length; i++) {
                m_point_context.lineWidth = 1;
                let tmp = m_points[i];
                m_point_context.beginPath();
                m_point_context.arc(tmp.x, tmp.y, m_point_raduis - 1, 0, 2 * Math.PI);
                m_point_context.stroke();
                m_point_context.fill();
            }
            this.data.point = m_points;
            // 不允许三角形
            if (!m_allow_triangle) this.data.is_error = checkisPointInTranjgle;


        },
        touchstart(e) {
            let { m_points, m_point_raduis } = this.data;
            let { x, y } = e.changedTouches[0]
            this.data.m_moveing = m_points.findIndex(p => Math.abs(p.x - x) < m_point_raduis && Math.abs(p.y - y) < m_point_raduis);
            this.requestAnimationFrame()
        },
        touchmove(e) {
            let { m_moveing, m_points, lasttime, i_x, i_y, i_width, i_height, m_render_interval } = this.data;
            if (m_moveing == -1 || timestamp() - lasttime < m_render_interval) return;
            this.data.lasttime = timestamp();
            let { x, y } = e.changedTouches[0]

            if (i_x > x) m_points[m_moveing].x = i_x;
            else if (x > i_x + i_width) m_points[m_moveing].x = i_x + i_width
            else m_points[m_moveing].x = x;

            if (i_y > y) m_points[m_moveing].y = i_y;
            else if (y > i_y + i_height) m_points[m_moveing].y = i_y + i_height
            else m_points[m_moveing].y = y;
            this.requestAnimationFrame();
        },
        /** 裁切 */
        async clip(): Promise<IFourDotsClipperClipResult> {
            let { m_context_rotate, i_x, i_y, i_width, i_height, r_width, r_height, is_error, m_clip_canvas, m_image, m_allow_triangle } = this.data;
            let m_clip_context: CanvasRenderingContext2D = this.data.m_clip_context
            let m_points: Vector2[] = this.data.m_points;
            let m_point_raduis: Number = this.data.m_point_raduis
            return new Promise(async (resolve, reject) => {
                if (is_error) return reject({ is_error })

                const dpr = wx.getSystemInfoSync().pixelRatio

                m_points = sort(m_points);
                // 三角形
                let tp = triangle(m_points);
                if (m_allow_triangle && tp.length > 0) m_points = tp


                /** 点 */
                // let pointsOrderByX = [].concat(m_points).sort((a, b) => a.x - b.x)
                // let pointsOrderByY = [].concat(m_points).sort((a, b) => a.y - b.y)


                /** 偏移量 */
                // let offsetMinX = pointsOrderByX[0].x - i_x;
                // let offsetMinY = pointsOrderByY[0].y - i_y;
                // let offsetMaxX = pointsOrderByX[pointsOrderByX.length - 1].x
                // let offsetMaxY = pointsOrderByY[pointsOrderByY.length - 1].y


                m_clip_context.restore();
                m_clip_context.clearRect(0, 0, r_width, r_height)
                m_clip_context.save();
                m_clip_context.beginPath();
                m_clip_context.lineWidth = 0;


                let resultPoints: Vector2[] = []
                // 放置点的位置  
                for (let i = 0; i < m_points.length; i++) {
                    let tmp = m_points[i]; i == 0 ? m_clip_context.moveTo(tmp.x - i_x, tmp.y - i_y) : m_clip_context.lineTo(tmp.x - i_x, tmp.y - i_y)
                    resultPoints.push(Vector2.c(tmp.x - i_x, tmp.y - i_y))
                }
                m_clip_context.closePath();
                m_clip_context.clip();

                // 渲染图片
                m_clip_context.translate(i_width / 2, i_height / 2)
                m_clip_context.rotate(m_context_rotate);
                m_clip_context.translate(-i_width / 2, -i_height / 2)
                m_clip_context.drawImage(m_image, 0, 0, i_width, i_height);


                // 还原
                m_clip_context.translate(i_width / 2, i_height / 2)
                m_clip_context.rotate(-m_context_rotate);
                m_clip_context.translate(-i_width / 2, -i_height / 2)

                /** 点 */
                let pointsOrderByX: Vector2[] = [].concat(resultPoints).sort((a, b) => a.x - b.x)
                let pointsOrderByY: Vector2[] = [].concat(resultPoints).sort((a, b) => a.y - b.y)

                console.log(pointsOrderByX, pointsOrderByY);

                /** 偏移量 */
                let offsetMinX = pointsOrderByX[0].x;
                let offsetMinY = pointsOrderByY[0].y;
                let offsetMaxX = pointsOrderByX[pointsOrderByX.length - 1].x
                let offsetMaxY = pointsOrderByY[pointsOrderByY.length - 1].y

                let offsetWidth = offsetMaxX - offsetMinX
                let offsetHeight = offsetMaxY - offsetMinY

                let base64 = m_clip_canvas.toDataURL();

                let m_result_canvas: HTMLCanvasElement = this.data.m_result_canvas
                let m_result_context: CanvasRenderingContext2D = this.data.m_result_context;

                let clip_img = await createImage(m_result_canvas, base64)

                m_result_canvas.width = +clip_img.width
                m_result_canvas.height = +clip_img.height
                m_result_context.scale(dpr, dpr);
                
                m_result_context.drawImage(clip_img, offsetMinX * dpr, offsetMinY * dpr, offsetWidth * dpr, offsetHeight * dpr, 0, 0, +clip_img.width / dpr, +clip_img.height / dpr)
                base64 = m_result_canvas.toDataURL();
                m_clip_context.restore();
                m_clip_context.clearRect(0, 0, r_width, r_height)
                m_result_context.clearRect(0, 0, r_width, r_height)
                let tempFilePath = await base64ToTempFilePath(base64)
                resolve({
                    base64,
                    tempFilePath,
                    width: offsetWidth,
                    height: offsetHeight
                })

            })
        },
        /**
         * 1.0.x 旋转 不久的未来 哈哈哈哈
          * @param degree 角度
         */
        rotate(degree: number) {
            let { r_width, r_height, m_clip_context, m_point_context, m_context_rotate } = this.data;
            let tmp = degree * Math.PI / 180
            this.data.m_context_rotate += tmp;
            console.log(tmp);
            // ctx2.translate(dx,dy);
            // m_clip_context.rotate(tmp)
            // m_point_context.translate(r_width / 2, r_height / 2)
            // m_point_context.rotate(tmp)
            // m_point_context.translate(-r_width / 2, -r_height / 2)
            this.requestAnimationFrame();
        }
    }
})
