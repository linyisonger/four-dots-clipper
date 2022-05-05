Page({
    data: {
        preSrc: "",
        w: 0,
        h: 0
    },
    async clip() {
        let res = await this.selectComponent('#fpc').clip()
        this.setData({ preSrc: res.tempFilePath, w: res.width, h: res.height })
    }
})
