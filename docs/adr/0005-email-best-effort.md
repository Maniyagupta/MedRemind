**Context**: Sending "dose-due" alerts via the Resend email service.
**Decision**: Implement as a "best-effort" operation; do not roll back the `MedicationLog` if the email fails.
**Alternatives rejected**: Transactional rollback (aborting the log creation if Resend fails).
**Consequences**: High availability of the medication log; potential for lost emails during service outages.