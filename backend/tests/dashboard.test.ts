import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { Patient } from '../src/models/Patient';
import { doctorPayload, loggedInAgent, patientPayload, resetDb, startDb, stopDb } from './helpers';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(resetDb);

const day = (offset: number) => new Date(Date.now() - offset * 86_400_000);
const ymd = (d: Date) => d.toISOString().slice(0, 10);

describe('dashboard', () => {
  it('returns zeros on an empty database', async () => {
    const agent = await loggedInAgent();
    const o = (await agent.get('/api/dashboard/overview').expect(200)).body.data;
    expect(o).toMatchObject({ totalDoctors: 0, totalPatients: 0, averagePatientsPerDoctor: 0 });
    expect(o.newPatients.changePercent).toBeNull();
    expect((await agent.get('/api/dashboard/patients-per-doctor').expect(200)).body.data).toEqual([]);
    const s = (await agent.get('/api/dashboard/statistics').expect(200)).body.data;
    expect(s.totals).toEqual({ doctors: 0, patients: 0 });
    expect(s.series).toHaveLength(30);
  });

  it('aggregates real data and updates when the database changes', async () => {
    const agent = await loggedInAgent();
    const a = (await agent.post('/api/doctors').send(doctorPayload({ name: 'Dr. A' })).expect(201)).body.data.id;
    const b = (await agent.post('/api/doctors').send(doctorPayload({ name: 'Dr. B', email: 'b@example.com' })).expect(201)).body.data.id;
    await agent.post('/api/doctors').send(doctorPayload({ name: 'Dr. C', email: 'c@example.com' })).expect(201);

    for (let i = 0; i < 3; i++) await agent.post('/api/patients').send(patientPayload(a, { fullName: `A${i}`, condition: 'Diabetes' }));
    await agent.post('/api/patients').send(patientPayload(b, { fullName: 'B0', condition: 'Asthma', gender: 'female' }));

    let o = (await agent.get('/api/dashboard/overview').expect(200)).body.data;
    expect(o).toMatchObject({ totalDoctors: 3, totalPatients: 4, averagePatientsPerDoctor: 1.3, doctorsWithoutPatients: 1 });
    expect(o.newPatients.current).toBe(4);

    const ppd = (await agent.get('/api/dashboard/patients-per-doctor').expect(200)).body.data;
    expect(ppd.map((r: { name: string; patientCount: number }) => [r.name, r.patientCount])).toEqual([
      ['Dr. A', 3],
      ['Dr. B', 1],
    ]);

    const stats = (await agent.get('/api/dashboard/statistics').expect(200)).body.data;
    expect(stats.totals).toEqual({ doctors: 3, patients: 4 });
    expect(stats.conditions[0]).toEqual({ condition: 'Diabetes', count: 3 });
    expect(stats.series.at(-1)).toMatchObject({ date: ymd(new Date()), doctors: 3, patients: 4 });

    // mutate -> dashboard reflects it
    await agent.post('/api/patients').send(patientPayload(b, { fullName: 'B1' })).expect(201);
    o = (await agent.get('/api/dashboard/overview').expect(200)).body.data;
    expect(o.totalPatients).toBe(5);
  });

  it('buckets by date range, zero-fills and computes trend vs previous window', async () => {
    const agent = await loggedInAgent();
    const a = (await agent.post('/api/doctors').send(doctorPayload()).expect(201)).body.data.id;
    const mk = async (daysAgo: number, name: string) => {
      const p = await agent.post('/api/patients').send(patientPayload(a, { fullName: name })).expect(201);
      await Patient.collection.updateOne({ _id: new Types.ObjectId(p.body.data.id) }, { $set: { createdAt: day(daysAgo) } });
    };
    await mk(1, 'recent1');
    await mk(2, 'recent2');
    await mk(40, 'older1'); // previous 30-day window

    const o = (await agent.get('/api/dashboard/overview?days=30').expect(200)).body.data;
    expect(o.newPatients).toMatchObject({ current: 2, previous: 1, changePercent: 100 });

    const s = (await agent.get(`/api/dashboard/statistics?from=${ymd(day(5))}&to=${ymd(day(0))}&interval=day`).expect(200)).body.data;
    expect(s.series).toHaveLength(6);
    expect(s.totals.patients).toBe(2);
    expect(s.series.find((p: { date: string }) => p.date === ymd(day(1))).patients).toBe(1);

    const monthly = (await agent.get(`/api/dashboard/statistics?from=${ymd(day(90))}&to=${ymd(day(0))}&interval=month`).expect(200)).body.data;
    expect(monthly.totals.patients).toBe(3);

    // patients-per-doctor honours the date filter
    const ppd = (await agent.get(`/api/dashboard/patients-per-doctor?from=${ymd(day(5))}`).expect(200)).body.data;
    expect(ppd[0].patientCount).toBe(2);
    await agent.get('/api/dashboard/statistics?from=2025-02-01&to=2025-01-01').expect(400);
  });
});
