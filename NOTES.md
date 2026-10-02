# Notes
# Questions the grilling surfaced (Lab 1, step 1)

- Q3 Grace window: same for every medicine? → Global 30 min for now; per-medicine is out of scope.
- Q5 Timezone: "08:00" in whose time? → Patient's local IANA timezone, default Europe/Paris.
- Q6 Server down at reminder time: notify late? → Only within the grace window; older doses are marked missed.
- Q7 Duplicates: what stops a dose being notified twice? → A "pending" MedicationLog + unique index.
- Caught in review: scheduled time can't be just "08:00", or tomorrow's dose collides with today's. It must be the exact instant (date + time, UTC).

Q1, the scheduler: a cron job checks every minute; a task queue (BullMQ) needs Redis, a new piece of infrastructure the project doesn't have; option 3 depends on where the backend is hosted. That last one is a fact the agent should look up itself, not your decision (Lecture 1 calls this "ungrillable"). Most students would pick 1.

Q2, exact time or early: pure product choice. Exact time is simplest.

Q3, grace window: global is simpler. But think about it: is 30 minutes right for every medicine? Whatever you decide, write down why.

Q4, doctor alert: in-app only, or email too? A doctor with 40 patients could get a lot of emails.




Round 2

❓ Q5 - Timezone Context: The Reminder model stores HH:mm strings, but doesn't specify a timezone. How should we interpret these times?
1. Server Time (UTC): All reminders are treated as UTC. This is standard for backend logic but requires the frontend to handle the conversion for the patient.
2. Patient's Local Time: We need to store the patient's timezone (e.g., America/New_York) and calculate the "due" time based on their offset from UTC.

➡️ Recommended: Patient's Local Time. Reminders are inherently tied to a person's daily routine. Without this, a patient traveling or living in a different zone than the server would receive alerts at the wrong time. (I will check if Patient model has a timezone field).

---

❓ Q6 - Server Downtime/Missed Windows: If the server is down or the cron job fails to run at a specific HH:mm, how should we handle "catching up"?
1. Strictly Skip: If the minute is missed, the reminder is simply lost until the next scheduled time (e.g., tomorrow).
2. Catch-up Logic: On the next successful cron run, the system checks for any reminders that should have fired during the downtime and triggers them immediately.

➡️ Recommended: Catch-up Logic. For medical adherence, it is critical that the system attempts to notify the patient even if there was a brief service interruption.

---

❓ Q7 - Idempotency (Preventing Duplicate Notifications): How should we ensure that a single dose is not notified/marked missed multiple times?
1. Status-Based: The notification/missed logic only triggers if there is no existing "Dose" record for that specific medicineId, patientId, and time_slot (e.0.g., 2026-10-02 08:00) already marked as taken or missed.
2. Event-Based: We use a transient "lock" or a "processed" flag on a specific task record to ensure the cron job doesn't re-process the same window.

➡️ Recommended: Status-Based. This is more robust as it relies on the source of truth (the dose record) rather than a transient process state. It also naturally handles the "auto-missed" transition.



Round 3

❓ Q8 - The "Dose Due" Notification Delivery: Since we are implementing an "in-app" notification, how should the patient receive this?
1. Real-time (WebSockets/Socket.io): The patient's browser maintains an active connection to the server and receives a "pop-up" or toast notification immediately when the cron job triggers the "due" event.
2. Polling (Pull-based): The frontend periodically fetches the latest notifications from the /notifications endpoint. This is easier to implement and doesn't require managing persistent connections.

➡️ Recommended: Polling (Pull-based). Given the current project structure and the goal of simplicity, polling is the least disruptive. We can set the interval to something reasonable like every 1-2 minutes.

---

❓ Q9 - The Email Notification (Resend Integration): For requirement (4), the "dose-due" alert must be sent via Resend. Since we are now using a MedicationLog with a "pending" status, when exactly should the email be dispatched?
1. At the moment of creation: The email is sent as soon as the cron job creates the "pending" MedicationLog at the HH:mm mark.
2. After a "delivery check": The email is sent by a separate check in the same cron job, ensuring that we only send the email if the MedicationLog was successfully persisted.

➡️ Recommended: At the moment of creation. As part of the same atomic database transaction (or immediately following it) where the Medication/MedicationLog is created, we trigger the Resend service. This minimizes the window of failure.

---

❓ Q10 - Handling the "Auto-Missed" Doctor Notification: You want the connected doctor notified when a dose is auto-missed. Should this notification also follow the "In-app only" rule from Q4, or should it be more prominent (e.g., an email)?

➡️ Recommended: In-app only. To maintain consistency with the decision in Q4 and avoid overwhelming doctors, I recommend keeping this alert within the app's notification system.