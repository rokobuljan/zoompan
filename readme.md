# Pannable zoomable area with scrollbars

Pannable and zoomable area with scrollbars inspired by graphical editors like Photoshop. 

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




### Licence

MIT
