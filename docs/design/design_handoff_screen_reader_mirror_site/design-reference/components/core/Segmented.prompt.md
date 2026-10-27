Segmented: the view switch (Spoken · Preview · Nodes · JSON) and the HTML/CSS file switch. Native radios, so it works without script for focus and announcement.

```jsx
<Segmented name="view" ariaLabel="View" value={view} onChange={setView}
  options={[{value:"spoken",label:"Spoken"},{value:"preview",label:"Preview"},{value:"nodes",label:"Nodes"},{value:"json",label:"JSON"}]} />
```

Keep labels to one word; four options max, padding tightens under 640px.