**Context**: Prevent duplicate dose notifications or multiple `MedicationLog` entries for the same event.
**Decision**: Use `MedicationLog` with a `pending` status and a unique index on `(reminderId, scheduledFor)` using the concrete UTC Date.
**Alternatives rejected**: Ephemeral application-level locks.
**Consequences**: Guaranteed idempotency at the database level; prevents collisions between different days.