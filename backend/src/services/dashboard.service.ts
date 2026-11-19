import { Doctor } from '../models/Doctor';
import { Patient } from '../models/Patient';
import { addDaysUtc, createdAtRange, endOfDayUtc, startOfDayUtc } from '../utils/dates';
import type { StatisticsQuery } from '../validators/dashboard.validators';

type Interval = 'day' | 'week' | 'month';

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Percent change vs previous window; null when there is no baseline to compare with (no fake trends). */
const pctChange = (current: number, previous: number) =>
  previous === 0 ? null : round1(((current - previous) / previous) * 100);

export async function getOverview(days: number) {
  const now = new Date();
  const currentStart = addDaysUtc(startOfDayUtc(now), -(days - 1));
  const previousStart = addDaysUtc(currentStart, -days);

  const windowCount = (model: typeof Doctor | typeof Patient, from: Date, to: Date) =>
    (model as typeof Patient).countDocuments({ createdAt: { $gte: from, $lt: to } });

  const [totalDoctors, totalPatients, newDoctors, prevDoctors, newPatients, prevPatients, withPatients] =
    await Promise.all([
      Doctor.estimatedDocumentCount(),
      Patient.estimatedDocumentCount(),
      windowCount(Doctor, currentStart, addDaysUtc(endOfDayUtc(now), 0)),
      windowCount(Doctor, previousStart, currentStart),
      windowCount(Patient, currentStart, addDaysUtc(endOfDayUtc(now), 0)),
      windowCount(Patient, previousStart, currentStart),
      Patient.aggregate<{ n: number }>([{ $group: { _id: '$doctorId' } }, { $count: 'n' }]),
    ]);

  const doctorsWithPatients = withPatients[0]?.n ?? 0;

  return {
    totalDoctors,
    totalPatients,
    averagePatientsPerDoctor: totalDoctors ? round1(totalPatients / totalDoctors) : 0,
    doctorsWithoutPatients: Math.max(totalDoctors - doctorsWithPatients, 0),
    periodDays: days,
    newDoctors: { current: newDoctors, previous: prevDoctors, changePercent: pctChange(newDoctors, prevDoctors) },
    newPatients: { current: newPatients, previous: prevPatients, changePercent: pctChange(newPatients, prevPatients) },
  };
}

export async function getPatientsPerDoctor(opts: { from?: Date; to?: Date; limit: number }) {
  const range = createdAtRange(opts.from, opts.to);

  const rows = await Patient.aggregate<{ doctorId: unknown; name: string; specialization: string; patientCount: number }>([
    ...(range ? [{ $match: { createdAt: range } }] : []),
    { $group: { _id: '$doctorId', patientCount: { $sum: 1 } } },
    { $sort: { patientCount: -1, _id: 1 } },
    { $limit: opts.limit },
    // Join only the page of top doctors, projecting just the fields we render.
    {
      $lookup: {
        from: Doctor.collection.name,
        localField: '_id',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, specialization: 1 } }],
        as: 'doctor',
      },
    },
    { $unwind: '$doctor' },
    {
      $project: {
        _id: 0,
        doctorId: { $toString: '$_id' },
        name: '$doctor.name',
        specialization: '$doctor.specialization',
        patientCount: 1,
      },
    },
  ]);
  return rows;
}

/** Picks a readable bucket size for the chosen window. */
function autoInterval(from: Date, to: Date): Interval {
  const days = (to.getTime() - from.getTime()) / 86_400_000 + 1;
  if (days <= 62) return 'day';
  if (days <= 240) return 'week';
  return 'month';
}

function bucketStart(d: Date, interval: Interval): Date {
  const day = startOfDayUtc(d);
  if (interval === 'day') return day;
  if (interval === 'week') {
    const dow = (day.getUTCDay() + 6) % 7; // Monday = 0
    return addDaysUtc(day, -dow);
  }
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
}

function nextBucket(d: Date, interval: Interval): Date {
  if (interval === 'day') return addDaysUtc(d, 1);
  if (interval === 'week') return addDaysUtc(d, 7);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

const key = (d: Date) => d.toISOString().slice(0, 10);

async function countsByBucket(model: typeof Doctor | typeof Patient, from: Date, to: Date, interval: Interval) {
  const rows = await (model as typeof Patient).aggregate<{ _id: Date; count: number }>([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: { $dateTrunc: { date: '$createdAt', unit: interval, timezone: 'UTC', startOfWeek: 'monday' } },
        count: { $sum: 1 },
      },
    },
  ]);
  return new Map(rows.map((r) => [key(r._id), r.count]));
}

export async function getStatistics(q: StatisticsQuery) {
  const today = startOfDayUtc(new Date());
  const to = q.to ? startOfDayUtc(q.to) : today;
  const from = q.from ? startOfDayUtc(q.from) : addDaysUtc(to, -29);
  const interval: Interval = q.interval ?? autoInterval(from, to);
  const start = startOfDayUtc(from);
  const end = endOfDayUtc(to);

  const [doctorMap, patientMap, conditions, gender] = await Promise.all([
    countsByBucket(Doctor, start, end, interval),
    countsByBucket(Patient, start, end, interval),
    Patient.aggregate<{ condition: string; count: number }>([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$condition', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $project: { _id: 0, condition: '$_id', count: 1 } },
    ]),
    Patient.aggregate<{ gender: string; count: number }>([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $project: { _id: 0, gender: '$_id', count: 1 } },
    ]),
  ]);

  // Zero-fill so the chart x-axis is continuous even for days/weeks with no registrations.
  const series: { date: string; doctors: number; patients: number }[] = [];
  let totalDoctors = 0;
  let totalPatients = 0;
  for (let b = bucketStart(start, interval); b <= end; b = nextBucket(b, interval)) {
    const k = key(b);
    const doctors = doctorMap.get(k) ?? 0;
    const patients = patientMap.get(k) ?? 0;
    totalDoctors += doctors;
    totalPatients += patients;
    series.push({ date: k, doctors, patients });
  }

  return {
    range: { from: key(from), to: key(to), interval },
    totals: { doctors: totalDoctors, patients: totalPatients },
    series,
    conditions,
    gender,
  };
}
