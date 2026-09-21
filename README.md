# DiskBytes UI/UX

This repository is the standalone frontend snapshot for DiskBytes. It contains the React/TypeScript user interface, design tokens, screen chrome, canvas presentation layer, formatting helpers, tests, static assets, and Vite configuration. The Rust scanner, Tauri commands, installer setup, and other native-product code deliberately remain in the main DiskBytes repository.

## Included surface

- Frameless desktop chrome, navigation tabs, search shortcut, theme switcher, inspector, sidebar, and scan states
- Disk-space treemap canvas rendering and item selection interaction
- Light and dark Apple-system-color-derived design tokens
- Shared button and section primitives represented in the UI source
- TypeScript formatting helpers with Vitest coverage

## Run

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
```

`npm run build`, `npm run typecheck`, and `npm test` validate the UI snapshot. When opened outside a Tauri host, native scan calls safely report no data; the visual shell remains available for UI work.

## Source relationship

This is an extracted copy of the frontend portion of the DiskBytes workspace at commit `0c6a6ab`. It is maintained separately so UI/UX work can be reviewed and evolved without mixing in the native filesystem engine.
