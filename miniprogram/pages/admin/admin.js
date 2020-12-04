const api = require("../../utils/api")

// pages/admin/admin.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    service: null,
    loading: null
  },

  onShow: function (options) {
    api.requestSubscribeMessage()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.startPullDownRefresh()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({
      loading: true
    })
    var that = this
    wx.cloud.callFunction({
      name: 'post',
      data: {
        url: api.STATE.CHECK_SERVICE,
        data: {
          type: 'repair'
        }
      },
      success: function (res) {
        wx.stopPullDownRefresh()
        that.setData({
          loading: false
        })
        var result = JSON.parse(res.result.body)
        if (result.error == 1) {
          that.setData({
            service: result.body
          })
          wx.showToast({
            title: "信息更新成功"
          })
        }
      },
      fail: function (e) {
        wx.stopPullDownRefresh()
        that.setData({
          loading: false
        })
        wx.showToast({
          title: "信息更新失败",
          image: '/src/images/error.png'
        })
      }
    })
  },

  onSwitchChange: function (e) {
    wx.showLoading({
      title: '请稍后'
    })
    var that = this
    that.setData({
      loading: true
    })
    wx.cloud.callFunction({
      name: 'post',
      data: {
        url: api.STATE.CHANGE_SERVICE,
        data: {
          type: 'repair',
          available: e.detail.value.toString()
        }
      },
      success: function (res) {
        var result = JSON.parse(res.result.body)
        wx.hideLoading()
        that.setData({
          loading: false
        })

        if (result.error == 1) {
          wx.showToast({
            title: '状态变更成功',
          })
        } else {
          that.setData({
            service: !that.data.service
          })
          wx.showToast({
            title: '状态变更失败',
            image: '/src/images/error.png'
          })
        }
      },
      fail: function (e) {
        wx.hideLoading()
        that.setData({
          loading: false,
          service: !that.data.service
        })
        wx.showToast({
          title: '状态变更失败',
          image: '/src/images/error.png'
        })
      }
    })
  }
})