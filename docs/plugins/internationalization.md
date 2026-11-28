# Translations

Every text that a UI plugin shows to the user comes from its translation catalogs: titles, groups, labels, help and error
messages. The dashboard gives the plugin the language of the Home Assistant user and falls back to English when a text is
missing. Audience: plugin authors.

## English catalog

A plugin must provide an English catalog. `registerUiPlugin` refuses a plugin that has none, with an error that names
`translations`. A plugin that has only English is shown in English whatever the language of the user.

A catalog is an object: the keys are dotted names such as `tab.title`, the values are texts. The English catalog is the
source of the keys.

## Declare the keys with types

`defineTranslations(english, others)` returns the translations of the plugin. Its function `t` only accepts the keys of the
English catalog, so a key that does not exist does not compile.

<!-- example: docs/examples/typescript/translations.ts -->
```typescript
import { defineTranslations } from "@vtherm/dashboard-sdk";
import type { PartialCatalog } from "@vtherm/dashboard-sdk";

/** The English catalog is required. Its keys type the function `t`. Declare it `as const`. */
export const en = {
  "tab.title": "Smart TPI",
  "tab.group": "Algorithms",
  "tab.help": "Settings of {name}",
  "tab.users": { one: "Used by {count} thermostat", other: "Used by {count} thermostats" },
} as const;

/** A catalog of another language can be partial: the missing keys are shown in English. */
const fr = {
  "tab.title": "TPI intelligent",
  "tab.users": { one: "Utilisé par {count} thermostat", other: "Utilisé par {count} thermostats" },
} satisfies PartialCatalog<typeof en>;

/** The German catalog is in its own module, which is downloaded only for a user who speaks German. */
export const translations = defineTranslations(en, { fr, de: () => import("./translations-de.ts") });

/** Use `t` in the components. A key that is not in the English catalog does not compile. */
export const { t } = translations;
```
<!-- /example -->

Give `translations` to `registerUiPlugin` with the definition of the plugin. The function `t` is for your components.

## Language resolution and fallback

The dashboard uses the language of the profile of the user in Home Assistant. For each text it tries, in this order:

1. the full tag, for example `pt-BR`,
2. the base language, `pt`,
3. English.

The tags are compared without case, and `-` equals `_`: `pt_br` is `pt-BR`. A user in `fr-CA` sees your `fr` catalog
when you have no `fr-CA` one, and a user in `ja` sees English.

The fallback is made key by key, not catalog by catalog: a key that is missing in the French catalog is shown in
English, and the other keys are shown in French. The fallback is recorded as a `fallback` warning in `translations.warnings`,
which the plugin status page shows for a plugin in development. A key that is missing everywhere is shown as it is, and a
`missing_key` warning is recorded.

When the user changes language in Home Assistant, the dashboard updates every plugin without reloading the page.

## Titles and groups are keys

The `title` and the `group` of a contribution are keys of your catalogs, never literal texts. The menu and the
breadcrumb translate them when they are drawn, so they follow the language.

```typescript
{ id: "my_plugin.tab.main", title: "tab.title", group: "tab.group", component: "my-plugin-tab" }
```

An unknown key is shown as it is and a warning is recorded.

## Parameters and plurals

A text can have named parameters, written `{name}`. Pass their values to `t`:

```typescript
t("tab.help", { name: "Salon" }); // "Settings of Salon"
```

A parameter that is not given stays as written (`{name}`) and a warning is recorded, the text is still shown.

A plural text has one form per plural category of the language: `zero`, `one`, `two`, `few`, `many` and `other`. Only
`other` is required. The form is chosen with the parameter `count`, using the plural rules of the language (`Intl.PluralRules`):

```typescript
t("tab.users", { count: 3 }); // "Used by 3 thermostats"
```

## Load a language on demand

A language can be a function that loads its catalog when the user needs it. The English catalog is always loaded,
as the fallback. A catalog can be a module that exports it by default, as in the example above and below. If the load
fails, the plugin is shown in English and a `load_failed` warning is recorded.

<!-- example: docs/examples/typescript/translations-de.ts -->
```typescript
import type { en } from "./translations.ts";
import type { CompleteCatalog } from "@vtherm/dashboard-sdk";

/** `satisfies CompleteCatalog` makes a missing or an extra key a compile error. */
export default {
  "tab.title": "Intelligentes TPI",
  "tab.group": "Algorithmen",
  "tab.help": "Einstellungen von {name}",
  "tab.users": { one: "Von {count} Thermostat verwendet", other: "Von {count} Thermostaten verwendet" },
} satisfies CompleteCatalog<typeof en>;
```
<!-- /example -->

## Add a language

1. Create the catalog of the language, in its own file (`de.ts`) or in the same file.
2. Type it. Use `satisfies PartialCatalog<typeof en>` when some keys may be missing, or `satisfies CompleteCatalog<typeof en>`
   when the language must be complete. Native UI plugins of the dashboard are complete in English, French and German.
3. Add it to the second argument of `defineTranslations`, with its language tag as the key.

## Check the translations

- The compiler checks the keys: an unknown key in `t`, a key that is missing from a `CompleteCatalog`, and a key that is
  not in the English catalog all fail to compile.
- In your tests, `assertCompleteTranslations` from `@vtherm/dashboard-sdk/testing` fails and names each missing or unknown key
  of the languages that must be complete (see [Testing a UI plugin](testing.md)).
- At run time, `translations.warnings` lists the keys that were not found (`missing_key`), the keys that were shown in English although the language of the user has a catalog (`fallback`), the parameters that were not given and the
  catalogs that did not load.

## Texts of the help of the fields
The native UI plugins add to the keys of their fields (`field.<key>`, `help.<key>`) a hint `hint.<key>` and an explanation
`info.<key>`, in English, French and German; the generator of the catalogs (`npm run catalogs:generate`) takes them from
`scripts/native-texts.ts`. The help of a field shows the hint under the control, or the help of Versatile Thermostat without it, and
the explanation in its panel, or the help of Versatile Thermostat when it is another text than the hint. A plugin gives its own texts
to the help of a field (see [Help of a field](plugin-development.md#help-of-a-field)). The texts of the diagrams (`diagram.<id>.*`)
are those of the dashboard: a plugin that shows a diagram of the library does not translate them.

## Texts of the server

The server never sends text for the user, only stable error codes such as `unknown_entity`. Your plugin translates them with
the key `error.<code>` and shows the generic key `error.generic` (with the parameter `code`) for a code that it does not know.
