# Development mode
Audience: plugin authors. The terms are defined in the [terminology](plugin-development.md#terminology).

The development mode loads your plugin from a server on your computer, so that you see a change after a reload of the page. You do
not install anything and you do not restart Home Assistant. It is for administrators only.

## How it works
- The entries are kept in the `localStorage` of your browser. Nothing is written in Home Assistant, and another browser or another user
  does not see them.
- The dashboard sends the active entries with the request for the list of plugins (`dev_plugins` in
  [`vtherm_dashboard/get_ui_plugins`](../reference/websocket-api.md)). The server merges them with the registered plugins and does
  not keep them. A user who is not an administrator is refused.
- A plugin in development follows the rules of any plugin: `dashboard_version`, `requires`, `load_after`, `load_before`, cycles and the
  isolation of failures. See [Loading and dependencies](loading-and-dependencies.md).
- While at least one entry is active, a banner "Development mode" with the identifiers of the plugins is shown on every page.

The configurations below are the ones of the sample plugin package. [Developing a UI plugin](plugin-development.md) uses them from the start.

## Add an entry
Open **Configuration > Development** (the group "Dashboard" of the menu). The page lists your entries, and each one can be enabled,
disabled (it stays in the list) or removed. Changes apply when you reload the page, and the page offers a button for it.

There are two kinds of entry.

| Kind | When | What it gives |
| --- | --- | --- |
| Replaces the installed module | The identifier is the one of a plugin that an integration registered in Python, or of a native plugin. | Only the URL of the module. The constraint and the dependencies stay those of the registration in Python. |
| Declared here | The identifier is unknown to the server. | The entry is the registration: it must give `dashboard_version`, and can give `requires`, `load_after` and `load_before`. |

An entry is refused when:

- the identifier does not start with a letter or uses anything but lower case letters, digits and underscores, or is already there;
- the address is not an absolute `http` or `https` URL (`javascript:` and `data:` are refused);
- the plugin is declared here and gives no `dashboard_version`;
- a dependency is not an identifier.

An identifier `core` or starting with `core_` that is not a native plugin is excluded by the server, with the state "reserved identifier".

## The server of development
The dashboard imports your module from another origin than Home Assistant, so the server must send `Access-Control-Allow-Origin`.

### Vite
<!-- example: examples/vtherm_sample_plugin/ui/vite.config.ts -->
```typescript
import { defineConfig } from "vite";

// `npx vite` serves the plugin from http://localhost:5173 while you work on it. The dashboard imports the module from another
// origin, so the server must allow it with Access-Control-Allow-Origin.
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    headers: { "Access-Control-Allow-Origin": "*" },
    // The dashboard is reloaded by hand. The hot update client would try to reach Home Assistant, not this server.
    hmr: false,
  },
  build: {
    // `npx vite build` writes one ES module for each plugin into the integration, which serves it.
    outDir: "../custom_components/vtherm_sample_plugin/www",
    emptyOutDir: true,
    lib: {
      entry: { "vtherm-sample": "src/main.ts", "vtherm-sample-extras": "src/extras.ts" },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    // A module that two plugins share goes to a chunk of its own.
    rollupOptions: { output: { chunkFileNames: "chunks/[name]-[hash].js" } },
  },
});
```
<!-- /example -->

Run `npx vite`, then add the entry with the URL of your module, for example `http://localhost:5173/src/main.ts`. Vite serves the
TypeScript source as a module.

### Rollup
<!-- example: examples/vtherm_sample_plugin/ui/rollup.config.ts -->
```typescript
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import type { RollupOptions } from "rollup";
import serve from "rollup-plugin-serve";

const OUTPUT = "../custom_components/vtherm_sample_plugin/www";
// Only in this repository, where tsconfig.json reads the SDK from its sources. In your project, leave `rootDir` out.
const ROOT = "../../..";

// `npx rollup -c rollup.config.ts --configPlugin typescript -w` builds the plugins again at each change and serves them from
// http://localhost:5173. The dashboard imports the modules from another origin, so the server must allow it with
// Access-Control-Allow-Origin.
const config: RollupOptions = {
  input: { "vtherm-sample": "src/main.ts", "vtherm-sample-extras": "src/extras.ts" },
  output: { dir: OUTPUT, format: "es", entryFileNames: "[name].js", chunkFileNames: "chunks/[name]-[hash].js", sourcemap: true },
  plugins: [resolve(), typescript({ noEmit: false, outDir: OUTPUT, declaration: false, rootDir: ROOT }), serve({ contentBase: OUTPUT, port: 5173, headers: { "Access-Control-Allow-Origin": "*" } })],
};

export default config;
```
<!-- /example -->

Run `npx rollup -c rollup.config.ts --configPlugin typescript -w`, then add the entry with `http://localhost:5173/vtherm-sample.js`. It needs `rollup`, `@rollup/plugin-typescript`, `@rollup/plugin-node-resolve`, `rollup-plugin-serve` and `tslib`.

## When the module does not load
The status page (**Configuration > Plugins**) shows the source of each plugin. For a plugin in development, it shows the URL and, when
the import failed, the causes that a browser cannot tell apart:

- the development server is stopped, or the URL is wrong;
- the server does not send `Access-Control-Allow-Origin`;
- the page is served over HTTPS and the module over HTTP (mixed content).

The other plugins keep loading.

## One copy of Lit
A plugin that bundles Lit loads a second copy next to the one of the dashboard, and Lit warns about it in the console in development. It works, because
each copy has its own elements. Mark `lit` as external only if you use an import map; the sample does not.

## HTTPS and Safari
`http://localhost` from an HTTPS page works in Chrome and Firefox. Safari always blocks it: serve your module over HTTPS, or open
Home Assistant over HTTP while you develop.

## Texts
For a plugin in development, the status page lists the texts that the language of the user lacks and that are shown in English
(`fallback`), and the texts that exist nowhere (`missing_key`). They come from `translations.warnings`, see
[Translations](internationalization.md). Change the language of your profile in Home Assistant to check one language.

## Limits
- There is no hot reload: reload the page.
- The entries are not shared between browsers, and are lost when you clear the data of the site.
- Only an administrator can use the mode.
