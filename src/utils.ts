import { Vector2 } from 'ru-toolkit-mathematics'
/**
 * 裁切图片clip方法参数
 */
export interface IClipPictureClipParams {
    /** 图片地址 */
    src: string,
    x: number
    y: number
    width: number
    height: number
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
export function scaling(ow: number, oh: number, tw: number, th: number) {
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
export function timestamp() {
    return new Date().getTime();
}
/**
 * 点排序
 * @param points 
 */
export function sort(points: Vector2[]) {

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
export function base64ToTempFilePath(base64: string): Promise<string> {
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
export function triangle(points: Vector2[]): Vector2[] {
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
export function createImage(canvas: any, src: string): Promise<CanvasImageSource> {
    return new Promise((resolve, reject) => {
        let img = canvas.createImage();
        img.src = src;
        img.onload = () => {
            resolve(img)
        }
    })

} 
