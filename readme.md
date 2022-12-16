# ZoomPan

Zoomable and pannable area with scrollbars.  
Inspired by graphical editors like Photoshop.  

Supports Pinch gesture for scaling

![Zoom pan area - Image edit software scroll area](./zoompan.png)

### Example

See: `example/index.html` for a use-case.

## Getting started

```sh
npm i @rbuljan/zoompan
```

**HTML:**

```html
<!-- index.html -->
<div id="myEditor"></div>
```

I.e: using Vite.js

```js
// main.js

import "@rbuljan/zoompan/zoompan.css";
import ZoomPan from "@rbuljan/zoompan";

const ZP = new ZoomPan("#myEditor", {
  width: 800,
  height: 600,
  onInit() {
    this.elCanvas.style.backgroundColor = "gold";
    this.elCanvas.textContent = "Hello ZoomPan!";
  },
  onChange() {
    console.log(this);
  },
  // other options here...
});

console.log(ZP);
```

## Options

| Name                 | Type    | Default | Description                           |
| -------------------- | ------- | ------- | ------------------------------------- |
| `width`              | Number  | `800`   | Canvas width                          |
| `height`             | Number  | `600`   | Canvas height                         |
| `offsetX`            | Number  | `0`     | Canvas offset X (from center)         |
| `offsetY`            | Number  | `0`     | Canvas offset Y (from center)         |
| `scale`              | Number  | `1`     | Initial Scale (if not fitted on init) |
| `scaleOld`           | Number  | `scale` | Old Scale value (before changed)      |
| `scaleFactor`        | Number  | `0.2`   | Scale factor                          |
| `scaleMin`           | Number  | `0.05`  | Scale min value                       |
| `scaleMax`           | Number  | `10`    | Scale max value                       |
| `transitionDuration` | Number  | `250`   | *ms* transition duration              |
| `padd`               | Number  | `40`    | Min visible canvas padd               |
| `panStep`            | Number  | `50`    | Pixels pan step value                 |
| `scrollbars`         | Boolean | `true`  | Show scrollbars                       |
| `scrollbarsWidth`    | Number  | `14`    | *px* scrollbars size                  |
| `fitOnInit`          | Boolean | `true`  | Fix canvas into viewport on init      |
| `canDrag`            | Boolean | `true`  | If canvas can be pointer-dragged      |
| `canPinch`           | Boolean | `true`  | Allow two-finger pinch                |

## Options &mdash; Events

| Name           | Description                      |
| -------------- | -------------------------------- |
| `onInit()`     | Triggered on class instantiation |
| `onScale()`    | Triggered on scale change        |
| `onPan()`      | Triggered on pan (pointermove)   |
| `onChange()`   | Triggered on: init, pan, scale   |
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

## Licence

MIT
