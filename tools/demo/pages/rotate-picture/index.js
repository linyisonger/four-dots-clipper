
Page({
  data: {
    preSrc: "",
    w: 0,
    h: 0,
  },
  async rotate() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async (res) => {
        console.log(res);
        let cr = await this.selectComponent("#rp").rotate({
          src: res.tempFiles[0].tempFilePath,
          angle: 90
        })
        this.setData({ preSrc: cr.base64, w: cr.width, h: cr.height })

        wx.saveImageToPhotosAlbum({
          filePath: cr.tempFilePath
        })
        console.log(cr);
      }
    })

  }
})