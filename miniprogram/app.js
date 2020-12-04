const api = require("./utils/api")

//app.js

App({
  onLaunch: function () {
    wx.cloud.init({
      // 此处请填入环境 ID, 环境 ID 可打开云控制台查看
      env: 'repair-a45cr',
      traceUser: true
    })
    //获取code
    wx.login({
      success: res => {
        var codeString = res.code
        if (codeString) {
          // 发送 res.code 到后台换取 openId
          wx.cloud.callFunction({
            name: 'post',
            data: {
              url: api.USER.GET_USER_OPEN_ID + '?code=' + codeString
            },
            success: function (res) {
              var result = JSON.parse(res.result.body)
              if (result.error == 1) {
                wx.setStorageSync("openId", result.body)
              } else {
                console.log(result.msg)
              }
            },
            fail: function (e) {
              console.log(e)
            }
          })
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      }
    })
  },
  globalData: {
    user: null
  }
})