Page({
  data: {
    preSrc: "",
    w: 0,
    h: 0,
    config: {
      allowTriangle: false
    }
  },
  async clip() {
    let res = await this.selectComponent('#fpc').clip()
    wx.saveImageToPhotosAlbum({
      filePath: res.tempFilePath,
    })
    this.setData({ preSrc: res.tempFilePath, w: res.width, h: res.height })
  },
  rotate() {
    this.selectComponent('#fpc').rotate(90)
  },
  reset() {
    this.selectComponent('#fpc').reset();
  }
})
