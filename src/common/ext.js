
const EVENT = {} // 时间
const APP = {} // 应用的全局参数

APP.NAME = 'ExtensionHealthCheck'
APP.DISPLAY_NAME = 'Extension Health Check'
APP.ENV = process.env.NODE_ENV === 'development' ? 0 : 1;
APP.BROSWER = process.env.BROSWER || 'chrome'
APP.MINUTES = 1000 * 60 // 一分钟,
APP.REQUEST_INTERVALS = [8, 10, 12, 15]
APP.FREE_MAX_NUM = 10 // 免费用户的最多导出数量
APP.PRO_MAX_NUM = 5000 // 付费用户最多导出数量
APP.FAQ_PAGE_URL = 'https://extensionhealthcheck.extensionsbox.com/#faqs'
APP.VENDOR = 138140
APP.UNINSTALL_URL = ''
APP.GUIDE_LINK = 'https://extensionhealthcheck.extensionsbox.com'
APP.PDF_FOLDER = 'ExtensionHealthCheck' // default sub-folder of Downloads for PDF exports

EVENT.GET_PANEL_INFO_HTML = 'get_panel_info_html'

EVENT.QUERY_TASKS = 'query_tasks'
EVENT.SAVE_TASKS = 'save_tasks'
EVENT.START_TASK = 'start_task'
EVENT.STOP_TASK = 'stop_task'

EVENT.DOWNLOAD_ITEM = 'download_item'
EVENT.DOWNLOAD_PDF = 'download_pdf'
EVENT.FETCH_IMAGE = 'fetch_image'

EVENT.OPEN_TAB = 'open_tab'
EVENT.GET_TAB = 'get_tab'

EVENT.SUBSCRIBE = 'subscribe' // 订阅

// eventbus -------------------
EVENT.START_SCRAPE_DATA = 'start_scrape_data'
EVENT.EXPORT_DATA = 'export_data' // 导出数据
EVENT.EXPORT_PDF_PROGRESS = 'export_pdf_progress'
EVENT.EXPORT_PDF_COMPLETE = 'export_pdf_complete'
EVENT.CLOSE_PANEL = 'close_panel' // 关闭面板

EVENT.EXPORT_MEDIA_PROGRESS = 'export_media_progress' // 导出媒体进度
EVENT.EXPORT_MEDIA_COMPLETE = 'export_media_complete' // 导出媒体完成
EVENT.CANCEL_EXPORT_MEDIA = 'cancel_export_media' // 取消导出媒体

// end eventbus ---------------

EVENT.PAGE_LOAD_COMPLETE = 'complete' // tabs event
EVENT.PAGE_LOADING = 'loading' // tabs event
EVENT.PAGE_ACTIVED = 'page_actived'

// 价格倒数完毕
EVENT.COUNTDOWN_COMPLETE = 'countdown_complete'

EVENT.OPEN_DASKBOARD = 'open_daskboard'
EVENT.START_DOWNLOAD = 'start_download'

EVENT.SHOW_ERROR = 'show_error' // 显示错误信息

EVENT.GA_EVENT = 'ga_event'
// 行为数据分析
const ACTION = {}

// 订阅类别
const SUBSCRIPTION = {}
SUBSCRIPTION.YEARLY = 'yearly'
SUBSCRIPTION.QUARTERLY = 'quarterly'
SUBSCRIPTION.MONTHLY = 'monthly'
SUBSCRIPTION.DAILY = 'daily'

let HOST // 后端地址
let PADDLE_URL // 用于支付的页面(保证支付能传参数)
let STRIPE_URL
if(APP.ENV === 1){
  HOST = 'https://extensionhealthcheck.extensionsbox.com' // 官网
  PADDLE_URL = 'https://buy.extensionsbox.com/paddle'
  STRIPE_URL = 'https://extensionhealthcheck.extensionsbox.com/stripe';
  // HOST = 'http://localhost:9001'
  // PADDLE_URL = 'http://localhost:9001/paddle'
  // STRIPE_URL = 'http://localhost:9001/stripe'
}else{
  HOST = 'http://localhost:9001'
  PADDLE_URL = 'http://localhost:9001/paddle'
  STRIPE_URL = 'http://localhost:9001/stripe'
}

export default {
  EVENT,
  APP,
  HOST,
  ACTION,
  SUBSCRIPTION,
  PADDLE_URL,
  STRIPE_URL,
}
