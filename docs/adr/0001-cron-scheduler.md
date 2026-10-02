**Context**: The backend needs a mechanism to trigger medication reminders at specific times.
**Decision**: Implement a 1-minute cron job.
**Alternatives rejected**: Redis-backed task queue (BullMQ) due to lack of existing Redis infrastructure.
**Consequences**: Low architectural complexity; depends on the stability of the cron process.