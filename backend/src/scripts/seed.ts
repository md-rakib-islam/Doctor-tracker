/**
 * Repeatable demo-data seed (`npm run seed`). Fully synthetic - no real people.
 * Idempotent: doctors are upserted by email, patients by (doctor, phone), so re-running never duplicates.
 * Registration dates are spread over the last ~150 days (relative to the first run) to give the charts real shape.
 */
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { GENDERS, PATIENT_CONDITIONS } from '../config/constants';
import { Doctor } from '../models/Doctor';
import { Patient } from '../models/Patient';
import { logger } from '../utils/logger';

const DOCTORS: [string, string, string][] = [
  ['Dr. Amina Rahman', 'Cardiology', 'Dhaka Central Hospital'],
  ['Dr. Tanvir Ahmed', 'Neurology', 'Dhaka Central Hospital'],
  ['Dr. Farzana Islam', 'Pediatrics', 'Lakeview Medical Center'],
  ['Dr. Imran Hossain', 'Orthopedics', 'Lakeview Medical Center'],
  ['Dr. Nusrat Jahan', 'Dermatology', 'Green Valley Clinic'],
  ['Dr. Sabbir Khan', 'Endocrinology', 'Dhaka Central Hospital'],
  ['Dr. Mehnaz Chowdhury', 'Gynecology', 'Green Valley Clinic'],
  ['Dr. Rafiq Uddin', 'Pulmonology', 'Riverside General Hospital'],
  ['Dr. Shirin Akter', 'Cardiology', 'Riverside General Hospital'],
  ['Dr. Kamal Sarker', 'General Medicine', 'Green Valley Clinic'],
  ['Dr. Lamia Sultana', 'Neurology', 'Riverside General Hospital'],
  ['Dr. Arif Mahmud', 'Orthopedics', 'Dhaka Central Hospital'],
  ['Dr. Tasnim Haque', 'Pediatrics', 'Riverside General Hospital'],
  ['Dr. Zahid Alam', 'Endocrinology', 'Lakeview Medical Center'],
];

const FIRST = ['Rahim', 'Karim', 'Sumaiya', 'Nabila', 'Jamal', 'Rina', 'Hasan', 'Sadia', 'Mizan', 'Tania', 'Faisal', 'Moni', 'Rakib', 'Shila', 'Anwar', 'Dilruba', 'Habib', 'Parvin', 'Sohel', 'Laboni'];
const LAST = ['Ahmed', 'Hossain', 'Begum', 'Khatun', 'Mia', 'Sheikh', 'Das', 'Roy', 'Talukder', 'Mondal', 'Sarkar', 'Biswas', 'Paul', 'Akhter'];

// mulberry32: tiny deterministic PRNG so every environment seeds identical data.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
const DAY = 86_400_000;

async function main() {
  await connectDb(env.MONGODB_URI);
  const rand = rng(20260101);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const now = Date.now();

  const doctorOps = DOCTORS.map(([name, specialization, hospital], i) => {
    const createdAt = new Date(now - Math.floor(150 - i * (130 / DOCTORS.length) - rand() * 5) * DAY);
    return {
      updateOne: {
        filter: { email: `${slug(name)}@demo.doctortracker.test` },
        update: {
          $setOnInsert: {
            name,
            specialization,
            hospital,
            phone: `+88017000${String(10000 + i)}`,
            createdAt,
            updatedAt: createdAt,
          },
        },
        upsert: true,
      },
    };
  });
  const docRes = await Doctor.bulkWrite(doctorOps, { timestamps: false });

  const doctors = await Doctor.find({ email: { $regex: /@demo\.doctortracker\.test$/ } }).sort({ createdAt: 1 }).lean();
  // Uneven load per doctor makes "patients per doctor" interesting.
  const weights = doctors.map((_, i) => 1 + ((i * 7) % 5) + (i < 3 ? 4 : 0));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const TOTAL_PATIENTS = 140;

  const patientOps = [];
  for (let n = 0; n < TOTAL_PATIENTS; n++) {
    let r = rand() * weightSum;
    let di = 0;
    while (di < weights.length - 1 && r >= weights[di]) r -= weights[di++];
    const doctor = doctors[di];
    // Recent registrations are more frequent than old ones -> visible growth trend.
    const daysAgo = Math.floor(Math.pow(rand(), 1.6) * 140);
    const createdAt = new Date(Math.max(now - daysAgo * DAY - Math.floor(rand() * DAY), new Date(doctor.createdAt).getTime()));
    const fullName = `${pick(FIRST)} ${pick(LAST)}`;
    patientOps.push({
      updateOne: {
        filter: { doctorId: doctor._id, phone: `+88018${String(100000 + n)}` },
        update: {
          $setOnInsert: {
            fullName,
            age: 3 + Math.floor(rand() * 85),
            gender: pick(GENDERS),
            email: `${slug(fullName)}.${n}@patients.demo.test`,
            condition: pick(PATIENT_CONDITIONS),
            createdAt,
            updatedAt: createdAt,
          },
        },
        upsert: true,
      },
    });
  }
  const patRes = await Patient.bulkWrite(patientOps, { timestamps: false });

  logger.info(`Doctors: ${docRes.upsertedCount} inserted, ${docRes.matchedCount} already present`);
  logger.info(`Patients: ${patRes.upsertedCount} inserted, ${patRes.matchedCount} already present`);
  await disconnectDb();
}

main().catch((e) => {
  logger.error('Seed failed', e);
  process.exit(1);
});
