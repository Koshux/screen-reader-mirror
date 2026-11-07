---
"screen-reader-mirror": patch
---

Names read once, and two more Chrome differences (SPEC-007). Inside a button, tab, option, checkbox, radio, or switch named from its content, text that went into the name is no longer read again when it sits inside a nested list or `<details>` (both modes; WAI-ARIA 1.2 presentational children). With `browser: "chrome"`, an `<a>` without `href` that has an `onclick`, `onmousedown`, or `onmouseup` attribute is a link, so `clickable-not-button` no longer fires on it there, and a name puts a space around an image, a control, or a child named by `alt` or `aria-label`, as Chrome does.
