const util = require("./util")

const TMP_IDS = ['sPPH4nt9jTTCDaIb6WfOiLBC6KSIGEyMX2BGX0Pv-Vs']

const API_HOST = "https://api.jiangnan-etc.site:444"
const USER_BASE_HOST = API_HOST + "/user"
const DATA_BASE_HOST = API_HOST + "/data"
const STATE_BASE_HOST = API_HOST + "/state"

const USER = {
  LOGIN: USER_BASE_HOST + "/login",
  GET_USER_OPEN_ID: USER_BASE_HOST + "/getUserOpenId",
  SET_USER_OPEN_ID: USER_BASE_HOST + "/setUserOpenId",
  HAVE_ROOT: USER_BASE_HOST + "/HaveRoot",
}

const DATA = {
  QUERY_ALL: DATA_BASE_HOST + "/queryAll",
  DELETE_BY_ID_LIST: DATA_BASE_HOST + "/deleteByIdList",
  MODIFY: DATA_BASE_HOST + "/modify",
  UPDATE: DATA_BASE_HOST + "/update",
}

const STATE = {
  CHECK_SERVICE: STATE_BASE_HOST + "/checkService",
  CHANGE_SERVICE: STATE_BASE_HOST + "/changeService",
}

module.exports = {
  USER: USER,
  DATA: DATA,
  STATE: STATE,
  TMP_IDS: TMP_IDS,
  requestSubscribeMessage: function () {
    if (util.getUser() !== null) {
      wx.requestSubscribeMessage({
        tmplIds: TMP_IDS,
        fail(reason) {
          console.log(reason);
        },
        success(res) {
          console.log(JSON.stringify(res));
          if (JSON.stringify(res).indexOf('accept') == -1) {
            wx.showModal({
              content: '请选择允许发送消息，以便获得更好的服务'
            })
          }
        }
      })
    }
  }
}