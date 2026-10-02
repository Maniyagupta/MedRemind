# Glossary

- **Reminder**: The recurring rule (times + daysOfWeek) for one medicine.
- **Dose**: One occurrence of a Reminder at one Scheduled time.
- **Scheduled time**: The concrete instant of one dose: the date + HH:mm interpreted in the patient's timezone, stored as a UTC Date.
- **Dose due**: The state when a reminder time is reached and a notification is triggered.
- **Pending log**: A `MedicationLog` entry with status `pending` created at the scheduled time.
- **Grace window**: 30 minutes by default, configurable via an environment variable.
- **Auto-missed**: The state when a dose is transitioned to "missed" by the system after the grace window.
- **Catch-up**: The process of processing missed reminders during server downtime if within the grace window.
- **Patient timezone**: The IANA timezone identifier stored on the Patient record for local time calculation.
