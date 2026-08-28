# Home Page Localization Design

## Goal

Make English the default language for first-time visitors to the standard home page and let visitors switch between English and Chinese. A visitor's explicit language choice must be remembered across later visits.

## Scope

- Reuse the existing global Vue I18n setup and `LocaleSwitcher` component.
- Add the language switcher to the standard `HomeView` header.
- Move all hard-coded Chinese home-page copy into the existing English and Chinese locale files.
- Preserve the configured custom-home-content modes (URL iframe or administrator-provided HTML) without adding controls to those modes.
- Do not change localization behavior on unrelated pages.

## Behavior

1. A visitor without a saved `sub2api_locale` preference sees English, regardless of browser language.
2. Selecting Chinese updates the home page immediately and stores `zh` through the existing `setLocale` function.
3. A returning visitor with a saved preference sees that language.
4. The switcher exposes both `English` and `中文`, indicates the active language, and remains usable on desktop and mobile widths.
5. Dynamic administrator-provided branding values such as site name, subtitle, and contact details remain unchanged.

## Implementation

- Change the i18n default-locale resolver so it uses a valid saved preference when present and otherwise returns English. Remove browser-language inference.
- Render `LocaleSwitcher` in the default home-page navigation before the account action.
- Add locale keys for the business-volume section, agent-recruitment section, contact-email button states, and accessibility labels.
- Replace corresponding literals in `HomeView.vue` with `t(...)` calls and computed labels where dynamic values are interpolated.

## Error Handling

- Continue using the existing asynchronous `setLocale` implementation and its disabled switching state.
- Keep the current clipboard fallback. Only its visible and accessible status text is localized.
- Missing translation keys fall back to English through the existing `fallbackLocale` configuration.

## Verification

- Add or update unit tests for default-locale resolution without a saved preference and with saved `zh`.
- Add a focused home-page test covering English copy and language switching where practical.
- Run frontend type checking and the relevant Vitest files.
- Open the local page and verify desktop/mobile header layout plus live English/Chinese switching.

## Out of Scope

- Adding more languages.
- Translating administrator-provided custom HTML, site subtitles, or contact information.
- Redesigning the landing page or changing backend configuration.
