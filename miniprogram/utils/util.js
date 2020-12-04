function formatTime(timeStamp) {
  var date = new Date(timeStamp)
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()
  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * 数据分页
 * @param start 开始的位置
 * @param count 个数
 */
function limit(jsonList, start, count) {
  let filterRes = jsonList.filter((ele, index) => {
    return index >= start && index <= start + count - 1
  })
  return filterRes
}

/**
 * 数据精确筛选
 * @param propertyName 属性名
 * @param value 想要的的值
 */
function query(jsonList, propertyName, value) {
  let filterRes = jsonList.filter((ele, index) => {
    return ele[propertyName] == value
  })
  return filterRes
}

/**
 * 数据精确筛选
 * @param propertyName 属性名
 * @param value 不要的值
 */
function remove(jsonList, propertyName, value) {
  return jsonList.filter((ele, _) => {
    return ele[propertyName] != value
  })
}

/**
 * 数据模糊筛选
 * @param propertyName 属性名
 * @param value 包含的值
 */
function contain(jsonList, propertyName, value) {
  let filterRes = jsonList.filter((ele, _) => {
    return ele[propertyName].indexOf(value) != -1
  })
  return filterRes
}

//json数组排序，降序
function compare(property) {
  return function (a, b) {
    var value1 = a[property];
    var value2 = b[property];
    return -value1 + value2;
  }
}

/**
 * 使用test方法实现模糊查询
 * @param {Array} jsonList  原数组
 * @param {String} keyWord  查询的关键词
 * @return {Array}  查询的结果
 */
function search(jsonList, keyWord) {
  let reg = new RegExp('(?=' + keyWord + ')', 'gm');
  let filterRes = jsonList.filter((ele, _) => {
    return reg.test(JSON.stringify(ele))
  })
  return filterRes
}

/** 
 * 时间戳转化为年 月 日 时 分 秒 
 * number: 传入时间戳 
 * format：返回格式，支持自定义，但参数必须与formateArr里保持一致 
 */
function formatTimeTwo(number, format) {

  var formateArr = ['Y', 'M', 'D', 'h', 'm', 's'];
  var returnArr = [];

  var date = new Date(number * 1000);
  returnArr.push(date.getFullYear());
  returnArr.push(formatNumber(date.getMonth() + 1));
  returnArr.push(formatNumber(date.getDate()));

  returnArr.push(formatNumber(date.getHours()));
  returnArr.push(formatNumber(date.getMinutes()));
  returnArr.push(formatNumber(date.getSeconds()));

  for (var i in returnArr) {
    format = format.replace(formateArr[i], returnArr[i]);
  }
  return format;
}

/**
 * 已知两个时间戳
 * 计算两个时间差
 */
function diffTime(startDate, endDate) {
  var diff = endDate - startDate; //时间差的毫秒数

  //计算出相差天数
  var days = Math.floor(diff / (24 * 3600 * 1000));

  //计算出小时数
  var leave1 = diff % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
  var hours = Math.floor(leave1 / (3600 * 1000));
  //计算相差分钟数
  var leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
  var minutes = Math.floor(leave2 / (60 * 1000));

  //计算相差秒数
  var leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
  var seconds = Math.round(leave3 / 1000);

  var returnStr = seconds + "秒";
  if (minutes > 0) {
    returnStr = minutes + "分" + returnStr;
  }
  if (hours > 0) {
    returnStr = hours + "小时" + returnStr;
  }
  if (days > 0) {
    returnStr = days + "天" + returnStr;
  }
  // return returnStr;
  return days;
}

function getUser() {
  var userJson = wx.getStorageSync('user')
  // console.log('getUser.userJson', userJson);
  if (userJson == null || userJson == '') {
    return null
  }
  return JSON.parse(userJson)
}

function setUser(user) {
  // console.log('setUser', user);
  wx.setStorageSync('user', JSON.stringify(user))
}

module.exports = {
  formatTime: formatTime,
  formatTimeTwo: formatTimeTwo,
  diffTime: diffTime,
  compare: compare,
  limit: limit,
  query: query,
  remove: remove,
  contain: contain,
  getUser: getUser,
  setUser: setUser,
  search: search,
  pleaseLoginFirst: function () {
    wx.showModal({
      content: '请先登录',
      success: function (res) {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/myself/myself',
          })
        }
      }
    })
  }
}