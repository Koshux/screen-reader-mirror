SpokenRow: the unit of the Spoken view. Speech first, in text colour, with the role phrase muted; anything the mirror adds goes in a Note beside (or under, on narrow widths) the speech.

```jsx
<ol style={{listStyle:"none",margin:0,padding:"10px 12px"}}>
  <SpokenRow name="Apply for a Blue Badge" role="heading level 1" />
  <SpokenRow name="" role="button" note="No accessible name. Only the role is spoken." highlighted />
  <SpokenRow name="badge.png" role="image" note="Missing alt. The file name is spoken instead." />
</ol>
```

Never put "no name", flags or icons inside the spoken span. Unnamed images speak their file name, because that is what a screen reader does.