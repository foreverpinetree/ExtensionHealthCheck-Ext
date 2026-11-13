// import 'babel-polyfill'
// var browser = require("webextension-polyfill")
var browser = chrome
class Msg {
  constructor() {

  }

  /**
   * 监听事件
   * @param {*} event 事件
   * @param {*} cb 回调
   */
  on (event, cb) {
    browser.runtime.onMessage.addListener(function(params, sender, sendResponse){
      (async () => {
        if(params.event === event){
          cb && cb(params, sender, sendResponse)
        }
      })()
      return true // 确保异步执行
    })
  }

  /**
   * content 向 bg 传事件
   * @param {*} event 事件
   * @param {*} data 传的数据
   * @param {*} cb 回调
   */
  sendMsg (event, data, cb) {
    var obj = {
      event: event,
      data: data,
    }
    // var str = JSON.stringify(obj);
    browser.runtime.sendMessage(obj, cb)
  }
  /**
   * 
   * @param {*} tabId 目标 tab 的 id
   * @param {*} event 事件
   * @param {*} data 传的数据
   * @param {*} cb 回调
   * @returns 
   */
  sendTabMsg (tabId, event, data, cb) {
    let obj = {
      event: event,
      data: data,
    }
    return browser.tabs.sendMessage(tabId, obj, cb)
  }
}


let o = new Msg()
export default o
