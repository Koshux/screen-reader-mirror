Button: an action. Outlined by default; the solid accent "filled" variant is reserved for the single most important action in view (Run, Next, Read the guide).

```jsx
<Button variant="filled" icon={<ArrowRight size={14} />}>Next: Page</Button>
<Button variant="primary">Run</Button>
<Button ok={copied} onClick={copy}>{copied ? "Copied" : "Copy"}</Button>
```

Min height 40px (44px on touch surfaces). Copy buttons flip to the `ok` state for 1.8s and announce "Copied." in a live region.