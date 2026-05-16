# Desktop Web Max-Width Constraint

**Date:** 2026-05-15  
**Status:** Draft

## Decisions

1. **Constrain in one place (WebSidebarLayout), not per-screen.** Per-screen would require touching ~10 screens; centralising means one file.
2. **Max-width = 900px.** Wide enough for 3-column card layouts (SWAG Guide / Buddies / Kontakt), narrow enough to prevent paragraph lines becoming unreadable. Not a user-facing setting.
3. **Full-bleed routes: `/map` only.** The map must fill the content area; every other route benefits from centering. Future full-bleed routes (e.g. a fullscreen image viewer) would be added to a small allowlist.
4. **Scroll wrapper lives in WebSidebarLayout.** The content `<Slot />` is wrapped in a `ScrollView` for overflow, with an inner `View` that applies `maxWidth: 900, alignSelf: 'center', width: '100%'`. The map route bypasses this and renders `<Slot />` directly inside a plain `View style={{ flex: 1 }}`.
5. **No change to native or mobile-web layouts.** `WebSidebarLayout` only renders on desktop web (Platform.OS === 'web' && width ≥ 768). The constraint is invisible to native.

## Problem

Desktop content area is 1440 − 220 = 1220 px wide. Screens designed for 375 px mobile:
- Text lines span 1200 px → hard to read
- List items become absurdly wide cards
- Form fields stretch edge to edge

## Architecture

Single file change: `mensasverige/components/WebSidebarLayout.tsx`.

```
WebSidebarLayout
├── <View style={{ flex: 1, flexDirection: 'row' }}>
│   ├── Sidebar (220px, unchanged)
│   └── Content area (flex: 1)
│       ├── if pathname === '/map':  <View flex:1><Slot /></View>   ← full-bleed
│       └── else:  <ScrollView><View maxWidth=900 alignSelf=center width=100%><Slot /></View></ScrollView>
```

The `ScrollView` also allows long screens (profile, feedback lists) to scroll within the desktop layout without the entire page scrolling.

## Full-bleed allowlist

```ts
const FULL_BLEED_PATHS = ['/map'];
const isFullBleed = FULL_BLEED_PATHS.some(p => pathname.startsWith(p));
```

Kept as a constant array in the component — no abstraction needed until there are ≥ 4 entries.

## What changes

- `WebSidebarLayout.tsx`: add `usePathname`, wrap non-map Slot in `<ScrollView>` + `<View maxWidth=900>`. Import `ScrollView` from `react-native`.
- No other files change.

## Considered alternatives

**A. Per-screen max-width** — each screen adds `Platform.OS === 'web'` guard and `maxWidth` style. Works, but requires touching every screen and is easy to forget on new screens. Rejected.

**B. CSS media query via `StyleSheet.create`** — React Native Web supports media queries in `StyleSheet` via `@media`. Would be the most idiomatic web solution but requires a non-standard RN StyleSheet API that could break on native. Rejected.

**C. Global web stylesheet injection in `+html.tsx`** — inject `<style>.content-area > * { max-width: 900px; }</style>`. Brittle class name coupling, hard to maintain. Rejected.

## Risks / Counterarguments

**Risk:** Some screens have intentionally full-width content (e.g. a future video player, a full-bleed header image). Counter: the allowlist in `FULL_BLEED_PATHS` handles this; cost of adding an entry is one line.

**Risk:** ScrollView in the content area may conflict with screens that have their own internal ScrollView (nested scrollers). Counter: React Native Web's ScrollView doesn't introduce the same double-scroll issue as native; the outer ScrollView gets `overflow: auto` on the `div`, inner ones also scroll within their own bounds. Monitor but unlikely to be a visible issue.

**Risk:** 900px feels arbitrary. Counter: it matches common content-column conventions (Bootstrap container ~960px, GitHub prose width ~880px). Can be adjusted trivially.

## Out of scope

- Responsive grid layouts (2-column events list on desktop) — separate ticket
- Sidebar collapsing to icon-only at intermediate widths — separate ticket
