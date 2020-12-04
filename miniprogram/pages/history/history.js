// pages/history/hostory.js

const api = require("../../utils/api")
const util = require("../../utils/util")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    dataList: null,
    state: null,
    feedbackedDatas: [],
    dataTemp: null
  },

  onShow: function (options) {
    api.requestSubscribeMessage()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    const eventChannel = this.getOpenerEventChannel()
    // console.log('options', options)
    /**
     * 监听上一个界面传过来的数据
     */
    eventChannel.on('dataList', function (data) {
      that.setData({
        dataList: JSON.parse(data.dataList),
        state: options.state
      })
      if (options.state == 1) {
        wx.setNavigationBarTitle({
          title: '处理中（' + that.data.dataList.length + '）',
        })
      } else {
        wx.setNavigationBarTitle({
          title: '已维修（' + that.data.dataList.length + '）',
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var data = this.data.dataTemp
    if (data != null) {
      // 删除该单
      this.data.dataList = util.remove(this.data.dataList, 'id', data.id)
      this.data.feedbackedDatas[this.data.feedbackedDatas.length] = data
      this.data.dataTemp = null
      this.setData({
        dataList: this.data.dataList
      })
      wx.setNavigationBarTitle({
        title: '处理中（' + this.data.dataList.length + '）',
      })
      if (data.state == 2) {
        //反馈完成
        wx.showToast({
          title: '反馈成功'
        })
      } else {
        //转让成功
        wx.showToast({
          title: '转让成功',
        })
      }
      this.data.dataTemp = null
    }
  },


  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    var that = this
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('feedbackedDatas', {
      data: JSON.stringify(that.data.feedbackedDatas)
    })
  },

  onTaskClick: function (e) {
    wx.navigateTo({
      url: '/pages/detail/detail',
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('data', {
          data: JSON.stringify(e.detail)
        })
      }
    })
  }
})