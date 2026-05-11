# MIT App Inventor Designer + Blocks Parity Checklist

Reference baseline: `appinventor-sources-ref` (cloned from `mit-cml/appinventor-sources`)
Scope: Studio session `src/appinverter` Designer + Blocks tabs

## Designer

- [x] Palette uses enhanced MIT-style category library (`Palette_Enhanced`) with descriptions/search.
- [x] Drag payload carries component metadata and `visible` classification.
- [x] Canvas uses enhanced viewer (`PhoneCanvas_Enhanced`) with device size and orientation.
- [x] Non-visible components are inserted into and rendered in dedicated tray.
- [x] State model inserts visible vs non-visible by metadata.
- [x] Stable component IDs use `TypeN` allocator per screen.
- [x] Arrangement hierarchy is supported through `children` with nested insertion.
- [x] Component tree and property selection stay synchronized through `selectedId`/`selectedComponent`.
- [x] Rename/delete update component tree state safely.
- [x] Screen creation/switching is preserved and works with current state shape.

## Properties

- [x] Property editor supports boolean/color/number/text types.
- [x] Enum/select support added for common MIT-style fields (`Width`, `Height`, `Shape`, `TextAlignment`).
- [x] Non-visible components are editable from the properties side panel list.

## Blocks

- [x] Active blocks tab routed to complete editor (`BlocksView` wrapper -> `BlocksEditor_Complete`).
- [x] Block workspace XML persists in state (`blockLogic`) as canonical format.
- [x] Import/export/clear/zoom workflows remain available.
- [x] Component toolbox categories generated dynamically from current screen components.
- [x] Component event/property blocks are generated with component-bound default field values.
- [x] Component block definitions/generators are loaded in complete editor path.

## Serialization and Compatibility

- [x] Serialized state includes `schemaVersion` while preserving existing fields.
- [x] Legacy `Palette` and `PhoneCanvas` paths remain as compatibility wrappers.

## Validation

- [x] `npm run build` succeeds after changes.
- [ ] Manual UX parity sweep against selected upstream screens/flows (pending interactive verification).
