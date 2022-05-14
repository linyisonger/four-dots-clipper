
Page({
  data: {
    preSrc: "",
    w: 0,
    h: 0,
  },
  async clip() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async (res) => {
        console.log(res);
        let cr = await this.selectComponent("#cp").clip({
          src: res.tempFiles[0].tempFilePath,
          x: 80,
          y: 102,
          width: 328,
          height: 215
        })
        this.setData({ preSrc: cr.base64, w: cr.width, h: cr.height })

        console.log(cr);
      }
    })

  }
})