// Helper functions

const el = (sel, par) => (par || document).querySelector(sel);
const elNew = (tag, prop) => Object.assign(document.createElement(tag), prop);
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const noop = () => { };
const pointsDistance = (x1, x2, y1, y2) => Math.hypot(x2 - x1, y2 - y1);
const dragHandler = (el, evFn = {}) => {
    const onUp = (evt) => {
        removeEventListener("pointermove", evFn.onMove);
        removeEventListener("pointerup", onUp);
        removeEventListener("pointercancel", onUp);
        evFn.onUp?.(evt);
    };
    el.addEventListener("pointerdown", (evt) => {
        evt.preventDefault();
        addEventListener("pointermove", evFn.onMove);
        addEventListener("pointerup", onUp);
        addEventListener("pointercancel", onUp);
        evFn.onDown?.(evt);
    });
};

/**
 * ZoomPan
 * @class
 */
class ZoomPan {

    /**
     * @param {string|Node} selector String selector or Element, Node 
     * @param {object} options Customization options
     */
    constructor(selector, options = {}) {

        Object.assign(
            this,
            // Defaults
            {
                width: 800, // Canvas width
                height: 600, // Canvas height
                offsetX: 0, // Pan offset (from canvas center)
                offsetY: 0,
                scale: 1,
                scaleOld: 1,
                scaleMax: 10,
                scaleMin: 0.05,
                scaleFactor: 0.2,
                transitionDuration: 250,
                padd: 40,
                panStep: 50,
                fitOnInit: true,
                canDrag: true,
                canPinch: true,
                scrollbars: true,
                scrollbarsWidth: 14, // px
                onPan: noop,
                onPanStart: noop,
                onPanEnd: noop,
                onScale: noop,
                onInit: noop,
                onChange: noop,
            },
            // User options:
            options,
            // Overrides:
            {
                elParent: typeof selector === "string" ? el(selector) : selector,
                pinchDistance: 0, // Distance between two pointers
                isDrag: false,
                isPinch: false,
            });

        this.init();
    }

