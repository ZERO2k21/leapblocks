---
to: src/react-types.ts
inject: true
before: \ntype leapElement
skip_if: \{ <%= h.className(name) %>Element \}
---
import { <%= h.className(name) %>Element } from './<%= name %>-element';
