import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { Patient } from '../src/models/Patient';
import { doctorPayload, loggedInAgent, patientPayload, resetDb, startDb, stopDb } from './helpers';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(resetDb);

async function setup() {
  const agent = await loggedInAgent();
  const a = (await agent.post('/api/doctors').send(doctorPayload({ name: 'Dr. Alpha' })).expect(201)).body.data.id as string;
  const b = (await agent.post('/api/doctors').send(doctorPayload({ name: 'Dr. Beta', email: 'beta@example.com' })).expect(201)).body.data.id as string;
  return { agent, a, b };
}

describe('patients', () => {
  it('creates, reads, updates, deletes', async () => {
    const { agent, a, b } = await setup();
    const created = await agent.post('/api/patients').send(patientPayload(a)).expect(201);
    const id = created.body.data.id;
    expect(created.body.data.doctor).toMatchObject({ name: 'Dr. Alpha' });

    await agent.get(`/api/patients/${id}`).expect(200);
    const upd = await agent.patch(`/api/patients/${id}`).send({ doctorId: b, age: 43, email: '' }).expect(200);
    expect(upd.body.data.doctor.name).toBe('Dr. Beta');
    expect(upd.body.data.age).toBe(43);
    expect(upd.body.data.email).toBeUndefined();

    await agent.delete(`/api/patients/${id}`).expect(200);
    await agent.get(`/api/patients/${id}`).expect(404);
  });

  it('validates payload and prevents invalid doctor relationships', async () => {
    const { agent, a } = await setup();
    const bad = await agent.post('/api/patients').send({ fullName: 'A', age: 200, gender: 'x', condition: 'Nope', phone: '1' }).expect(400);
    expect(bad.body.errors.map((e: { field: string }) => e.field)).toEqual(
      expect.arrayContaining(['fullName', 'age', 'gender', 'condition', 'phone', 'doctorId']),
    );
    const missingDoctor = await agent.post('/api/patients').send(patientPayload('507f1f77bcf86cd799439011')).expect(400);
    expect(missingDoctor.body.message).toMatch(/doctor/i);
    await agent.post('/api/patients').send(patientPayload('bad-id')).expect(400);
    const p = (await agent.post('/api/patients').send(patientPayload(a)).expect(201)).body.data.id;
    await agent.patch(`/api/patients/${p}`).send({ doctorId: '507f1f77bcf86cd799439011' }).expect(400);
  });

  it('searches by name, phone, email and assigned doctor', async () => {
    const { agent, a, b } = await setup();
    await agent.post('/api/patients').send(patientPayload(a, { fullName: 'Nusrat Jahan', phone: '+8801900000001', email: 'nusrat@mail.test' }));
    await agent.post('/api/patients').send(patientPayload(b, { fullName: 'Rafi Ahmed', phone: '+8801900000002', email: 'rafi@mail.test' }));
    const q = async (s: string) => (await agent.get(`/api/patients?search=${encodeURIComponent(s)}`).expect(200)).body.pagination.total;
    expect(await q('nusrat')).toBe(1);
    expect(await q('0000002')).toBe(1);
    expect(await q('rafi@mail')).toBe(1);
    expect(await q('Dr. Beta')).toBe(1); // doctor name
    expect(await q('zzz')).toBe(0);
  });

  it('combines condition, gender, doctor and date filters with pagination', async () => {
    const { agent, a, b } = await setup();
    const rows = [
      [a, 'Diabetes', 'female'],
      [a, 'Diabetes', 'male'],
      [a, 'Asthma', 'female'],
      [b, 'Diabetes', 'female'],
      [b, 'Migraine', 'other'],
    ] as const;
    for (const [i, [doc, condition, gender]] of rows.entries()) {
      await agent.post('/api/patients').send(patientPayload(doc, { fullName: `Patient ${i}`, condition, gender })).expect(201);
    }
    const total = async (qs: string) => (await agent.get(`/api/patients?${qs}`).expect(200)).body.pagination.total;
    expect(await total('condition=Diabetes')).toBe(3);
    expect(await total(`condition=Diabetes&doctorId=${a}`)).toBe(2);
    expect(await total(`condition=Diabetes&doctorId=${a}&gender=female`)).toBe(1);
    expect(await total('gender=other')).toBe(1);
    expect(await total('from=2999-01-01')).toBe(0);

    // age sort + pagination
    const page = await agent.get('/api/patients?limit=2&page=3').expect(200);
    expect(page.body.data).toHaveLength(1);
    expect(page.body.pagination).toEqual({ page: 3, limit: 2, total: 5, totalPages: 3 });
    await agent.get('/api/patients?condition=Bogus').expect(400);
  });

  it('date range is inclusive of the whole end day', async () => {
    const { agent, a } = await setup();
    const p = await agent.post('/api/patients').send(patientPayload(a)).expect(201);
    await Patient.collection.updateOne({ _id: new Types.ObjectId(p.body.data.id) }, { $set: { createdAt: new Date('2025-03-10T23:30:00Z') } });
    const res = await agent.get('/api/patients?from=2025-03-10&to=2025-03-10').expect(200);
    expect(res.body.pagination.total).toBe(1);
    const miss = await agent.get('/api/patients?from=2025-03-11&to=2025-03-12').expect(200);
    expect(miss.body.pagination.total).toBe(0);
  });
});
