//获取应用实例
const api = require("../../utils/api.js");
const util = require("../../utils/util.js");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    user: null,
    dataList: null,
    dataListTemp: null,
    dataListTempBackup: null,
    dataTemp: null,
    loading: null,
    noMoreData: null,
    deleteIds: [],
    checked: null,
    placeholder: "在当前页面搜索"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.startPullDownRefresh();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let user = util.getUser()
    /**
     * 当从details页面返回，获得是否接单成功this.data.dataTemp
     */
    if (this.data.dataTemp != null) {
      if (this.data.dataTemp.repairer == user.userName) {
        let selectedId = this.data.dataTemp.id
        //接单成功，删除该单
        //删除json中的某个元素
        this.data.dataList = util.remove(this.data.dataList, 'id', selectedId)
        this.data.dataListTempBackup = util.remove(this.data.dataListTempBackup, 'id', selectedId)
        this.data.dataTemp = null
        this.setData({
          dataListTemp: util.remove(this.data.dataListTemp, 'id', selectedId)
        })
        that.updateTabBadge()
        wx.showToast({
          title: '接单成功'
        })
      }
    }
  },


  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.updateDatas()
  },

  /**
   * 更新数据
   */
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
            let user = JSON.parse(result.body)
            //更新本地user，并查询所有报修单
            that.setData({
              user: user
            })
            util.setUser(user)
            // wx.showNavigationBarLoading()
            wx.cloud.callFunction({
              name: 'post',
              data: {
                url: api.DATA.QUERY_ALL
              },
              success: function (res) {
                var result = JSON.parse(res.result.body)
                //筛选出自己园区的报修单，并把时间戳转换为字符串
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

                var dataListWithGroup = dataListAll

                if (user.rootLevel == 0) {
                  //需要筛选自己园区
                  dataListWithGroup = util.query(dataListWithGroup, 'distinct', user.whichGroup)
                }

                // console.log(dataListWithGroup)

                var dataListNewTask = util.query(dataListWithGroup, "state", 0)

                // console.log(dataListNewTask)

                that.setData({
                  dataList: dataListNewTask,
                  dataListTemp: dataListNewTask,
                  dataListTempBackup: dataListNewTask
                })

                wx.stopPullDownRefresh()
                that.updateTabBadge()
                wx.showToast({
                  title: '数据更新成功'
                })
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
            wx.stopPullDownRefresh()
          }
        }
      })
    } else {
      util.pleaseLoginFirst()
      wx.stopPullDownRefresh()
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var list = this.data.dataList
    var currentCount = this.data.dataListTemp.length
    if (currentCount == list.length) {
      this.setData({
        noMoreData: true
      })
    } else {
      this.data.dataListTemp = util.limit(list, 0, currentCount + 10)
      this.data.dataListTempBackup = this.data.dataListTemp
      this.setData({
        dataListTemp: this.data.dataListTemp
      })
    }
  },

  /**
   * 点击任务进入详情页
   */
  onTaskClick: function (e) {
    if (this.data.user != null) {
      wx.navigateTo({
        url: '/pages/detail/detail',
        success: function (res) {
          // 通过eventChannel向被打开页面传送数据
          res.eventChannel.emit('data', {
            data: JSON.stringify(e.detail)
          })
        }
      })
    } else {
      util.pleaseLoginFirst()
    }
  },

  /**
   * 多选删除
   */
  onChecked: function (e) {
    // console.log(e.detail)
    var id = e.detail
    var hasId = false

    for (var i = 0; i < this.data.deleteIds.length; i++) {
      if (this.data.deleteIds[i] == id) {
        this.data.deleteIds[i] = null
        hasId = true
        break
      }
    }
    if (!hasId) {
      this.data.deleteIds[this.data.deleteIds.length] = id
    }
  },

  onDelete: function (e) {
    let user = util.getUser()
    if (user == null) {
      util.pleaseLoginFirst()
    } else {
      var noSelect = null
      for (var i = 0; i < this.data.deleteIds.length; i++) {
        if (this.data.deleteIds[i] != null) {
          noSelect = false
          break
        }
      }
      if (noSelect != null && !noSelect) {
        wx.showLoading({
          title: '删除中',
        })
        var that = this
        // console.log('delete1', this.data.deleteIds2)
        var idsString = '['
        for (var i = 0; i < this.data.deleteIds.length; i++) {
          if (this.data.deleteIds[i] != null) {
            idsString += this.data.deleteIds[i]
            if (i != this.data.deleteIds.length - 1) {
              idsString += ','
            }
          }
        }
        idsString += ']'
        // console.log('idsString', idsString)
        wx.cloud.callFunction({
          name: 'post',
          data: {
            url: api.DATA.DELETE_BY_ID_LIST,
            data: {
              idListJson: idsString,
              userJson: JSON.stringify(user)
            }
          },
          success: function (res) {
            let result = JSON.parse(res.result.body)
            if (result.error == 1) {
              //移除这些数据
              for (var i = 0; i < that.data.deleteIds.length; i++) {
                if (that.data.deleteIds[i] != null) {
                  that.data.dataList = util.remove(that.data.dataList, 'id', that.data.deleteIds[i])
                  that.data.dataListTemp = util.remove(that.data.dataListTemp, 'id', that.data.deleteIds[i])
                  that.data.dataListTempBackup = util.remove(that.data.dataListTempBackup, 'id', that.data.deleteIds[i])
                }
              }
              that.setData({
                dataListTemp: that.data.dataListTemp,
                checked: false
              })
              wx.hideLoading()
              wx.showToast({
                title: '删除成功',
              })
              //清空选中的数据
              for (var i = 0; i < that.data.deleteIds.length; i++) {
                that.data.deleteIds[i] = null
              }
              that.updateTabBadge()
            } else {
              wx.hideLoading()
              wx.showModal({
                title: '删除失败',
                content: result.msg
              })
            }
          },
          fail: function (e) {
            console.log(e)
            wx.hideLoading()
            wx.showToast({
              title: '删除失败',
              image: '/src/images/error.png'
            })
          }
        })
      } else {
        wx.showToast({
          title: '未选择',
          image: '/src/images/error.png'
        })
      }
    }
  },

  onSearchInput: function (e) {
    //当清空输入的时候恢复原来的数据
    if (e.detail.value == '') {
      //恢复原来的数据
      this.setData({
        dataListTemp: this.data.dataListTempBackup
      })
    }
  },

  onSearch: function (e) {
    let user = util.getUser()
    if (user != null) {

      var inputString = e.detail.value
      var dataListOnSearch = this.data.dataList

      if (inputString != '') {
        //搜索
        dataListOnSearch = util.search(dataListOnSearch, inputString)
        this.setData({
          dataListTemp: dataListOnSearch
        })
      } else {
        //恢复原来的数据
        this.setData({
          dataListTemp: this.data.dataListTempBackup
        })
      }
    } else {
      util.pleaseLoginFirst()
    }
  },

  updateTabBadge() {
    let count = this.data.dataList.length
    if (count > 0) {
      wx.setTabBarBadge({
        index: 0,
        text: '' + count
      })
    } else {
      wx.removeTabBarBadge({
        index: 0
      })
    }
  }
})