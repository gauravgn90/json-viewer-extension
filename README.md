# JSON Viewer Pro

A Chrome extension (Manifest V3) that turns a raw JSON response — the kind
Chrome normally shows as plain text when you hit an API URL directly — into
an interactive, VS Code–styled tree: expandable/collapsible nodes, search by
key or value, and a record-count / payload-size summary.

## Install (unpacked)

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select this folder
3. Navigate directly to any URL that returns `application/json`
   (e.g. `https://api.github.com/users/octocat`) — the tree view replaces
   the raw text automatically.

## How it works

| File | Role |
|---|---|
| `manifest.json` | MV3 content script registered on `http://*/*` and `https://*/*`, running at `document_end` |
| `content.js` | Detects a raw JSON document, parses it, replaces `document.body`, and renders the tree |
| `content.css` | Dark, monospace, VS Code–like theme for the tree, toolbar, and search highlighting |

**Activation gate.** The script runs on every page load but exits
immediately unless `document.contentType === 'application/json'` — so it
only ever touches a page that *is* a JSON document, never JSON embedded in
HTML or returned by `fetch`/XHR. If `JSON.parse` fails on the body text, it
also bails and leaves the page untouched.

**Rendering.** Once confirmed, it clears `<body>`, then recursively builds
the tree: objects/arrays get a toggle arrow and an inline preview
(`{ 3 keys }` / `[ 12 items ]`); scalars get a leaf line colored by type
(string/number/boolean/null). Every node also carries lowercased
`data-key` / `data-value` attributes used purely for the search filter.

**Search.** Typing in the toolbar box hides every node, then reveals only
nodes whose key or value contains the query, auto-expanding their
ancestors so a deep match is still visible. Clearing the box restores
everything.

**Toolbar.** Shows a live record count (array length or object key count
at the root) and formatted payload size (B/KB/MB), plus **Expand All** /
**Collapse All** buttons.

## Permissions

None beyond the content script's own host match — no `activeTab`, no
`scripting`, no `storage`. It can't read or modify any page that isn't
already a raw JSON document, and it makes no network requests of its own.

## Known limits

- Only triggers on a **direct navigation** to a JSON URL (the top-level
  document), not JSON shown inside an HTML page or returned to
  `fetch`/XHR calls made by page scripts.
- Very large payloads render every node up front — there's no
  virtualization, so an extremely large array/object tree may be slow to
  expand.
- `document.body.innerText` is used to get the raw text; on some
  Chrome versions viewing huge JSON files, Chrome's built-in JSON
  formatter may already have altered the DOM before this script runs at
  `document_end` — if so, disable Chrome's built-in JSON viewer or test
  against an endpoint that serves `Content-Type: application/json`
  without it.
- No dark/light toggle — the theme is fixed to the dark palette in
  `content.css`.

## Customizing

- **Search fields** — `handleSearch` in `content.js` matches on key and
  scalar value only; container preview text (`{ 3 keys }`) is not
  searched.
- **Colors** — all theme colors are plain hex values in `content.css`
  (`.jvp-value.jvp-string`, `.jvp-key`, etc.) with no CSS variables, so
  swap them directly for a different palette.
- **Byte formatting** — `formatBytes()` in `content.js` controls the
  B/KB/MB thresholds and precision shown in the toolbar.
