//获取应用实例
const util = require("../../utils/util.js");
const api = require("../../utils/api.js");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputString1: null,
    inputString2: null,
    dataListProcessing: null,
    dataListDone: null,
    feedbackedDatas: null,
    days: null,
    user: null
  },

  onShow: function () {
    this.updateDatas()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var user = util.getUser()
    if (user != null) {
      wx.startPullDownRefresh()
      this.setData({
        user: user,
        days: util.diffTime(user.regDate, Date.parse(new Date()))
      })
    }
  },

  getUserInfo: function (e) {
    var that = this
    wx.showLoading({
      title: '验证中',
    })
    wx.cloud.callFunction({
      name: 'post',
      data: {
        url: api.USER.SET_USER_OPEN_ID,
        data: {
          sno: that.data.inputString1,
          password: that.data.inputString2,
          openId: wx.getStorageSync('openId')
        }
      },
      success: function (res) {
        var result = JSON.parse(res.result.body)
        if (result.error == 1) {
          wx.cloud.callFunction({
            name: 'post',
            data: {
              url: api.USER.LOGIN,
              data: {
                sno: that.data.inputString1,
                password: that.data.inputString2
              }
            },
            success: function (res) {
              wx.hideLoading()
              var result = JSON.parse(res.result.body)
              if (result.error == 1) {
                let user = JSON.parse(result.body)
                util.setUser(user)
                that.setData({
                  user: user,
                  days: util.diffTime(user.regDate, Date.parse(new Date()))
                })
                wx.showModal({
                  title: '登录成功',
                  content: user.rootLevel > 1 ? '欢迎' + user.userName + '管理员' : '欢迎' + user.userName,
                  success(res) {
                    wx.startPullDownRefresh()
                    api.requestSubscribeMessage()
                  }
                })
              } else {
                wx.showModal({
                  title: '登录失败',
                  content: result.msg
                })
              }
            },
            fail: function (e) {
              wx.hideLoading()
              console.log(e)
              wx.showModal({
                title: '登录失败',
                content: e
              })
            }
          })
        } else {
          wx.hideLoading()
          wx.showModal({
            title: '登录失败',
            content: result.msg
          })
        }
      },
      fail: function (e) {
        wx.hideLoading()
        console.log(e)
        wx.showModal({
          title: '登录失败',
          content: e
        })
      }
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    if (util.getUser() == null) {
      util.pleaseLoginFirst()
    }
    this.updateDatas();
  },

  updateDatas: function () {
    var user = util.getUser()
    if (user != null) {
      var that = this
      wx.cloud.callFunction({
        name: 'post',
        data: {
          url: api.USER.LOGIN,
          data: {
            sno: user.sno,
            password: user.password
          }
        },
        success: function (res) {
          var result = JSON.parse(res.result.body)
          if (result.error == 1) {
            //更新本地user，并查询所有报修单
            let user = JSON.parse(result.body)
            util.setUser(user)
            that.setData({
              user: user
            })
            // wx.showNavigationBarLoading()
            wx.cloud.callFunction({
              name: 'post',
              data: {
                url: api.DATA.QUERY_ALL
              },
              success: function (res) {
                var result = JSON.parse(res.result.body)
                //筛选出与自己有关的报修单，并把时间戳转换为字符串
                var dataListAll = JSON.parse(result.body)

                //报修按时间降序
                dataListAll.sort(function (a, b) {
                  return b.date - a.date
                });

                for (var i = 0; i < dataListAll.length; i++) {
                  dataListAll[i].date = util.formatTime(dataListAll[i].date)
                  dataListAll[i].orderDate = util.formatTime(dataListAll[i].orderDate)
                  dataListAll[i].repairDate = util.formatTime(dataListAll[i].repairDate)
                }

                wx.setStorageSync('dataList', dataListAll)

                var dataListAboutMyself = util.contain(dataListAll, 'repairer', user.userName)
                var dataList1 = util.query(dataListAboutMyself, 'state', 1)
                var dataList2 = util.query(dataListAboutMyself, 'state', 2)

                that.setData({
                  dataListProcessing: dataList1,
                  dataListDone: dataList2,
                  days: util.diffTime(user.regDate, Date.parse(new Date()))
                })

                wx.stopPullDownRefresh()
                // wx.showToast({
                //   title: '数据更新成功'
                // })
              },
              fail: function (e) {
                wx.stopPullDownRefresh()
                wx.showToast({
                  title: '数据更新失败',
                  image: '/src/images/error.png'
                })
              }
            })
          } else {
            wx.showModal({
              title: '用户信息校验失败',
              content: result.msg
            })
            wx.removeStorageSync('user')
            that.setData({
              user: null
            })
            wx.stopPullDownRefresh()
          }
        }
      })
    } else {
      wx.stopPullDownRefresh()
    }
  },

  onProcessingClick: function (e) {
    let user = util.getUser()
    var that = this
    wx.navigateTo({
      url: '/pages/history/history?state=1',
      events: {
        feedbackedDatas: function (data) {
          var datas = JSON.parse(data.data)
          // console.log('datas', datas)
          if (datas.length != 0) {
            //反馈了，修改数据
            for (var i = 0; i < datas.length; i++) {
              that.data.dataListProcessing = util.remove(that.data.dataListProcessing, 'id', datas[i].id)
              if (datas[i].repairer.indexOf(user.userName) !== -1) {
                //后移一位
                for (var j = that.data.dataListDone.length; j > 0; j--) {
                  that.data.dataListDone[j] = that.data.dataListDone[j - 1]
                }
                //把最后一个插到最前面
                that.data.dataListDone[0] = datas[i]
              }
            }
            that.setData({
              dataListProcessing: that.data.dataListProcessing,
              dataListDone: that.data.dataListDone
            })
          }
        }
      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('dataList', {
          dataList: JSON.stringify(that.data.dataListProcessing)
        })
      }
    })
  },
  onDoneClick: function (e) {
    if (this.data.dataListDone != null && this.data.dataListDone.length != 0) {
      var that = this
      wx.navigateTo({
        url: '/pages/history/history?state=2',
        success: function (res) {
          // 通过eventChannel向被打开页面传送数据
          res.eventChannel.emit('dataList', {
            dataList: JSON.stringify(that.data.dataListDone)
          })
        }
      })
    }
  },

  onTextChange1: function (e) {
    this.setData({
      inputString1: e.detail.value
    })
  },
  onTextChange2: function (e) {
    this.setData({
      inputString2: e.detail.value
    })
  },
  onLogoutClick: function (_) {
    let that = this
    wx.showModal({
      title: '确定退出登录？',
      content: '历史数据不会被清空',
      success(res) {
        if (res.confirm) {
          wx.showToast({
            title: '退出登录成功',
          })
          that.setData({
            user: null
          })
          wx.removeStorageSync('user')
          wx.removeStorageSync('dataList')
        }
      }
    })
  }
})