# 插件的开发操作

### 服务健康监控

- 插件后台通过 `chrome.alarms` 每 10 分钟查询服务器的 `/api/status`，安装、浏览器启动及过期缓存唤醒时也会查询。无需登录，点击图标直接展示监控首页。
- Popup 的“监控设置”可修改服务器地址和间隔（最少 1 分钟），保存在 `chrome.storage.local`；默认地址取 `src/common/ext.js` 的 `HOST`，默认间隔定义在 `src/common/health.js`。修改后立即生效并查询一次。
- 绿色盾牌勾号表示完整巡检正常；红色盾牌叹号表示 URL 出错，图标角标显示错误数（超过 99 显示 `99+`）；黄色盾牌和 `?` 表示监控不可达、超时、配置异常、结果过期或等待首次检测，不会因断线显示绿色。
- Popup 展示服务总数、正常/异常数、查询和巡检时间，支持“立即查询”（只读取状态，不触发巡检）；“查看详情”在新标签打开当前服务器首页 `/`。服务器无法连接时保留上次快照，但明确显示状态待确认。
- 插件不包含登录、Google OAuth、Parse 账号或付费账户逻辑，也不会获取用户身份。旧账号/订阅页面及相关后台处理已移除。
- 三种图标的 SVG 源文件及 19、38、128 像素 PNG 位于 `src/icons/health-*`。Chrome 与 Edge manifest 均配置了 alarms 权限及默认待确认图标。
- 监控功能只使用后台与 Popup，不向网页注入内容脚本；已移除模板残留的采集脚本和不存在的面板样式构建入口，原有源码仍保留。
- 本地验证：`npm run test:health`；构建：`npm run build`，然后在浏览器扩展管理页面重新加载 `dist`。浏览器休眠期间 alarm 可能延迟，恢复后会继续查询。

### Substack 文章采集

- Posts / Archive 会先获取文章列表，再逐篇请求详情；同一页的详情全部处理完后才推进分页游标。详情请求间隔为 5–7 秒，暂停/恢复会保留未完成的文章队列。
- PDF 使用详情响应 `post.body_html` 中的正文和内嵌图片，并合并详情的作者、刊物等信息；详情请求失败时显示错误并保留待重试文章，不把列表摘要当作完整正文。付费或受限正文仍以当前登录账户的接口可见内容为准。
- 详情流程验证：`node --test tests\post-detail.test.cjs`。

- 在用户主页的 Posts、Notes 标签或刊物 Archive 页面启动采集。Posts 和 Activity 使用页面请求中捕获的用户 ID；如提示缺少请求，请先打开对应标签或刷新页面。
- Posts 使用 `next_cursor`，Activity 使用 `cursor`，Archive 使用 `offset` 分页；Archive 保留当前请求或页面的排序及搜索条件。
- 内部仅保留 `post` 和 `activity` 两种 tab：Posts 与 Archive 共用 `post` tab，Activity 独立维护解析逻辑；`shared` 仅包含通用的导出单元格和行转换工具。
- 导出包括文章标题、摘要、接口可见正文、作者、刊物、标签、互动统计、图片/音视频链接和活动上下文。JSON 保留数组和对象，CSV/Excel 将其转换为文本。
- 付费或受限文章只导出接口实际返回的内容，不补全或绕过付费正文。Activity 样本仅包含文章，其他不支持的活动实体会明确报错。
- 面板支持暂停/恢复、CSV/Excel/JSON 下载及完成后自动下载；不提供跨会话断点续采。
- 本地验证：`node --test tests\substack-data.test.cjs`；生产构建：`npm run build`。

### 注意
第三方包用了 `PNPM` 进行管理

### 一个完整的插件结构
目前整体框架是分三部分：**插件（前端）、插件后端（nodejs）、支付管理后端（nodejs）**

**插件** - 就是插件的结构，纯 js 的项目
**插件后端** - 每一个插件都对应一个后端项目，此后端项目主要是处理业务逻辑、用户管理等
**支付管理后端** - 所有的插件都是由此后端统一进行支付管理

### 前端 UI 框架

UI 框架使用：[https://bulma.io/](https://bulma.io/)，主要参考样式，网格的使用。

Vue 版本 Buefy [https://buefy.org/](https://buefy.org/)，Vue 版本，提供了很多好用的控件。


### 插件的名字
插件名称在 `src/common/ext.js` 中配置，仅用于标识监控工具。
```javascript
APP.NAME = 'ExtensionHealthCheck'
```

### 插件的后端服务地址

如果 `ENV === 1` 代表是生产环境。默认地址在 `src/common/ext.js` 中配置，也可在 Popup 中覆盖，无需 AppID、账号或登录令牌。
```javascript
if(APP.ENV === 1){
  HOST = 'https://extensionhealthcheck.extensionsbox.com'
}else{
  HOST = 'http://localhost:9001'
}
```


### 开发环境，监听文件变动
```bash
npm run watch
```

### 开发环境，监听文件变动，自动刷新
```bash
npm run start
```

### 生成生产环境的文件
```bash
npm run build
```

### 生成生产环境的压缩包
```bash
npm run build-zip
```

### 以上的操作都可以通过

```bash
sh st.sh // 开发
sh build.sh // 生成生产环境文件
sh zip.sh // 生产环境压缩包
```