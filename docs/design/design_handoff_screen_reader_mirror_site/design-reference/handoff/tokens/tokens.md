# Tokens

One set of names, two value sets (light, dark). Every text pair is at or above 7:1, so the AAA rule in section 4 holds for all type below 24 px. Ratios are recorded in tokens.json and were computed from the hex values with the WCAG relative-luminance formula; recheck before shipping if a value changes.

- bg: page ground. surface: sample buttons and code blocks, one step off the ground.
- text: all body copy and names. muted: role column, position number, helper sentences, footer. Still 7:1 or better on both bg and surface.
- border: list rows and section rules. border-strong: controls (buttons, textarea), at least 2.6:1 so the control edge is visible on its own.
- link: inline links. Same hue as primary so the eye learns one colour for "interactive".
- primary / on-primary: the Run button only. One filled button per surface.
- flag-bg / flag-text: the flag badge. Low chroma, warm, so a flag reads as "worth checking", not "error". The badge always carries an icon and a label; the colour is a third cue.
- focus: 2 px ring, 2 px offset. Rows use a negative offset so the ring stays inside the list frame.

Type is the system font stack. Mono for roles and code so the role column aligns. Nothing is fetched at runtime.

No shadows, no gradients, no motion. The one radius is 6 px on controls and 4 px on the badge and the mark.

Not from any attached design system: the brief requires system fonts and recorded 7:1 ratios, which the Nocturne, Modernist and Industry palettes do not meet without changes. Earlier explorations in Launch mockups.dc.html used them and are superseded for the demo page.
