// import 'babel-polyfill'
// var browser = require("webextension-polyfill")
// console.log(browser)
// console.log(browser.storage)
var browser = chrome

export default {
  async get (keys) {
    // let p = new Promise((resolve, reject) => {
    //   chrome.storage.local.get(keys, function (result) {
    //     resolve(result)
    //   })
    // })
    // return p
    let result = await browser.storage.local.get(keys)
    return result
  },

  async set (obj) {
    // let p = new Promise((resolve, reject) => {
    //   chrome.storage.local.set(obj, function () {
    //     resolve()
    //   })
    // })
    // return p
    let result = await browser.storage.local.set(obj)
    return result
  },

  async remove (keys) {
    // chrome.storage.local.remove(keys, function(){
    //   var error = chrome.runtime.lastError
    //     if (error) {
    //       console.error(error)
    //     }
    // })
    let result = await browser.storage.local.remove(keys)
    return result
  },

  clear () {
    this.set({})
  }
}
