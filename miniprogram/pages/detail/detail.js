// pages/detail/detail.js

const api = require("../../utils/api.js")
const util = require("../../utils/util.js");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    selectedTask: null,
    selectedTaskBackUp: null,
    loading: false,
    repairMessage: null,
    repairer: null,
    avlible: false,
    marks: ["小白", "半小白", "略懂", "精通"],
    index1: 0,
    services: ["系统问题", "网络故障", "路由器安装", "硬件故障 ", "拆机清灰", "硬件安装（ 笔记本安装内存或固态）", "台式机组装", "软件安装", "其它"],
    index2: 0
  },


  onShow: function (options) {
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let user = util.getUser()
    var that = this
    const eventChannel = this.getOpenerEventChannel()
    /**
     * 监听上一个界面传过来的数据
     */
    eventChannel.on('data', function (data) {
      // console.log('data', data.data)
      var dataList = JSON.parse(data.data)
      let dataBackup = JSON.parse(data.data)
      dataBackup.date = new Date(dataBackup.date).getTime()
      dataBackup.orderDate = new Date(dataBackup.orderDate).getTime()
      dataBackup.repairDate = new Date(dataBackup.repairDate).getTime()
      that.setData({
        avlible: dataList.repairer == null || dataList.repairer.indexOf(user.userName) != -1,
        selectedTask: dataList,
        selectedTaskBackUp: dataBackup
      })
      that.setData({
        repairer: that.data.selectedTask.repairer
      })
      wx.setNavigationBarTitle({
        title: that.data.selectedTask.local + ' - ' + that.data.selectedTask.id
      })
    })
  },

  /**
   * 点击接单
   */
  onOrderClick: function (e) {
    var formId = e.detail.formId
    let user = util.getUser()

    this.setData({
      loading: true
    })
    // console.log(this.data.selectedTask)
    this.data.selectedTask.state = 1
    this.data.selectedTask.repairer = user.userName
    this.data.selectedTask.date = new Date(this.data.selectedTask.date).getTime()
    this.data.selectedTask.orderDate = new Date().getTime()
    this.data.selectedTask.repairDate = new Date(this.data.selectedTask.repairDate).getTime()
    var that = this
    wx.cloud.callFunction({
      name: 'post',
      data: {
        url: api.DATA.UPDATE,
        data: {
          dataJson: JSON.stringify(that.data.selectedTask),
          oldDataJson: JSON.stringify(that.data.selectedTaskBackUp),
          name: user.userName
        }
      },
      success: function (res) {
        var result = JSON.parse(res.result.body)
        let pages = getCurrentPages(); // 当前页的数据，可以输出来看看有什么东西
        let prevPage = pages[pages.length - 2]; // 上一页的数据，也可以输出来看看有什么东西
        /** 
         * 设置数据 这里面的 value 是上一页你想被携带过去的数据，后面是本方法里你得到的数据，我这里是detail.value，根据自己实际情况设置 */
        that.setData({
          loading: false
        })

        if (result.error == 1) {
          that.data.selectedTask.repairer = user.userName
          prevPage.data.dataTemp = that.data.selectedTask
          wx.navigateBack()
        } else {
          prevPage.data.dataTemp = null
          wx.showModal({
            title: '接单失败',
            content: result.msg
          })
        }
      },
      fail: function (e) {
        console.log(e)
        that.setData({
          loading: false
        })
        wx.showToast({
          title: '接单失败',
          image: '/src/images/error.png'
        })
      }
    })
  },
  /**
   * 点击反馈
   */
  onFeedback: function (e) {

    var formId = e.detail.formId
    let user = util.getUser()

    var that = this
    var mark = this.data.marks[this.data.index1]
    var service = this.data.services[this.data.index2]
    if (this.data.repairMessage == null || this.data.repairMessage == '' || this.data.repairer == null || this.data.repairer == '') {
      wx.showToast({
        title: '请填写所有字段',
        image: '/src/images/notice.png'
      })
    } else {
      this.setData({
        loading: true
      })
      this.data.selectedTask.state = 2
      this.data.selectedTask.mark = mark
      this.data.selectedTask.service = service
      this.data.selectedTask.repairMessage = this.data.repairMessage
      this.data.selectedTask.repairer = this.data.repairer
      this.data.selectedTask.date = new Date(this.data.selectedTask.date).getTime()
      this.data.selectedTask.orderDate = new Date(this.data.selectedTask.orderDate).getTime()
      this.data.selectedTask.repairDate = new Date().getTime()
      // console.log('提交反馈', JSON.stringify(this.data.selectedTask))
      wx.cloud.callFunction({
        name: 'post',
        data: {
          url: api.DATA.UPDATE,
          data: {
            dataJson: JSON.stringify(that.data.selectedTask),
            oldDataJson: JSON.stringify(that.data.selectedTaskBackUp),
            name: user.userName
          }
        },
        success: function (res) {
          var result = JSON.parse(res.result.body)
          // console.log('反馈成功', res.result.body)
          that.data.selectedTask = JSON.parse(result.body)

          that.data.selectedTask.date = util.formatTime(that.data.selectedTask.date)
          that.data.selectedTask.date = util.formatTime(that.data.selectedTask.orderDate)
          that.data.selectedTask.repairDate = util.formatTime(that.data.selectedTask.repairDate)

          that.setData({
            loading: false
          })
          let pages = getCurrentPages(); // 当前页的数据，可以输出来看看有什么东西
          let prevPage = pages[pages.length - 2]; // 上一页的数据，也可以输出来看看有什么东西
          /** 设置数据 这里面的 value 是上一页你想被携带过去的数据，后面是本方法里你得到的数据，我这里是detail.value，根据自己实际情况设置 */
          prevPage.data.dataTemp = that.data.selectedTask
          /** 返回上一页 这个时候数据就传回去了 可以在上一页的onShow方法里把 value 输出来查看是否已经携带完成 */
          wx.navigateBack()
        },
        fail: function (e) {
          console.log(e)
          that.setData({
            loading: false
          })
        }
      })
    }
  },
  /**
   * 点击转让
   */
  onMakeOver: function (e) {

    var formId = e.detail.formId
    let user = util.getUser()

    var that = this
    if (this.data.repairer.indexOf(user.userName) != -1) { //判断是否符合转让
      wx.showToast({
        title: '请修改维修人',
        image: '/src/images/notice.png'
      })
    } else {
      wx.showModal({
        title: '注意',
        content: '请确保被转让人的姓名无误',
        cancelText: '我再瞅瞅',
        confirmText: '确认无误',
        success: function (res) {
          if (res.confirm) {
            that.data.selectedTask.repairer = that.data.repairer
            that.data.selectedTask.date = new Date(that.data.selectedTask.date).getTime()
            that.data.selectedTask.orderDate = new Date(that.data.selectedTask.orderDate).getTime()
            that.data.selectedTask.repairDate = new Date(that.data.selectedTask.repairDate).getTime()
            wx.cloud.callFunction({
              name: 'post',
              data: {
                url: api.DATA.UPDATE,
                data: {
                  dataJson: JSON.stringify(that.data.selectedTask),
                  oldDataJson: JSON.stringify(that.data.selectedTaskBackUp),
                  name: user.userName
                }
              },
              success: function (res) {
                var result = JSON.parse(res.result.body)
                that.data.selectedTask = JSON.parse(result.body)
                that.data.selectedTask.date = util.formatTime(that.data.selectedTask.date)
                that.data.selectedTask.orderDate = util.formatTime(that.data.selectedTask.orderDate)
                that.data.selectedTask.repairDate = util.formatTime(that.data.selectedTask.repairDate)

                that.setData({
                  loading: false
                })
                let pages = getCurrentPages(); // 当前页的数据，可以输出来看看有什么东西
                let prevPage = pages[pages.length - 2]; // 上一页的数据，也可以输出来看看有什么东西
                /** 设置数据 这里面的 value 是上一页你想被携带过去的数据，后面是本方法里你得到的数据，我这里是detail.value，根据自己实际情况设置 */
                prevPage.data.dataTemp = that.data.selectedTask
                wx.navigateBack({})
              },
              fail: function (e) {
                console.log(e)
                that.setData({
                  loading: false
                })
              }
            })
          }
        }
      })
    }
  },
  onClickImg: function (e) {
    let uuid = this.data.selectedTask.uuid
    let currentIndex = e.target.dataset.index;
    let photoList = JSON.parse(this.data.selectedTask.photo)
    let urls = []
    for (let i = 0; i < photoList.length; i++) {
      urls.push('https://api.jiangnan-etc.site:444/file/download?path=/opt/dataDP/&fileName=' + uuid + photoList[i])
    }
    wx.previewImage({
      current: photoList[currentIndex],
      urls: urls
    })
  },
  onMarkChanged: function (e) {
    // console.log('mark', e.detail.value)
    this.setData({
      index1: e.detail.value
    })
  },
  onServiceChanged: function (e) {
    // console.log('service', e.detail.value)
    this.setData({
      index2: e.detail.value
    })
  },
  onRepairMessageChange: function (e) {
    this.data.repairMessage = e.detail.value
  },
  onRepairerChange: function (e) {
    this.data.repairer = e.detail.value
  }
})