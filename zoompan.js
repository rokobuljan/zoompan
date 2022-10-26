const el = (sel, par) => (par || document).querySelector(sel);
const elNew = (tag, prop) => Object.assign(document.createElement(tag), prop);
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
            elParent: typeof selector === "string" ? el(selector) : selector,
            width: 800, // Canvas width
            height: 600, // Canvas height
            offsetX: 0, // 0 = From canvas center
            offsetY: 0, // 0 = From canvas center
            scaleFactor: 0.2,
            scaleMax: 10,
            scaleMin: 0.05,
            padd: 40,
            onPan: noop,
            onPanStart: noop,
            onPanEnd: noop,
            onScale: noop,
            onInit: noop,
        }, options);

        this.elViewport = el(".zoompan-viewport", this.elParent);
        this.elCanvas = el(".zoompan-canvas", this.elParent);
        this.elTrackX = el(".zoompan-track-x", this.elParent);
        this.elThumbX = el(".zoompan-thumb-x", this.elParent);
        this.elTrackY = el(".zoompan-track-y", this.elParent);
        this.elThumbY = el(".zoompan-thumb-y", this.elParent);

        this.elParent.classList.add("zoompan");
        this.elCanvas.style.width = `${this.width}px`;
        this.elCanvas.style.height = `${this.height}px`;

        this.elViewport.addEventListener("wheel", (evt) => this._handleWheel(evt), { passive: false });
        this.elViewport.addEventListener("pointerdown", (evt) => this._handlePan(evt));
        this.elTrackX.addEventListener("pointerdown", (evt) => this._handleThumbX(evt));
        this.elTrackY.addEventListener("pointerdown", (evt) => this._handleThumbY(evt));
        addEventListener("resize", () => this.transform());

        // Init        
        this.fit();
        this.onInit();
    }

    fit() {
        // Fit into Viewport
        // Scale to fit original size (1.0) or less (with padd around viewport if needed)
        const wRatio = this.elViewport.clientWidth / (this.elCanvas.clientWidth + this.padd * 2);
        const hRatio = this.elViewport.clientHeight / (this.elCanvas.clientHeight + this.padd * 2);
        const fitRatio = +Math.min(1, wRatio, hRatio).toFixed(1);
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = fitRatio;
        this.transform();
        this.onScale();
        this.onPan();
    }

    getViewport() {
        const { width, height, x, y } = this.elViewport.getBoundingClientRect();
        return { width, height, x, y };
    }

    getCanvas() {
        const vpt = this.getViewport();
        const width = this.width * this.scale;
        const height = this.height * this.scale;

        // Fix offsets (reposition to prevent exit viewport)
        const spaceX = vpt.width / 2 + width / 2 - this.padd;
        const spaceY = vpt.height / 2 + height / 2 - this.padd;
        this.offsetX = clamp(this.offsetX, -spaceX, spaceX);
        this.offsetY = clamp(this.offsetY, -spaceY, spaceY);

        const x = (vpt.width - width) / 2 + this.offsetX;
        const y = (vpt.height - height) / 2 + this.offsetY;

        return { width, height, x, y };
    }

    getArea() {
        // (Fictive outer bounding scroll-area)
        const cvs = this.getCanvas();
        const vpt = this.getViewport();
        const width = (vpt.width - this.padd) * 2 + cvs.width;
        const height = (vpt.height - this.padd) * 2 + cvs.height;
        return { width, height }
    }

    transform() {
        const vpt = this.getViewport();
        const cvs = this.getCanvas();
        const area = this.getArea();

        // Scrollbars:
        const thumbSizeX = vpt.width ** 2 / area.width;
        const thumbSizeY = vpt.height ** 2 / area.height;
        const thumbPosX = (vpt.width - cvs.x - this.padd) / vpt.width * thumbSizeX;
        const thumbPosY = (vpt.height - cvs.y - this.padd) / vpt.height * thumbSizeY;
        this.elThumbX.style.width = `${thumbSizeX / vpt.width * 100}%`;
        this.elThumbX.style.left = `${thumbPosX / vpt.width * 100}%`;
        this.elThumbY.style.height = `${thumbSizeY / vpt.height * 100}%`;
        this.elThumbY.style.top = `${thumbPosY / vpt.height * 100}%`;

        // Canvas:
        this.elCanvas.style.scale = this.scale;
        this.elCanvas.style.translate = `${this.offsetX}px ${this.offsetY}px`;
    }

    calcScaleDelta(delta) {
        const scale = this.scale * Math.exp(delta * this.scaleFactor);
        return clamp(scale, this.scaleMin, this.scaleMax);
    }

    scaleDelta(delta) {
        this.scale = this.calcScaleDelta(delta);
        this.transform();
        this.onScale();
        return this.scale;
    }

    scaleTo(scale) {
        this.scale = clamp(scale, this.scaleMin, this.scaleMax);;
        this.transform();
        this.onScale();
        return this.scale;
    }

    scaleUp() {
        return this.scaleDelta(1);
    }

    scaleDown() {
        return this.scaleDelta(-1);
    }

    _handleWheel(evt) {
        evt.preventDefault();

        const vpt = this.getViewport();
        const cvs = this.getCanvas();

        const delta = Math.sign(-evt.deltaY);
        const scaleOld = this.scale;
        const scaleNew = this.calcScaleDelta(delta);

        // Get XY coords from canvas center
        // This values are "current" (on the currently transformed #canvas)
        const x = evt.x - vpt.x - cvs.x - cvs.width / 2
        const y = evt.y - vpt.y - cvs.y - cvs.height / 2

        // Calculate the XY as if the element is in its
        // original, non-scaled size: 
        const xOrg = x / scaleOld;
        const yOrg = y / scaleOld;

        // Calculate the scaled XY 
        const xNew = xOrg * scaleNew;
        const yNew = yOrg * scaleNew;

        // Retrieve the XY difference to be used as the change in offset.
        const xDiff = x - xNew;
        const yDiff = y - yNew;

        // Apply new values and transform
        this.scale = scaleNew;
        this.offsetX += xDiff;
        this.offsetY += yDiff;

        this.transform();
        this.onScale();
        this.onPan();
    }

    _handlePan(evt) {
        drag(evt,
            () => this.onPanStart(),
            (ev) => {
                this.offsetX += ev.movementX;
                this.offsetY += ev.movementY;
                this.transform();
                this.onPan();
            },
            () => this.onPanEnd()
        );
    }

    _handleThumbX(evt) {
        drag(evt,
            () => this.onPanStart(),
            (ev) => {
                const area = this.getArea();
                this.offsetX -= (area.width / this.elTrackX.offsetWidth) * ev.movementX;
                this.transform();
                this.onPan();
            },
            () => this.onPanEnd()
        );
    }

    _handleThumbY(evt) {
        drag(evt,
            () => this.onPanStart(),
            (ev) => {
                const area = this.getArea();
                this.offsetY -= (area.height / this.elTrackY.offsetHeight) * ev.movementY;
                this.transform();
                this.onPan();
            },
            () => this.onPanEnd()
        );
    }
}

export default ZoomPan
