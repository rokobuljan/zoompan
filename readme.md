# ZoomPan

Zoomable and pannable area with scrollbars.  
Inspired by graphical editors like Photoshop.

![Zoom pan area - Image edit software scroll area](./zoompan.png)

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

| Name          | Type    | Default value | Description                           |
| ------------- | ------- | ------------- | ------------------------------------- |
| `width`       | Number  | `800`         | Canvas width                          |
| `height`      | Number  | `600`         | Canvas height                         |
| `offsetX`     | Number  | `0`           | Canvas offset X (from center)         |
| `offsetY`     | Number  | `0`           | Canvas offset Y (from center)         |
| `scale`       | Number  | `1`           | Initial Scale (if not fitted on init) |
| `fitOnInit`   | Boolean | `true`        | Fix canvas into viewport on init      |
| `scaleFactor` | Number  | `0.2`         | Scale factor                          |
| `scaleMin`    | Number  | `0.05`        | Scale min value                       |
| `scaleMax`    | Number  | `10`          | Scale max value                       |
| `padd`        | Number  | `40`          | Min visible canvas padd               |

## Options &mdash; Events

| Name           | Description                      |
| -------------- | -------------------------------- |
| `onInit()`     | Triggered on class instantiation |
| `onScale()`    | Triggered on scale change        |
| `onPan()`      | Triggered on pan (pointermove)   |
| `onPanStart()` | Triggered on pan (pointerdown)   |
| `onPanEnd()`   | Triggered on pan (pointerup)     |

## Properties

| Name       | Type   | Description                |
| ---------- | ------ | -------------------------- |
| `scaleOld` | Number | Scale value before changed |



## Methods

| Name                                  | Returns               | Description                                |
| ------------------------------------- | --------------------- | ------------------------------------------ |
| `panTo(offsetX, offsetY)`             |                       | Pan canvas to new offset (from center)     |
| `scaleTo(scale [, originX, originY])` |                       | Scale canvas to value (origin from center) |
| `scaleUp()`                           |                       | Scale up by `scaleFactor`                  |
| `scaleDown()`                         |                       | Scale down by `scaleFactor`                |
| `scaleDelta(delta)`                   |                       | Scale by delta                             |
| `fit()`                               |                       | Fit canvas to viewport center (*contain*)  |
| `resize(width, height)`               |                       | Change canvas width and height             |
| `updateScrollbars()`                  |                       | Reposition and resize scrollbars           |
| `getCanvas()`                         | {x, y, width, height} | Get Canvas data                            |
| `getViewport()`                       | {x, y, width, height} | Get Viewport data                          |
| `getArea()`                           | {width, height}       | Get fictive *"scroll area"* size           |

## Example

See: `example.html` for a use-case.

## TODO

- Keyboard support
- Pinch zoom

### Licence

MIT
