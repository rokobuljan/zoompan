# ZoomPan

Zoomable and pannable area with scrollbars.  
Inspired by graphical editors like Photoshop.

![Zoom pan area - Image edit software scroll area](./zoompan.png)

## Example

See: `example/index.html` for a use-case.

## Setup

**HTML:**

```html
<div id="myEditor">
    <div class="zoompan-viewport">
        <div class="zoompan-canvas"></div>
    </div>

    <div class="zoompan-track-x">
        <div class="zoompan-thumb-x"></div>
    </div>
    <div class="zoompan-track-y">
        <div class="zoompan-thumb-y"></div>
    </div>
</div>
```

**CSS:**

```html
<link rel="stylesheet" href="./zoompan.css">
```

**JS:**

```js
import ZoomPan from "./zoompan.js";

// Initialize ZoomPan on selector ID or on Element
const ZP = new ZoomPan("#myEditor");
```

Customization options:

```js
const ZP = new ZoomPan(someElement, {
    width: 1920,
    height: 1080,
    // Other options here
});
```

## Options

| Name          | Type    | Default | Description                           |
| ------------- | ------- | ------- | ------------------------------------- |
| `width`       | Number  | `800`   | Canvas width                          |
| `height`      | Number  | `600`   | Canvas height                         |
| `offsetX`     | Number  | `0`     | Canvas offset X (from center)         |
| `offsetY`     | Number  | `0`     | Canvas offset Y (from center)         |
| `scale`       | Number  | `1`     | Initial Scale (if not fitted on init) |
| `scaleOld`    | Number  | `scale` | Old Scale value (before changed)      |
| `scaleFactor` | Number  | `0.2`   | Scale factor                          |
| `scaleMin`    | Number  | `0.05`  | Scale min value                       |
| `scaleMax`    | Number  | `10`    | Scale max value                       |
| `padd`        | Number  | `40`    | Min visible canvas padd               |
| `panStep`     | Number  | `50`    | Pixels pan step value                 |
| `fitOnInit`   | Boolean | `true`  | Fix canvas into viewport on init      |
| `canDrag`     | Boolean | `true`  | If canvas can be pointer-dragged      |

## Options &mdash; Events

| Name           | Description                      |
| -------------- | -------------------------------- |
| `onInit()`     | Triggered on class instantiation |
| `onScale()`    | Triggered on scale change        |
| `onPan()`      | Triggered on pan (pointermove)   |
| `onPanStart()` | Triggered on pan (pointerdown)   |
| `onPanEnd()`   | Triggered on pan (pointerup)     |

## Methods

| Name                                  | Returns               | Description                                    |
| ------------------------------------- | --------------------- | ---------------------------------------------- |
| `panTo(offsetX, offsetY)`             |                       | Pan canvas to new offset (canvas center)       |
| `scaleTo(scale [, originX, originY])` |                       | Scale canvas from point origin (canvas center) |
| `scaleUp()`                           |                       | Scale up. Alias for `scaleDelta(1)`            |
| `scaleDown()`                         |                       | Scale down. Alias for `scaleDelta(-1)`         |
| `scaleDelta(delta)`                   |                       | Scale by delta                                 |
| `resize(width, height)`               |                       | Change canvas `width` and `height`             |
| `updateScrollbars()`                  |                       | Reposition and resize scrollbars               |
| `fit()`                               |                       | Fit canvas into viewport center (*contain*)    |
| `getArea()`                           | {width, height}       | Get fictive *"scroll area"* size               |
| `getCanvas()`                         | {x, y, width, height} | Get Canvas data                                |
| `getViewport()`                       | {x, y, width, height} | Get Viewport data                              |
| `getPointerOrigin(Event)`             | {originX, originY}    | Get pointer XY relative to viewport center     |
| `getWheelDelta(Event)`                | number                | Get wheel delta `+1` or `-1` on wheel-down     |
| `calcScaleDelta(delta)`               | number                | Get the new scale value from delta             |



## TODO

- Create NPM package

### Licence

MIT
