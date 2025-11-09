# Översikt

Det finns två sorters events, statiska och user. Statiska events byggs in i samband med att de skapas av årsträffs-gäng etc.

User events skapas av användare och är kopplade till en specifik användare. Det kan vara att man vill gå och äta pizza på en årsträff, eller ha brädspelskväll mellan årsträffarna etc.

Användaren som skapat eventet står som värd, och kan redigera och ta bort eventet.

## Unified endpoints

Det finns nu samlade endpoints för både officiella (AG) och användarskapade event:

- GET `/v1/events` med valfria query params `attending`, `bookable`, `official`.
- GET `/v1/events/attending` (genväg för `?attending=true`)
- GET `/v1/events/official` (genväg för `?official=true`)
- GET `/v1/events/unofficial` (genväg för `?official=false`)

Mer detaljer om modell och mappningsregler i `docs/EventsUnified.md`.