    /**
     * Initialization 
     * @return {this} instance
     */
    init() {
        this.elParent.classList.add("zoompan");
        this.elParent.style.setProperty("--scrollbarsWidth", this.scrollbars ? this.scrollbarsWidth : 0);

        // Create DIV elements viewport and canvas
        this.elViewport = elNew("div", { className: "zoompan-viewport" });
        this.elCanvas = elNew("div", { className: "zoompan-canvas" });
        this.elViewport.append(this.elCanvas);
        this.elParent.prepend(this.elViewport);

        // Create scrollbars

        if (this.scrollbars) {

            this.elTrackX = elNew("div", { className: "zoompan-track zoompan-track-x" });
            this.elThumbX = elNew("div", { className: "zoompan-thumb zoompan-thumb-x" });
            this.elTrackY = elNew("div", { className: "zoompan-track zoompan-track-y" });
            this.elThumbY = elNew("div", { className: "zoompan-thumb zoompan-thumb-y" });

            this.elTrackX.append(this.elThumbX);
            this.elTrackY.append(this.elThumbY);

            this.elParent.prepend(this.elTrackX);
            this.elParent.prepend(this.elTrackY);

            // Horizontal scrollbar track drag:
            dragHandler(this.elTrackX, {
                onDown: () => {
                    this.isDrag = true;
                    this.onPanStart();
                },
                onUp: () => {
                    this.isDrag = false;
                    this.onPanEnd();
                },
                onMove: (ev) => {
                    const area = this.getArea();
                    this.panTo(this.offsetX - (area.width / this.elTrackX.offsetWidth) * ev.movementX, this.offsetY);
                }
            });

            // Vertical scrollbar track drag:
            dragHandler(this.elTrackY, {
                onDown: () => {
                    this.isDrag = true;
                    this.onPanStart();
                },
                onUp: () => {
                    this.isDrag = false;
                    this.onPanEnd();
                },
                onMove: (ev) => {
                    const area = this.getArea();
                    this.panTo(this.offsetX, this.offsetY - (area.height / this.elTrackY.offsetHeight) * ev.movementY);
                }
            });
        }



        // Apply width height to canvas...
        this.resize();

        // ...and fit to viewport, or use option's scale and pan
        if (this.fitOnInit) {
            this.fit();
        } else {
            this.scaleTo(this.scale);
            this.panTo(this.offsetX, this.offsetY);
        }

        // Pointers

        const pointers = {
            mouse: new Map(),
            touch: new Map(),
        };

        const pointersUpdate = (ev) => pointers[ev.pointerType].set(ev.pointerId, ev);
        const pointersDelete = (ev) => pointers[ev.pointerType].delete(ev.pointerId);

        const handlePointer = (ev) => {
            // Just keep in mind that this function can be called sequentially on  
            // multiple pointers-move. If you understand that, you're good to go.

            const pointersType = pointers[ev.pointerType];
            const pointsEvts = pointersType.values();
            const pointersTot = pointersType.size;
            this.isPinch = pointersTot === 2;

            const pointer1 = pointsEvts.next().value;
            const pointer2 = pointsEvts.next().value;

            let movementX = 0;
            let movementY = 0;

            if (!this.isPinch) {
                movementX = pointer1.movementX;
                movementY = pointer1.movementY;
            }
            else if (this.canPinch && ev === pointer2) {
                movementX = (pointer1.movementX + pointer2.movementX) / 2;
                movementY = (pointer1.movementY + pointer2.movementY) / 2;
                const pointM = { // Get XY of pinch center point
                    x: pointer1.x + (pointer2.x - pointer1.x) * 0.5,
                    y: pointer1.y + (pointer2.y - pointer1.y) * 0.5,
                };

                const pinchDistanceNew = pointsDistance(pointer2.x, pointer1.x, pointer2.y, pointer1.y);
                const pinchDistanceOld = this.pinchDistance || pinchDistanceNew;
                const pinchDistanceDiff = pinchDistanceNew - pinchDistanceOld;
                this.pinchDistance = pinchDistanceNew;
                const delta = pinchDistanceDiff * 0.025;
                const newScale = this.calcScaleDelta(delta);
                const { originX, originY } = this.getPointerOrigin(pointM);

                this.scaleTo(newScale, originX, originY);
            }

            // PS: canDrag is default to true, but if one wants to use i.e: Ctrl key
            // in order to drag the area, set the default to false and than manually
            // change it to true on Ctrl key press.
            if (this.canDrag) {
                this.panTo(this.offsetX + movementX, this.offsetY + movementY);
            }
        };

        const onStart = (ev) => {
            ev.preventDefault();
            pointersUpdate(ev);

            this.isDrag = true;

            addEventListener("pointermove", onMove);
            addEventListener("pointerup", onEnd);
            addEventListener("pointercancel", onEnd);

            this.onPanStart(ev);
        };

        const onMove = (ev) => {
            pointersUpdate(ev);
            handlePointer(ev);
        };

        const onEnd = (ev) => {
            pointersDelete(ev);

            const pointersType = pointers[ev.pointerType];
            const pointersTot = pointersType.size;

            if (pointersTot < 2) {
                this.pinchDistance = 0;
            }

            if (pointersTot === 0) {
                this.isDrag = false;

                removeEventListener("pointermove", onMove);
                removeEventListener("pointerup", onEnd);
                removeEventListener("pointercancel", onEnd);
            }

            this.onPanEnd();
        };

        this.elViewport.addEventListener("pointerdown", onStart, { passive: false });

        // Fix pan on browser resize
        addEventListener("resize", () => {
            this.panTo(this.offsetX, this.offsetY);
        });

        // Emit init is done: 
        this.onInit();
        this.onChange();

        return this;
    }

    /**
     * Get pointer origin XY from pointer position
     * relative to canvas center
     * @param {PointerEvent|Object} ev Event with x,y pointer coordinates of Object {x,y}
     * @return {object} {originX, originY} offsets from canvas center
     */
    getPointerOrigin({ x, y }) {
        const vpt = this.getViewport();
        const cvs = this.getCanvas();
        const originX = x - vpt.x - cvs.x - cvs.width / 2;
        const originY = y - vpt.y - cvs.y - cvs.height / 2;
        return { originX, originY }
    }

    /**
     * Get -1 or +1 integer delta from mousewheel 
     * @param {PointerEvent|Object} ev Event with deltaY of Object with the same deltaY property
     * @return {number} -1 | +1
     */
    getWheelDelta({ deltaY }) {
        const delta = Math.sign(-deltaY);
        return delta;
    }

    /**
     * Calculate the new scale value by a given delta.
     * @param {number} delta positive or negative integer 
     * @returns {number} new scale value calmped by the defined scaleMin/Max options
     */
    calcScaleDelta(delta) {
        const scale = this.scale * Math.exp(delta * this.scaleFactor);
        const scaleNew = clamp(scale, this.scaleMin, this.scaleMax);
        return scaleNew;
    }

