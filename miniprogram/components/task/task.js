const api = require("../../utils/api");
const util = require("../../utils/util");

// components/task/task.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    dataList: {
      type: JSON,
      value: null
    },
    noMoreData: {
      type: Boolean,
      value: null
    },
    checked: {
      type: Boolean,
      value: null
    },
    isAdmin: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onTaskClick: function (e) {
      api.requestSubscribeMessage()
      /**
       *从e获取当前的task的id（data-task-id），并传给triggerEvent的第二个参数
       *在page的bindtaskclick的e.details接收
       *
       */
      this.triggerEvent('taskclick', e.currentTarget.dataset.task);
    },
    onTaskOrder: function (e) {
      this.triggerEvent('taskorder', e.currentTarget.dataset.task);
    },
    onChecked: function (e) {
      this.triggerEvent('onchecked', e.currentTarget.dataset.id)
    },
    onDeleteClick: function (e) {
      let user = util.getUser()
      if (user == null) {
        util.pleaseLoginFirst()
      } else {
        var that = this
        wx.showModal({
          title: '注意',
          content: '删除仅限无用的报修单，删除后无法还原，请谨慎操作',
          success: function (res) {
            if (res.confirm) {
              that.triggerEvent('ondelete', e.currentTarget.dataset.id)
            }
          }
        })
      }
    }
  }
})