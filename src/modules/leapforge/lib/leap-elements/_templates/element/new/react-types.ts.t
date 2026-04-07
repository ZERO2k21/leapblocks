---
to: src/react-types.ts
inject: true
before: \}\s+\}\s+\}
skip_if: 'leap-<%= name %>'
---
      'leap-<%= name %>': leapElement<<%= h.className(name) %>Element>;
