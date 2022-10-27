const el = (sel, par) => (par || document).querySelector(sel);
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const noop = () => { };
const drag = (evt, onDragStart, onDrag, onDragEnd) => {
    evt.preventDefault();
    onDragStart(evt);
    const move = (evt) => {
        evt.preventDefault();
        onDrag(evt);
    };
    const up = (evt) => {
        removeEventListener("pointermove", move);
        removeEventListener("pointerup", up);
        onDragEnd(evt);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
};

class ZoomPan {

    constructor(selector, options = {}) {

        Object.assign(this, {
            width: 800, // Canvas width
            height: 600, // Canvas height
            offsetX: 0, // Pan offset. 0 = From canvas center
            offsetY: 0,
            scale: 1,
            scaleFactor: 0.2,
            scaleMax: 10,
            scaleMin: 0.05,
            padd: 40,
            fitOnInit: true,
            onPan: noop,
            onPanStart: noop,
            onPanEnd: noop,
            onScale: noop,
            onInit: noop,
        }, options);

        this.elParent = typeof selector === "string" ? el(selector) : selector;
        this.elViewport = el(".zoompan-viewport", this.elParent);
        this.elCanvas = el(".zoompan-canvas", this.elParent);
        this.elTrackX = el(".zoompan-track-x", this.elParent);
        this.elThumbX = el(".zoompan-thumb-x", this.elParent);
        this.elTrackY = el(".zoompan-track-y", this.elParent);
        this.elThumbY = el(".zoompan-thumb-y", this.elParent);

        this.elParent.classList.add("zoompan");
        this.elViewport.addEventListener("wheel", (evt) => this._handleWheel(evt), { passive: false });
        this.elViewport.addEventListener("pointerdown", (evt) => this._handlePan(evt));
        this.elTrackX.addEventListener("pointerdown", (evt) => this._handleThumbX(evt));
        this.elTrackY.addEventListener("pointerdown", (evt) => this._handleThumbY(evt));
        addEventListener("resize", () => this.panTo(this.offsetX, this.offsetY));

        // Init   

        this.resize();

        if (this.fitOnInit) {
            this.fit();
        } else {
            this.scaleTo(this.scale);
            this.panTo(this.offsetX, this.offsetY);
        }

        this.onInit();
    }

    resize(width, height) {
        this.width = width ?? this.width;
        this.height = height ?? this.height;
        this.elCanvas.style.width = `${this.width}px`;
        this.elCanvas.style.height = `${this.height}px`;
    }

    fit() {
        // Fit into Viewport
        // Scale to fit original size (1.0) or less (with padd around viewport if needed)
        const wRatio = this.elViewport.clientWidth / (this.elCanvas.clientWidth + this.padd * 2);
        const hRatio = this.elViewport.clientHeight / (this.elCanvas.clientHeight + this.padd * 2);
        const fitRatio = +Math.min(1, wRatio, hRatio).toFixed(1);
        this.scaleTo(fitRatio);
        this.panTo(0, 0);
    }

    getViewport() {
        const { width, height, x, y } = this.elViewport.getBoundingClientRect();
        return { width, height, x, y };
    }

    getCanvas() {
        const vpt = this.getViewport();
        const width = this.width * this.scale;
        const height = this.height * this.scale;
        const x = (vpt.width - width) / 2 + this.offsetX;
        const y = (vpt.height - height) / 2 + this.offsetY;
        return { width, height, x, y };
    }

    getArea() {
        // Get fictive outer bounding scroll-area size.
        const vpt = this.getViewport();
        const cvs = this.getCanvas();
        const width = (vpt.width - this.padd) * 2 + cvs.width;
        const height = (vpt.height - this.padd) * 2 + cvs.height;
        return { width, height };
    }

    updateScrollbars() {
        const vpt = this.getViewport();
        const cvs = this.getCanvas();
        const area = this.getArea();
        const thumbSizeX = vpt.width ** 2 / area.width;
        const thumbSizeY = vpt.height ** 2 / area.height;
        const thumbPosX = (vpt.width - cvs.x - this.padd) / vpt.width * thumbSizeX;
        const thumbPosY = (vpt.height - cvs.y - this.padd) / vpt.height * thumbSizeY;
        this.elThumbX.style.width = `${thumbSizeX / vpt.width * 100}%`;
        this.elThumbX.style.left = `${thumbPosX / vpt.width * 100}%`;
        this.elThumbY.style.height = `${thumbSizeY / vpt.height * 100}%`;
        this.elThumbY.style.top = `${thumbPosY / vpt.height * 100}%`;
    }

    scaleDelta(delta) {
        const scaleNew = this._calcScaleDelta(delta);
        this.scaleTo(scaleNew);
    }

    scaleUp() {
        return this.scaleDelta(1);
    }

    scaleDown() {
        return this.scaleDelta(-1);
    }

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

            this.panTo(this.offsetX + xDiff, this.offsetY + yDiff);
        } else {

            this.updateScrollbars();
        }
        this.elCanvas.style.scale = this.scale;
        this.onScale();

    }

    panTo(offsetX, offsetY) {
        const vpt = this.getViewport();
        const width = this.width * this.scale;
        const height = this.height * this.scale;
        // Clamp offsets to prevent canvas exit viewport
        // (and scrollbars thumbs move out of track):
        const spaceX = vpt.width / 2 + width / 2 - this.padd;
        const spaceY = vpt.height / 2 + height / 2 - this.padd;
        this.offsetX = clamp(offsetX, -spaceX, spaceX);
        this.offsetY = clamp(offsetY, -spaceY, spaceY);

        this.updateScrollbars();
        this.elCanvas.style.translate = `${this.offsetX}px ${this.offsetY}px`;
        this.onPan();
    }

    _calcScaleDelta(delta) {
        const scale = this.scale * Math.exp(delta * this.scaleFactor);
        return clamp(scale, this.scaleMin, this.scaleMax);
    }

    _handleWheel(evt) {
        evt.preventDefault();

        const vpt = this.getViewport();
        const cvs = this.getCanvas();

        const delta = Math.sign(-evt.deltaY);
        const scaleNew = this._calcScaleDelta(delta);
        // Get XY coordinates from canvas center:
        const originX = evt.x - vpt.x - cvs.x - cvs.width / 2;
        const originY = evt.y - vpt.y - cvs.y - cvs.height / 2;

        this.scaleTo(scaleNew, originX, originY);
    }

    _handlePan(evt) {
        drag(evt,
            () => this.onPanStart(),
            (ev) => {
                this.panTo(this.offsetX + ev.movementX, this.offsetY + ev.movementY);
            },
            () => this.onPanEnd()
        );
    }

    _handleThumbX(evt) {
        drag(evt,
            () => this.onPanStart(),
            (ev) => {
                const area = this.getArea();
                this.panTo(this.offsetX - (area.width / this.elTrackX.offsetWidth) * ev.movementX, this.offsetY);
            },
            () => this.onPanEnd()
        );
    }

    _handleThumbY(evt) {
        drag(evt,
            () => this.onPanStart(),
            (ev) => {
                const area = this.getArea();
                this.panTo(this.offsetX, this.offsetY - (area.height / this.elTrackY.offsetHeight) * ev.movementY);
            },
            () => this.onPanEnd()
        );
    }
}

export default ZoomPan
