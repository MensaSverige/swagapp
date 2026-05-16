# Event Tags from User Interests — Design

_Date: 2026-05-16_

## Decisions (read first — correct any of these)

1. **Source of tag options = UserInterest enum** — The 94 `UserInterest` values are the complete menu of tags a user can attach to an event. No free-text tags.
2. **Tag.code = lowercased enum key** — `KONST` → `"konst"`, `SLOJD_HANDARBETE` → `"slojd_handarbete"`. Stable, consistent with backend enum keys. Defined as a static lookup table in the frontend.
3. **Colors = 8-color fixed palette cycled by index** — Simple; avoids needing a server round-trip or category grouping logic. Colors chosen to be readable in both light/dark modes.
4. **User's own interests appear first in the picker** — Convenience sort; all interests remain selectable.
5. **Frontend-only change** — Backend already accepts `tags: List[Tag]`; no backend changes needed. The static `INTEREST_TAGS` lookup table lives in `mensasverige/features/events/utils/interestTags.ts`.
6. **UI = chip multi-select in the event form** — Inline, below the description field. Horizontally-wrapped chip grid. Tapping a chip toggles it.

## Goal

Users creating or editing an event can tag it with one or more interests from the standard `UserInterest` list. These tags feed the existing category filtering (already wired — `categoryEventCounts`, `topCategories`, event filter by `categories`).

## Architecture

```
interestTags.ts          — static lookup: UserInterest value → Tag (code, text, colors)
TagPicker.tsx            — multi-select chip component
CreateEventCard.tsx      — add tags state + TagPicker section, pass tags to API
```

### `interestTags.ts`

```ts
export const INTEREST_TAGS: Record<string, Tag> = {
  'Konst': { code: 'konst', text: 'Konst', colorText: '#fff', colorBackground: '#7c3aed' },
  // … one entry per UserInterest value
}

export function interestToTag(interest: string): Tag | undefined {
  return INTEREST_TAGS[interest]
}
```

8-color palette (index mod 8): purple, teal, orange, rose, sky, lime, amber, slate.

### `TagPicker.tsx`

Props:
```ts
interface TagPickerProps {
  selectedTags: Tag[]
  userInterests: string[]   // from store user.interests — sorted first
  onChange: (tags: Tag[]) => void
}
```

Renders wrapped row of `Pressable` chips. Selected = filled background; unselected = outlined. User's own interests come first in the list, separated visually (no hard divider needed — just sorted to top).

### `CreateEventCard.tsx` changes

- Add `tags: Tag[]` to local state (initialized from `existingEvent.tags ?? []`).
- Render `<TagPicker>` below the description field.
- Pass `tags` in both create and update payloads (currently hardcoded `tags: []` on create; update path currently drops tags — fix by initializing from `existingEvent.tags ?? []` and sending state through to the update call).
- Extract `user.interests` from `useStore()` and pass to `TagPicker` as `userInterests`.

## Data Flow

```
UserInterest enum values (backend/frontend shared via generated types)
  → INTEREST_TAGS lookup (frontend static table)
  → TagPicker chips
  → eventData.tags state
  → createEvent / updateEvent API call
  → event.tags stored in MongoDB
  → EventsSlice categoryEventCounts (already reads tag.code)
  → event filter by category (already wired)
```

## Error Handling

No new error surface — tags field is optional (`[]` on create), and the backend already accepts any `List[Tag]`. No validation needed beyond what exists.

## Testing

- Unit: `interestTags.ts` — all 94 UserInterest values have a corresponding entry; `interestToTag` returns defined for every known interest.
- Component: `TagPicker` — toggle adds/removes a tag; user interests appear before others.
- Integration: create event with tags → event appears in category filter for each selected tag code.

## Risks / Steel-man

**Risk**: 94 interests is a lot of chips to scroll through. Could be overwhelming in the form.  
**Counter**: Users see their own interests first (likely 5–15 of them), making the most relevant choices immediately visible. The full list scrolls below. This is a known UX pattern for interest-based tagging (e.g., Meetup). Acceptable for MVP.

**Risk**: `tag.code` format mismatch — EventsSlice filters by `tag.code`; official events arrive with their own codes from the external sync. User-created event tags generated from `INTEREST_TAGS` use lowercased enum keys (`"konst"`, `"slojd_handarbete"`). As long as the static table is the single source of truth for user-event tags, codes are consistent. Official event tag codes are irrelevant here.

**Risk**: Color palette cycling by index means unrelated interests get the same color.  
**Counter**: Tags on an event are filtered/browsed by code, not color. Color is decorative. Consistent index-based assignment is deterministic and avoids maintenance.

## Considered Alternatives

**A. Free-text tags** — Rejected: existing filtering infrastructure uses tag codes from a known set. Free-text would break categoryEventCounts.

**B. Backend returns available tags list** — Rejected: the UserInterest enum is already the source of truth; adding an API endpoint is unnecessary complexity when a static table in the frontend is sufficient.

**C. Group interests by category with distinct colors per group** — Rejected: adds ~100 lines of grouping logic for minimal UX gain on a first pass. Can be done as a follow-up if the flat list feels chaotic.

## Out of Scope

- Filtering the event list by tag (already implemented in EventsSlice)
- Tags on official/external events (those come from the external sync, no change needed)
- Admin-defined custom tags with custom colors
