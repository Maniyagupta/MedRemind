# Notes: make reminders actually fire

## Questions the grilling surfaced (Lab 1, step 1)
- Grace window: same for every medicine? → Global 30 min, configurable by env var; per-medicine is out of scope.
- Timezone: "08:00" in whose time? → The patient's IANA timezone, default Europe/Paris.
- Server down at reminder time: notify late? → Only within the grace window; older doses are marked missed directly.
- Duplicates: what stops a dose being notified twice? → A "pending" MedicationLog + unique index.
- Downtime-missed doses: does the doctor get told? → Yes (it is auto-missed), but not the patient.
- Ungrillable: "where is the backend hosted" is a fact the agent should look up, not my decision.

## Caught while reviewing the agent's output
- Glossary: scheduled time can't be just "08:00", or tomorrow's dose collides with today's. It must be the exact instant (date + time, stored as UTC).
- First spec draft silently dropped 3 of my 4 requirements (in-app alert, auto-missed, doctor alert). I caught it by checking against my decisions.
- Spec claimed "existing MedicationLog schema is enough". False: it needs a "pending" status and a partial unique index. The repo already had reminderId and scheduledFor; the agent did not check.
- Spec never said what happens when the patient taps "taken": the pending log must be UPDATED, or the unique index rejects a second log.
- Tickets used wrong paths (medication-log, .ts, .php). The repo is JS with camelCase modules. A fresh session would have created duplicate modules.
- The agent said the "#T2" placeholders were replaced on GitHub. They were not. I checked and had it redo them.

## Edge audit (Lab 1, step 3)
- True edge: #2 → #3, #4, #5, #6. Nothing is pending until #2 creates it.
- Removed: the agent made email (#5) blocked by the in-app notification. What breaks if reversed? Nothing; email only needs the pending log. It was a preference, not an edge.

## Context decision (spec → tickets boundary)
- Where: after the spec was published as issue #1, before cutting tickets.
- Chose: /clear.
- Why (ruled out in order): continue would carry a session full of rejected drafts into ticket-writing. Clear was safe because everything the next phase needs (issue #1, CONTEXT.md, docs/adr/) was already written down. Handoff, subagent and compact were not needed.