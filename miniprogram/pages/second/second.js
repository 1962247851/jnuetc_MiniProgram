//获取应用实例
const api = require("../../utils/api.js");
const util = require("../../utils/util.js");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    user: null,
    dataListAll: null,

    dataList1: null,
    dataList1Backup: null,
    dataListTemp1: null,
    dataListTemp1Backup: null,
    noMoreData1: null,
    deleteIds1: [],
    checked1: null,

    dataList2: null,
    dataList2Backup: null,
    dataListTemp2: null,
    dataListTemp2Backup: null,
    noMoreData2: null,
    deleteIds2: [],
    checked2: null,

    titles: ['处理中', '已维修'],
    current: 0,
    contentheight: 0,
    isSearching: false,
    dataTemp: null,
    selectindicatorcolor: '#008EFA',
    normalindicatorcolor: '#666666'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //减号前面是获取当前窗体的高度单位为px，70是头部tab的高度，单位是rpx，减号后面部分是将rpx转px
    var contentH = wx.getSystemInfoSync().windowHeight - 80 / 750 * wx.getSystemInfoSync().windowWidth;
    this.setData({
      contentheight: contentH,
      user: util.getUser()
    })
    wx.startPullDownRefresh()
  },


  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var data = this.data.dataTemp
    if (data != null) {
      //更新
      for (var i = 0; i < this.data.dataListAll.length; i++) {
        if (this.data.dataListAll[i].id == data.id) {
          this.data.dataListAll[i] = data
          break
        }
      }
      if (data.state == 2) { //反馈完成
        // 删除该单
        this.data.dataListTemp1 = util.remove(this.data.dataListTemp1, 'id', data.id)
        this.setData({
          dataListTemp1: this.data.dataListTemp1
        })

        this.data.dataListTemp1Backup = util.remove(this.data.dataListTemp1Backup, 'id', data.id)
        this.data.dataList1Backup = util.remove(this.data.dataList1Backup, 'id', data.id)
        this.data.dataList1 = util.remove(this.data.dataList1, 'id', data.id)

        //后移一位
        for (var i = this.data.dataListTemp2.length; i > 0; i--) {
          this.data.dataListTemp2[i] = this.data.dataListTemp2[i - 1]
        }
        //插到最前面
        this.data.dataListTemp2[0] = data
        this.setData({
          dataListTemp2: this.data.dataListTemp2
        })

        // //后移一位
        // for (var i = this.data.dataListTemp2Backup.length; i > 0; i--) {
        //   this.data.dataListTemp2Backup[i] = this.data.dataListTemp2Backup[i - 1]
        // }
        // //插到最前面
        // this.data.dataListTemp2Backup[0] = data
        // //后移一位
        // for (var i = this.data.dataList2Backup.length; i > 0; i--) {
        //   this.data.dataList2Backup[i] = this.data.dataList2Backup[i - 1]
        // }
        // //插到最前面
        // this.data.dataList2Backup[0] = data
        //后移一位
        for (var i = this.data.dataList2.length; i > 0; i--) {
          this.data.dataList2[i] = this.data.dataList2[i - 1]
        }
        //把最后一个插到最前面
        this.data.dataList2[0] = data

        wx.showToast({
          title: '反馈成功',
        })

      } else { //转让成功
        //更新
        // console.log(data)
        for (var i = 0; i < this.data.dataListTemp1.length; i++) {
          if (this.data.dataListTemp1[i].id == data.id) {
            this.data.dataListTemp1[i] = data
            break
          }
        }
        this.setData({
          dataListTemp1: this.data.dataListTemp1
        })
        wx.showToast({
          title: '转让成功',
        })
      }
      this.data.dataTemp = null
    }
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

                //去掉未结单的
                that.data.dataListAll = util.remove(dataListAll, 'state', 0)
                //处理中
                that.data.dataList1 = util.query(dataListAll, 'state', 1)
                that.data.dataList1Backup = that.data.dataList1
                let titles = new Array(2)
                titles[0] = "处理中（" + that.data.dataList1.length + "）"
                //已维修
                that.data.dataList2 = util.query(dataListAll, 'state', 2)
                that.data.dataList2Backup = that.data.dataList2
                titles[1] = "已维修（" + that.data.dataList2.length + "）"
                // 按维修时间降序
                that.data.dataList2.sort(function (a, b) {
                  return b.repairDate - a.repairDate
                });

                //判断是否还有更多数据
                that.setData({
                  noMoreData1: that.data.dataList1.length < 10,
                  noMoreData2: that.data.dataList2.length < 10
                })

                //只显示10个数据
                that.data.dataListTemp1 = util.limit(that.data.dataList1, 0, 10)
                that.data.dataListTemp2 = util.limit(that.data.dataList2, 0, 10)

                //通知ui刷新界面备份数据
                that.setData({
                  dataListTemp1: that.data.dataListTemp1,
                  dataListTemp2: that.data.dataListTemp2,
                  dataListTemp1Backup: that.data.dataListTemp1,
                  dataListTemp2Backup: that.data.dataListTemp2,
                  titles: titles
                })

                //备份数据
                // that.data.dataListTemp1Backup = that.data.dataListTemp1
                // that.data.dataListTemp2Backup = that.data.dataListTemp2

                wx.stopPullDownRefresh()
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
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.updateDatas()
  },

  onReachBottomSwiper: function () {
    var current = this.data.current
    //当前页面的datalist
    var list = current == 0 ? this.data.dataList1 : this.data.dataList2
    var listTemp = current == 0 ? this.data.dataListTemp1 : this.data.dataListTemp2
    var currentCount = listTemp.length

    if (currentCount == list.length) {
      current == 0 ? this.setData({
        noMoreData1: true
      }) : this.setData({
        noMoreData2: true
      })
    } else {
      if (current == 0) {
        this.data.dataListTemp1 = util.limit(list, 0, currentCount + 10)
        if (!this.data.isSearching) {
          this.data.dataListTemp1Backup = this.data.dataListTemp1
        }
        this.setData({
          dataListTemp1: this.data.dataListTemp1,
          noMoreData1: this.data.dataListTemp1.length == list.length
        })
      } else {
        this.data.dataListTemp2 = util.limit(list, 0, currentCount + 10)
        if (!this.data.isSearching) {
          this.data.dataListTemp2Backup = this.data.dataListTemp2
        }

        this.setData({
          dataListTemp2: this.data.dataListTemp2,
          noMoreData2: this.data.dataListTemp2.length == list.length
        })
      }
    }
  },

  /**
   * 点击任务进入详情页
   */
  onTaskClick: function (e) {
    let user = util.getUser()
    if (user != null) {
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

  onSearchInput: function (e) {
    //当清空输入的时候恢复原来的数据
    if (e.detail.value == '') {
      //恢复原来的数据
      this.data.isSearching = false
      this.data.dataList1 = this.data.dataList1Backup
      this.data.dataList2 = this.data.dataList2Backup
      this.setData({
        dataListTemp1: this.data.dataListTemp1Backup,
        dataListTemp2: this.data.dataListTemp2Backup
      })
    } else {
      this.data.isSearching = true
    }
  },

  onChecked1: function (e) {
    // console.log(e.detail)
    var id = e.detail
    var hasId = false

    for (var i = 0; i < this.data.deleteIds1.length; i++) {
      if (this.data.deleteIds1[i] == id) {
        this.data.deleteIds1[i] = null
        hasId = true
        break
      }
    }
    if (!hasId) {
      this.data.deleteIds1[this.data.deleteIds1.length] = id
    }
  },

  onDelete1: function (e) {
    let user = util.getUser()
    if (user == null) {
      util.pleaseLoginFirst()
    } else {
      var noSelect = null
      for (var i = 0; i < this.data.deleteIds1.length; i++) {
        if (this.data.deleteIds1[i] != null) {
          noSelect = false
          break
        }
      }
      if (noSelect != null && !noSelect) {
        wx.showLoading({
          title: '删除中',
        })
        var that = this
        // console.log('delete1', this.data.deleteIds1)
        var idsString = '['
        for (var i = 0; i < this.data.deleteIds1.length; i++) {
          if (this.data.deleteIds1[i] != null) {
            idsString += this.data.deleteIds1[i]
            if (i != this.data.deleteIds1.length - 1) {
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
            // console.log(res)
            if (result.error === 1) {
              //移除这些数据
              for (var i = 0; i < that.data.deleteIds1.length; i++) {
                if (that.data.deleteIds1[i] != null) {
                  that.data.dataListAll = util.remove(that.data.dataListAll, 'id', that.data.deleteIds1[i])
                  that.data.dataList1 = util.remove(that.data.dataList1, 'id', that.data.deleteIds1[i])
                  that.data.dataList1Backup = util.remove(that.data.dataList1Backup, 'id', that.data.deleteIds1[i])
                  that.data.dataListTemp1 = util.remove(that.data.dataListTemp1, 'id', that.data.deleteIds1[i])
                  that.data.dataListTemp1Backup = util.remove(that.data.dataListTemp1, 'id', that.data.deleteIds1[i])
                }
              }
              that.data.titles[0] = "处理中（" + that.data.dataList1.length + "）"
              that.setData({
                dataListTemp1: that.data.dataListTemp1,
                checked1: false,
                titles: that.data.titles
              })
              wx.hideLoading()
              wx.showToast({
                title: '删除成功',
              })
              //清空选中的数据
              for (var i = 0; i < that.data.deleteIds1.length; i++) {
                that.data.deleteIds1[i] = null
              }
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

  onChecked2: function (e) {
    // console.log(e.detail)
    var id = e.detail
    var hasId = false

    for (var i = 0; i < this.data.deleteIds2.length; i++) {
      if (this.data.deleteIds2[i] == id) {
        this.data.deleteIds2[i] = null
        hasId = true
        break
      }
    }
    if (!hasId) {
      this.data.deleteIds2[this.data.deleteIds2.length] = id
    }
  },

  onDelete2: function (e) {
    let user = util.getUser()
    if (user == null) {
      util.pleaseLoginFirst()
    } else {
      var noSelect = null
      for (var i = 0; i < this.data.deleteIds2.length; i++) {
        if (this.data.deleteIds2[i] != null) {
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
        for (var i = 0; i < this.data.deleteIds2.length; i++) {
          if (this.data.deleteIds2[i] != null) {
            idsString += this.data.deleteIds2[i]
            if (i != this.data.deleteIds2.length - 1) {
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
            //console.log(res)
            if (result.error === 1) {
              //移除这些数据
              for (var i = 0; i < that.data.deleteIds2.length; i++) {
                if (that.data.deleteIds2[i] != null) {
                  that.data.dataListAll = util.remove(that.data.dataListAll, 'id', that.data.deleteIds2[i])
                  that.data.dataList2 = util.remove(that.data.dataList2, 'id', that.data.deleteIds2[i])
                  that.data.dataList2Backup = util.remove(that.data.dataList2Backup, 'id', that.data.deleteIds2[i])
                  that.data.dataListTemp2 = util.remove(that.data.dataListTemp2, 'id', that.data.deleteIds2[i])
                  that.data.dataListTemp2Backup = util.remove(that.data.dataListTemp2, 'id', that.data.deleteIds2[i])
                }
              }
              that.data.titles[1] = "已维修（" + that.data.dataList2.length + "）"
              that.setData({
                dataListTemp2: that.data.dataListTemp2,
                checked2: false,
                titles: that.data.titles
              })
              wx.hideLoading()
              wx.showToast({
                title: '删除成功',
              })
              //清空选中的数据
              for (var i = 0; i < that.data.deleteIds2.length; i++) {
                that.data.deleteIds2[i] = null
              }
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
  /**
   * 点击键盘上的搜索 
   */
  onSearch: function (e) {
    let user = util.getUser()
    if (user != null) {
      var inputString = e.detail.value
      if (this.data.inputString != '') {
        this.data.isSearching = true
        if (this.data.current == 0) {
          //搜索到的结果
          this.data.dataList1 = util.search(this.data.dataList1, inputString)
          //只显示10个数据
          this.data.dataListTemp1 = util.limit(this.data.dataList1, 0, 10)

          //通知ui刷新界面备份数据
          this.setData({
            dataListTemp1: this.data.dataListTemp1
          })
        } else {
          //搜索到的结果
          this.data.dataList2 = util.search(this.data.dataList2, inputString)
          //只显示10个数据
          this.data.dataListTemp2 = util.limit(this.data.dataList2, 0, 10)

          //通知ui刷新界面备份数据
          this.setData({
            dataListTemp2: this.data.dataListTemp2
          })
        }

      } else {
        //恢复原来的数据
        this.data.isSearching = false
        this.data.dataList1 = this.data.dataList1Backup
        this.data.dataList2 = this.data.dataList2Backup
        this.setData({
          dataListTemp1: this.data.dataListTemp1Backup,
          dataListTemp2: this.data.dataListTemp2Backup
        })
      }
    } else {
      util.pleaseLoginFirst()
    }
  },
  taptab(e) {
    var index = e.currentTarget.dataset.index
    this.setData({
      current: index
    })
  },
  bindChange(e) {
    this.setData({
      current: e.detail.current
    })
  },
})