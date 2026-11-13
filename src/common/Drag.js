class Drag {
	constructor() {
		this._dragArea = null;
		this._target = null;

		this._oldMouseX = 0;
		this._oldMouseY = 0;

		this._currentX = 0;
		this._currentY = 0;

		this._dragAreas = new Map();
		this._callbacks = new Map();

		this.ignoreNodes = ["INPUT", "OPTION", "SELECT", "TEXTAREA", "BUTTON"];

		this._onStartDragHandler = this._onStartDrag.bind(this);
		this._onDraggingHandler = this._onDragging.bind(this);
		this._onStopDragHandler = this._onStopDrag.bind(this);
	}

	listen(dragArea, dragTarget = null, callback = null) {
		this.cancel(dragArea);
		this._dragAreas.set(dragArea, dragTarget || dragArea);
		this._callbacks.set(dragArea, callback);

		let element = dragArea;
		element.addEventListener("mousedown", this._onStartDragHandler, false);
		element.customTarget = dragArea;
	}

	cancel(dragArea) {
		if (!dragArea || !this._dragAreas.get(dragArea)) {
			return;
		}

		let element = dragArea;
		element.removeEventListener("mousedown", this._onStartDragHandler, false);
		element.customTarget = null;

		this._dragAreas.delete(dragArea);
		this._callbacks.delete(dragArea);

		window.removeEventListener("mouseup", this._onStopDragHandler, false);
		window.removeEventListener("mousemove", this._onDraggingHandler, false);
	}

	cancelAll() {
		for (const dragArea of this._dragAreas.keys()) {
			this.cancel(dragArea);
		}
	}

	_onStartDrag(evt) {
		if (evt.target.closest(".ignore-drag")) {
			return;
		}

		const element = evt.currentTarget || evt;
		const dragArea = element.customTarget || element;
		const target = this._dragAreas.get(dragArea);
		if (!target) {
			return;
		}

        document.body.classList.add("is-dragging");

		this._target = target;
		this._dragArea = dragArea;

		window.removeEventListener("mouseup", this._onStopDragHandler, false);
		window.removeEventListener("mousemove", this._onDraggingHandler, false);

		window.addEventListener("mouseup", this._onStopDragHandler, false);
		window.addEventListener("mousemove", this._onDraggingHandler, false);

		const pos = { x: evt.clientX, y: evt.clientY };

		this._oldMouseX = pos.x;
		this._oldMouseY = pos.y;

		const x = parseFloat(target.style.left || 0);
		const y = parseFloat(target.style.top || 0);

		this._currentX = x;
		this._currentY = y;

		const callback = this._callbacks.get(dragArea);
		if (callback) {
			callback.call(this, "start", { x: this._currentX, y: this._currentY });
		}
	}

	_onDragging(evt) {
		evt.preventDefault();

		const pos = { x: evt.clientX, y: evt.clientY };

		this._currentX += pos.x - this._oldMouseX;
		this._currentY += pos.y - this._oldMouseY;

		this._oldMouseX = pos.x;
		this._oldMouseY = pos.y;

		const style = this._target.style;
		if (style) {
			style.left = this._currentX + "px";
			style.top = this._currentY + "px";
		}

		const callback = this._callbacks.get(this._dragArea);
		if (callback) {
			callback.call(this, "dragging", { x: this._currentX, y: this._currentY });
		}
	}

	_onStopDrag(evt) {
        document.body.classList.remove("is-dragging");

		window.removeEventListener("mouseup", this._onStopDragHandler, false);
		window.removeEventListener("mousemove", this._onDraggingHandler, false);

		const callback = this._callbacks.get(this._dragArea);
		if (callback) {
			callback.call(this, "stop", { x: this._currentX, y: this._currentY });
		}
	}

	reset() {
		this.cancelAll();
	}
}

export default new Drag();
