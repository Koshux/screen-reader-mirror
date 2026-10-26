/**
 * Browser modes (SPEC-006, ADR-0005). The default reading follows the W3C specifications:
 * AccName 1.2, HTML-AAM, WAI-ARIA 1.2, ARIA in HTML, and SVG-AAM 1.0. `browser: "chrome"` applies
 * each place where Chrome's tree is known to differ, read from Chromium's source and checked
 * against its tree. One field per row of the inventory in SPEC-006 §3; `true` means the browser
 * behaviour applies.
 */
export interface BrowserRules {
  /** Row 1: a table that is not a data table by Chrome's rules has no table roles. */
  readonly layoutTables: boolean;
  /** Row 2: `tbody` is not exposed; its rows hang off the table. */
  readonly hideTbody: boolean;
  /** Row 3: a row is named by its author only, except inside a grid or treegrid. */
  readonly rowNamedByAuthorOnly: boolean;
  /** Row 4: a name from content leaves out the content of roles Chrome does not count. */
  readonly nameFromContentExclusions: boolean;
  /** Row 5: a field whose associated labels are all empty has no name. */
  readonly emptyLabelHasNoName: boolean;
  /** Row 6: `role="region"` scopes a header or footer, as ARIA in HTML lists it (W3C only). */
  readonly regionScopesHeader: boolean;
  /** Row 7: a `term` is named from its content. */
  readonly termNamedFromContent: boolean;
  /** Row 8: the text of a label for a checkbox or radio is read only as the control's name. */
  readonly hideToggleLabelText: boolean;
  /**
   * Row 9: an `svg` root with nothing readable inside is an image, an unnamed empty one is left
   * out; otherwise it is a `graphics-document`, as SVG-AAM maps every `svg` root.
   */
  readonly svgImageWhenNoContent: boolean;
  /** Row 10: a `th` without `scope` is decided from its neighbours, not by HTML's table model. */
  readonly headerCellFromSiblings: boolean;
  /** Row 11: text inside an SVG `defs` or `symbol`, which is never rendered, is read. */
  readonly svgTemplateTextRead: boolean;
}

/** The values `LinearizeOptions.browser` accepts. */
export type BrowserMode = "chrome";

const W3C: BrowserRules = Object.freeze({
  layoutTables: false,
  hideTbody: false,
  rowNamedByAuthorOnly: false,
  nameFromContentExclusions: false,
  emptyLabelHasNoName: false,
  regionScopesHeader: true,
  termNamedFromContent: false,
  hideToggleLabelText: false,
  svgImageWhenNoContent: false,
  headerCellFromSiblings: false,
  svgTemplateTextRead: false,
});

const CHROME: BrowserRules = Object.freeze({
  layoutTables: true,
  hideTbody: true,
  rowNamedByAuthorOnly: true,
  nameFromContentExclusions: true,
  emptyLabelHasNoName: true,
  regionScopesHeader: false,
  termNamedFromContent: true,
  hideToggleLabelText: true,
  svgImageWhenNoContent: true,
  headerCellFromSiblings: true,
  svgTemplateTextRead: true,
});

/**
 * The rules for a browser mode: the W3C rules when it is left out. Any other value throws, so a
 * misspelt mode is not read as the default.
 */
export function rulesFor(browser: unknown): BrowserRules {
  if (browser === undefined) return W3C;
  if (browser === "chrome") return CHROME;
  const given = typeof browser === "string" ? JSON.stringify(browser) : typeof browser;
  throw new RangeError(`browser must be "chrome" or left out, not ${given}`);
}
