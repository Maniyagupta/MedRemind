import Reminder from "../reminder/reminder.model.js";
import Patient from "../patient/patient.model.js";
import Medicine from "../medicine/medicine.model.js";
import MedicationLog from "../medicationLog/medicationLog.model.js";
import { createNotificationService } from "../notification/notification.service.js";

const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// The patient's local "HH:mm" and weekday (0 = Sunday) at `now`.
function localTime(now, timeZone) {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-GB", {
            timeZone, hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23",
        }).formatToParts(now).map((p) => [p.type, p.value])
    );
    return { hhmm: `${parts.hour}:${parts.minute}`, weekday: WEEKDAYS[parts.weekday] };
}

export async function tick(now = new Date()) {
    const reminders = await Reminder.find({ isActive: true });

    for (const reminder of reminders) {
        const patient = await Patient.findById(reminder.patientId);
        if (!patient) continue;

        const { hhmm, weekday } = localTime(now, patient.timezone || "Europe/Paris");
        const dayOk = reminder.daysOfWeek.length === 0 || reminder.daysOfWeek.includes(weekday);
        if (!dayOk || !reminder.times.includes(hhmm)) continue;

        const scheduledFor = new Date(now);
        scheduledFor.setSeconds(0, 0);

        try {
            await MedicationLog.create({
                patientId: reminder.patientId,
                medicineId: reminder.medicineId,
                reminderId: reminder._id,
                scheduledFor,
                status: "pending",
            });
        } catch (err) {
            if (err.code === 11000) continue; // this dose already has a log
            throw err;
        }

        const medicine = await Medicine.findById(reminder.medicineId);
        await createNotificationService({
            userId: patient.userId,
            type: "dose_reminder",
            title: "Time for your medicine",
            message: `It's time to take ${medicine?.name ?? "your medicine"}.`,
            relatedMedicineId: reminder.medicineId,
        });
    }
}