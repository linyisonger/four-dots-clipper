Page({
  data: {
    preSrc: "",
    w: 0,
    h: 0,
    config: {
      allowTriangle: true
    }
  },
  async clip() {
    let res = await this.selectComponent('#fpc').clip()
    this.setData({ preSrc: res.tempFilePath, w: res.width, h: res.height })
  },
  rotate() {
    this.selectComponent('#fpc').rotate(90)
  }
})
