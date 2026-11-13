<template>
    <div class="padbox content is-small">
        <h2 class="is-size-6">监控使用说明</h2>
        <ul>
            <li>绿色盾牌：最近一次完整巡检正常。</li>
            <li>红色盾牌：存在连续两次访问失败的服务，角标显示错误数量。</li>
            <li>黄色盾牌：服务器不可达、结果过期、监控异常或等待首次检测。</li>
        </ul>
        <p>服务器每 3 小时巡检一次；插件默认每 10 分钟读取状态。查询状态不会触发重新巡检。</p>
        <p>监控无需登录。服务器地址和插件查询间隔可以在监控首页的设置中修改。</p>
        <router-link to="/" class="button is-small is-fullwidth">返回监控首页</router-link>
    </div>
</template>
