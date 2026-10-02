import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Patient from "../modules/patient/patient.model.js";
import Medicine from "../modules/medicine/medicine.model.js";
import Reminder from "../modules/reminder/reminder.model.js";
import MedicationLog from "../modules/medicationLog/medicationLog.model.js";
import Notification from "../modules/notification/notification.model.js";
import { tick } from "../modules/scheduler/scheduler.service.js";

let mongo;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await MedicationLog.init(); // make sure the unique index exists
}, 120_000); // first run downloads MongoDB

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

beforeEach(async () => {
    for (const model of [Patient, Medicine, Reminder, MedicationLog, Notification]) {
        await model.deleteMany({});
    }
});

// One patient in Paris with one medicine reminded at 08:00 every day.
async function seed() {
    const patient = await Patient.create({ userId: new mongoose.Types.ObjectId(), timezone: "Europe/Paris" });
    const medicine = await Medicine.create({ patientId: patient._id, name: "Paracetamol", dosage: "500mg", frequencyPerDay: 1 });
    const reminder = await Reminder.create({ medicineId: medicine._id, patientId: patient._id, times: ["08:00"] });
    return { patient, reminder };
}

describe("tick: dose due, end to end (#2)", () => {
    it("creates one pending log and one dose_reminder at 08:00 Paris time", async () => {
        const { patient, reminder } = await seed();

        await tick(new Date("2026-10-02T06:00:00Z")); // 08:00 in Paris (UTC+2)

        const logs = await MedicationLog.find({ reminderId: reminder._id });
        expect(logs).toHaveLength(1);
        expect(logs[0].status).toBe("pending");
        expect(logs[0].scheduledFor.toISOString()).toBe("2026-10-02T06:00:00.000Z");

        const notifications = await Notification.find({ userId: patient.userId, type: "dose_reminder" });
        expect(notifications).toHaveLength(1);
    });

    it("a second tick at the same minute creates nothing new", async () => {
        await seed();
        const now = new Date("2026-10-02T06:00:00Z");

        await tick(now);
        await tick(now);

        expect(await MedicationLog.countDocuments()).toBe(1);
        expect(await Notification.countDocuments()).toBe(1);
    });

    it("does nothing when it is not the reminder time", async () => {
        await seed();

        await tick(new Date("2026-10-02T06:01:00Z")); // 08:01 in Paris

        expect(await MedicationLog.countDocuments()).toBe(0);
    });
});