// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const got = require('got');
const FormData = require('form-data');

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let body = null
  if (event.data !== undefined) {
    body = new FormData()
    Object.keys(event.data).forEach((value) => {
      body.append(value, event.data[value])
    })
  }
  let response = await got(event.url, {
    method: 'POST',
    body: body
  })

  return {
    event,
    headers: response.headers,
    body: response.body,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID
  }
}