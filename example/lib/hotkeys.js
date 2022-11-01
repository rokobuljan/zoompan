/**
 * Hotkeys singleton.
 * Author: rokobuljan
 * 
 * Assign callback functions to be triggered on
 * any combo keyboard as hotkey.
 * @param {object} data {"a b c": fn,} Object of key combo keys with the specific 
 * @param {HTMLElement|window} elementListener Element target to receive wheel events (default: `window`)
 * @returns {object} the currently assigned hotkeys `lib` and the `off("combo keys", fb)` method to remove listeners. 
 */
const hotkeys = (data, elementListener = window) => {
    const sortIns = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
    const isTargetEditable = (evt) => /^(INPUT|TEXTAREA)$/.test(evt.target.tagName); // || evt.target.closest("[contenteditable]")
    const aliasCtrl = (key) => key.replace(/\b(control|meta)\b/ig, "ctrl");
    const strToEvtName = (str) => arrToStrSorted(aliasCtrl(str).trim().split(/ +/));
    const arrToStrSorted = (arr) => arr.sort(sortIns).join(" ").toLowerCase();

    const pressedKeys = new Set();
    const lib = {};

    const checkMatch = (ev, tempKey) => {
        if (isTargetEditable(ev)) {
            return;
        }
        let keys = [...pressedKeys];
        if (tempKey) {
            keys = [...pressedKeys, tempKey];
        }
        const nameFromKeys = arrToStrSorted(keys);
        lib[nameFromKeys]?.forEach(fn => {
            ev.preventDefault();
            fn(ev);
        });
    };

    Object.entries(data).forEach(([hk, cb]) => {
        const name = strToEvtName(hk);
        lib[name] ??= [];
        lib[name].push(cb);
    });

    elementListener.addEventListener("wheel", ev => {
        checkMatch(ev, ev.deltaY < 0 ? "WheelUp" : "WheelDown");
    }, { passive: false });

    addEventListener("keydown", ev => {
        pressedKeys.add(aliasCtrl(ev.key));
        checkMatch(ev);
    });

    addEventListener("keyup", ev => {
        pressedKeys.delete(aliasCtrl(ev.key));
    });

    const off = (_name, fn) => {
        const name = strToEvtName(_name);
        const evtIndex = lib[name]?.findIndex(fn);
        if (evtIndex < 0) {
            return;
        }
        lib[name].splice(evtIndex, 1);
        if (lib[name].length === 0) {
            delete lib[name];
        }
    };

    const isActive = (_name) => {
        const name = strToEvtName(_name);
        return pressedKeys.has(name);
    }

    return {
        lib,
        off,
        isActive,
    };
};

export { hotkeys };
