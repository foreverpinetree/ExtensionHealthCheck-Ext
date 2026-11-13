// eventBus.js
import mitt from "mitt";

const emitter = mitt();

// 模拟 Vue 2 的接口
const bus = {
	$on: (event, callback) => emitter.on(event, callback),
	$off: (event, callback) => {
		if (Array.isArray(event)) {
			// 如果event是数组，则遍历数组中的每个事件名并解绑
			event.forEach((e) => emitter.off(e, callback));
		} else {
			// 原有的字符串单事件处理
			emitter.off(event, callback);
		}
	},
	$emit: (event, payload) => emitter.emit(event, payload),
};

export default bus;