    /**
     * Apply new width and height to canvas
     * (Also, update the scrollbars)
     * @param {number} width 
     * @param {number} height 
     * @returns {ThisType}
     */
    resize(width, height) {
        this.width = width ?? this.width;
        this.height = height ?? this.height;
        this.elCanvas.style.width = `${this.width}px`;
        this.elCanvas.style.height = `${this.height}px`;
        this.updateScrollbars();
        return this;
    }

    /**
     * Fit (contain) canvas into viewport center.
     * Scale to fit original size (1.0) or less with "padd" spacing
     */
    fit() {
        const wRatio = this.elViewport.clientWidth / (this.elCanvas.clientWidth + this.padd * 2);
        const hRatio = this.elViewport.clientHeight / (this.elCanvas.clientHeight + this.padd * 2);
        const fitRatio = +Math.min(1, wRatio, hRatio).toFixed(1);
        this.scaleTo(fitRatio);
        this.panTo(0, 0);
        return this;
    }

    /**
     * Get client size and position of viewport
     * @returns {object} {width,height,x,y} of the viewport Element
     */
    getViewport() {
        const { width, height, x, y } = this.elViewport.getBoundingClientRect();
        return { width, height, x, y };
    }

    /**
     * Get canvas size and position relative to viewport
     * @returns {object} {width,height,x,y} of the (scaled) canvas Element
     */
    getCanvas() {
        const vpt = this.getViewport();
        const width = this.width * this.scale;
        const height = this.height * this.scale;
        const x = (vpt.width - width) / 2 + this.offsetX;
        const y = (vpt.height - height) / 2 + this.offsetY;
        return { width, height, x, y };
    }

    /**
     * Get the immaginary area size
     * PS: that area is just used to calculate the scrollbars
     * and to prevent the canvas to fully exit the viewport
     * (min visibility px defined by `padd`).
     * @returns {object} {width,height} of the fictive area
     */
    getArea() {
        const vpt = this.getViewport();
        const cvs = this.getCanvas();
        const width = (vpt.width - this.padd) * 2 + cvs.width;
        const height = (vpt.height - this.padd) * 2 + cvs.height;
        return { width, height };
    }

    /**
     * Repaint scrollbars.
     * Use after the canvas changes position or scales.
     * @return {this} instance
     */
    updateScrollbars() {
        // Ignore if scrollbars are not used
        if (!this.scrollbars) return this;

        const vpt = this.getViewport();
        const cvs = this.getCanvas();
        const area = this.getArea();
        const thumbSizeX = vpt.width ** 2 / area.width;
        const thumbSizeY = vpt.height ** 2 / area.height;
        const thumbPosX = (vpt.width - cvs.x - this.padd) / vpt.width * thumbSizeX;
        const thumbPosY = (vpt.height - cvs.y - this.padd) / vpt.height * thumbSizeY;
        const widthPercent = thumbSizeX / vpt.width * 100;
        const leftPercent = thumbPosX / vpt.width * 100;
        const heightPercent = thumbSizeY / vpt.height * 100;
        const topPercent = thumbPosY / vpt.height * 100;
        const scaleDuration = this.isPinch || this.isDrag ? 0 : this.transitionDuration;
        const translateDuration = this.isDrag ? 0 : this.transitionDuration;

        this.elThumbX.style.transition = `width ${scaleDuration}ms, left ${translateDuration}ms`;
        this.elThumbY.style.transition = `height ${scaleDuration}ms, top ${translateDuration}ms`;
        this.elCanvas.addEventListener("transitionend", () => {
            this.elThumbX.style.transition = `width 0, left 0`;
            this.elThumbY.style.transition = `height 0, top 0`;
        }, { once: true });

        this.elThumbX.style.width = `${widthPercent}%`;
        this.elThumbX.style.left = `${leftPercent}%`;
        this.elThumbY.style.height = `${heightPercent}%`;
        this.elThumbY.style.top = `${topPercent}%`;

        return this;
    }

    /**
     * Apply canvas new scale by a given delta value (i.e: +1, -1, +2, ...)
     * @param {number} delta 
     * @return {this} instance
     */
    scaleDelta(delta) {
        const scaleNew = this.calcScaleDelta(delta);
        this.scaleTo(scaleNew);
        return this;
    }

    /**
     * Scale canvas element up
     * Alias for scaling by delta +1
     * @return {this} instance
     */
    scaleUp() {
        this.scaleDelta(1);
        return this;
    }

