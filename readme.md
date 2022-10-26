# Pannable zoomable area with scrollbars

Pannable and zoomable area with scrollbars inspired by graphical editors like Photoshop.

![Zoom pan area like image edit software](./zoompan.png)

## Setup:

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
<link rel="stylesheet" href="zoompan.css">
```

**JS:**

```
import ZoomPan from "./zoompan.js";
const ZP = new ZoomPan("#myEditor");
```

## Options

| Name          | Type            | Default value | Description                   |
| ------------- | --------------- | ------------- | ----------------------------- |
| `elParent`    | String\|Element |               | **Mandatory** Wrapper element |
| `width`       | Number          | `800`         | Canvas width                  |
| `height`      | Number          | `600`         | Canvas height                 |
| `offsetX`     | Number          | `0`           | Canvas offset X (from center) |
| `offsetY`     | Number          | `0`           | Canvas offset Y (from center) |
| `scaleFactor` | Number          | `0.2`         | Scale factor                  |
| `scaleMin`    | Number          | `0.05`        | Scale min value               |
| `scaleMax`    | Number          | `10`          | Scale max value               |
| `padd`        | Number          | `40`          | Min visible canvas padd       |
## Events

| Name                | Description                      |
| ------------------- | -------------------------------- |
| `onInit(Event)`     | Triggered on class instantiation |
| `onScale(Event)`    | Triggered on scale change        |
| `onPan(Event)`      | Triggered on pan (pointermove)   |
| `onPanStart(Event)` | Triggered on pan (pointerdown)   |
| `onPanEnd(Event)`   | Triggered on pan (pointerup)     |

## Methods

| Name                    | returns               | Description                                       |
| ----------------------- | --------------------- | ------------------------------------------------- |
| `fit()`                 |                       | Fit canvas to viewport center (contain with padd) |
| `getViewport()`         | {x, y, width, height} | Get current Viewport rect                         |
| `getCanvas()`           | {x, y, width, height} | Get current Canvas rect (transformed)             |
| `getArea()`             | {width, height}       | Get fictive *"scroll area"* width and height      |
| `calcScaleDelta(delta)` | Number                | Get a scale value by a given delta                |
| `scaleDelta(delta)`     | Number                | Scale by delta                                    |
| `scaleTo(newScale)`     | Number                | Scale to value                                    |
| `scaleUp()`             | Number                | Scale up                                          |
| `scaleDown()`           | Number                | Scale down                                        |
| `transform()`           |                       | Apply scale and offset                            |

## Example

See: `example.html` for a use-case.

### Licence

MIT
