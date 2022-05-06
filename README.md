### 四点裁切组件

这是一个很'常用'的四点裁切组件。


![Git Actions](https://img.shields.io/github/workflow/status/LINYISONGER/four-dots-clipper/npm%20packages%20publish?style=for-the-badge)![Apache-2.0](https://img.shields.io/github/license/linyisonger/four-dots-clipper?style=for-the-badge)![Stars](https://img.shields.io/github/stars/linyisonger/four-dots-clipper?style=for-the-badge) ![npm](https://img.shields.io/npm/v/four-dots-clipper?style=for-the-badge)![npm](https://img.shields.io/npm/dw/four-dots-clipper?style=for-the-badge)

#### 支持平台

​    ![image](https://img2022.cnblogs.com/blog/1415778/202205/1415778-20220506100852595-613509558.svg) 

微信小程序

#### 效果

![image](https://img2022.cnblogs.com/blog/1415778/202205/1415778-20220506095831836-1407785966.gif)

#### 使用

新建小程序，如果存在跳过此步骤。

在项目目录下执行`npm init`生成`package.json`文件，如果存在`package.json`文件跳过此步骤。

执行`npm i four-dots-clipper`安装组件。 

点击`操作栏`上的`工具`-`构建npm`成功之后将会出现一个`miniprogram_npm`文件夹。

##### 引用组件

`index.json`

```json
{
    "usingComponents": {
        "fp-clipper": "/miniprogram_npm/four-dots-clipper/index"
    }, 
    "disableScroll": true // 防止ios随意拖拽
}
```

##### 加载组件

`index.wxml`

```html
<view>组件</view>
<fp-clipper id="fpc" src="https://picsum.photos/150/100"></fp-clipper>
<button type="primary" bindtap="clip">裁切</button>
<view>预览</view>
<image src="{{preSrc}}" style="width: {{w}}px; height: {{h}}px;" mode="scaleToFill"></image>
```

##### 组件方法

`index.js`

```js
Page({
  data: {
      preSrc: "",
      w: 0,
      h: 0
  },
  async clip() {
      let res = await this.selectComponent('#fpc').clip() // 调用组件中的裁切
      this.setData({ preSrc: res.tempFilePath, w: res.width, h: res.height })
  }
})
```

#### 方法

##### clip()

`async clip(): Promise<IFourDotsClipperClipResult>` 裁切图片

```ts
/**
 * 裁切的返回值
 */
export interface IFourDotsClipperClipResult {
    /** BASE64字符串 */
    base64: string,
    /** 临时图片 */
    tempFilePath: string,
    /** 渲染的图片宽度 */
    width: string,
    /** 渲染的图片高度 */
    height: string
}
```





