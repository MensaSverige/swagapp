# Events

`Events` presents a unified API for both ag.mensa.se events and user events from the Swagapp backend.

Endpoints:
- /api/v1/events all events
  - request parameters:
    - `attending={bool}` to filter on either attending or not attending. Omit to include both
    - `bookable={bool}` to filter on either bookable or not bookable. Omit to include both
    - `official={bool}` to filter on either official events (from ag.mensa.se) or user events (false). Omit to include both
- /api/v1/events/attending shorthand, identical to /api/v1/events?attending=true
- /api/v1/events/official shorthand, identical to /api/v1/events?official=true
- /api/v1/events/unofficial shorthand, identical to /api/v1/events?offiial=false
