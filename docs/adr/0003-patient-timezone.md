**Context**: Reminders must align with the patient's local daily routine.
**Decision**: Store an IANA timezone string on the `Patient` model (default: `Europe/Paris`).
**Alternatives rejected**: Standardizing all scheduling to Server UTC.
**Consequences**: Accurate local-time alerts; requires frontend to provide/detect timezone.