    /**
     * Scale canvas element down
     * Alias for scaling by delta -1
     * @return {this} instance
     */
    scaleDown() {
        this.scaleDelta(-1);
        return this;
    }

    /**
     * Apply a new scale at a given origin point relative from canvas center
     * Useful when zooming in/out at a specific "anchor" point.
     * @param {number} scaleNew 
     * @param {number} originX Scale to X point (relative to canvas center)
     * @param {number} originY Scale to Y point (relative to canvas center)
     * @return {this} instance
     */
    scaleTo(scaleNew = 1, originX, originY) {
        this.scaleOld = this.scale;
        this.scale = clamp(scaleNew, this.scaleMin, this.scaleMax);

        // The default XY origin is in the canvas center, 
        // If the origin changed (i.e: by mouse wheel at
        // coordinates-from-center) use the new scaling origin:
        if (originX !== undefined && originY !== undefined) {
            // Calculate the XY as if the element is in its
            // original, non-scaled size: 
            const xOrg = originX / this.scaleOld;
            const yOrg = originY / this.scaleOld;

            // Calculate the scaled XY 
            const xNew = xOrg * scaleNew;
            const yNew = yOrg * scaleNew;

            // Retrieve the XY difference to be used as the change in offset:
            const xDiff = originX - xNew;
            const yDiff = originY - yNew;

            this.panTo(this.offsetX + xDiff, this.offsetY + yDiff, false);
        }

        this.transform();
        this.onScale();
        return this;
    }

    /**
     * Apply scale from the mouse wheel Event at the given
     * pointer origin relative to canvas center.
     * @param {WheelEvent} ev 
     * @return {this} instance
     */
    scaleWheel(ev) {
        ev.preventDefault();
        const delta = this.getWheelDelta(ev);
        const scaleNew = this.calcScaleDelta(delta);
        const { originX, originY } = this.getPointerOrigin(ev);
        this.scaleTo(scaleNew, originX, originY);
        return this;
    }

    /**
     * Pan the canvas element to the new XY offset values
     * PS: offsets are relative to the canvas center.
     * @param {number} offsetX 
     * @param {number} offsetY 
     * @param {boolean} isTransform Set to false if you're already applying transformations from the scaleTo function
     * @return {this} instance
     */
    panTo(offsetX, offsetY, isTransform = true) {
        const vpt = this.getViewport();
        const width = this.width * this.scale;
        const height = this.height * this.scale;
        // Clamp offsets to prevent canvas exit viewport
        // (and scrollbars thumbs move out of track):
        const spaceX = vpt.width / 2 + width / 2 - this.padd;
        const spaceY = vpt.height / 2 + height / 2 - this.padd;
        this.offsetX = clamp(offsetX, -spaceX, spaceX);
        this.offsetY = clamp(offsetY, -spaceY, spaceY);

        if (isTransform) {
            this.transform();
        }

        this.onPan();
        return this;
    }

    /**
     * Trigger canvas element scale and translate.  
     * Also, repaint the scrollbars
     * @return {this} instance
     */
    transform() {
        const scaleDuration = this.isPinch || this.isDrag ? 0 : this.transitionDuration;
        const translateDuration = this.isDrag ? 0 : this.transitionDuration;

        this.elCanvas.style.transition = `scale ${scaleDuration}ms, translate ${translateDuration}ms`;
        this.elCanvas.addEventListener("transitionend", () => {
            this.elCanvas.style.transition = `scale 0, translate 0`;
        }, { once: true });

        this.elCanvas.style.scale = this.scale;
        this.elCanvas.style.translate = `${this.offsetX}px ${this.offsetY}px`;

        this.updateScrollbars();
        this.onChange();

        return this;
    }

    /**
     * Pan the canvas up by panStep px.
     * @return {this} instance
     */
    panUp() {
        this.panTo(this.offsetX, this.offsetY - this.panStep);
        return this;
    }

    /**
     * Pan the canvas down by panStep px.
     * @return {this} instance
     */
    panDown() {
        this.panTo(this.offsetX, this.offsetY + this.panStep);
        return this;
    }

    /**
     * Pan the canvas left by panStep px.
     * @return {this} instance
     */
    panLeft() {
        this.panTo(this.offsetX - this.panStep, this.offsetY);
        return this;
    }

    /**
     * Pan the canvas right by panStep px.
     * @return {this} instance
     */
    panRight() {
        this.panTo(this.offsetX + this.panStep, this.offsetY);
        return this;
    }
}

export default ZoomPan
