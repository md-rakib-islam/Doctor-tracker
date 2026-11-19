import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Doctor } from '../src/models/Doctor';
import { Patient } from '../src/models/Patient';
import { doctorPayload, loggedInAgent, patientPayload, resetDb, startDb, stopDb } from './helpers';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(resetDb);

describe('doctors', () => {
  it('creates, reads, updates a doctor', async () => {
    const agent = await loggedInAgent();
    const created = await agent.post('/api/doctors').send(doctorPayload()).expect(201);
    const id = created.body.data.id;
    expect(created.body.data).toMatchObject({ name: 'Dr. Amina Rahman', patientCount: 0 });
    expect(created.body.data._id).toBeUndefined();
    expect(created.body.data.__v).toBeUndefined();

    await agent.get(`/api/doctors/${id}`).expect(200);
    const updated = await agent.patch(`/api/doctors/${id}`).send({ hospital: 'City Clinic' }).expect(200);
    expect(updated.body.data.hospital).toBe('City Clinic');
  });

  it('validates input and ids', async () => {
    const agent = await loggedInAgent();
    const bad = await agent.post('/api/doctors').send({ name: 'x', email: 'bad', phone: 'abc' }).expect(400);
    expect(bad.body.errors.map((e: { field: string }) => e.field)).toEqual(
      expect.arrayContaining(['name', 'specialization', 'hospital', 'phone', 'email']),
    );
    await agent.get('/api/doctors/not-an-id').expect(400);
    await agent.get('/api/doctors/507f1f77bcf86cd799439011').expect(404);
    await agent.patch('/api/doctors/507f1f77bcf86cd799439011').send({}).expect(400);
  });

  it('rejects duplicate emails with 409', async () => {
    const agent = await loggedInAgent();
    await agent.post('/api/doctors').send(doctorPayload()).expect(201);
    const dup = await agent.post('/api/doctors').send(doctorPayload({ name: 'Another Doctor' })).expect(409);
    expect(dup.body.code).toBe('DUPLICATE');
  });

  it('searches, filters, sorts and paginates on the server', async () => {
    const agent = await loggedInAgent();
    for (let i = 0; i < 12; i++) {
      await agent.post('/api/doctors').send(
        doctorPayload({
          name: `Dr. Person ${String(i).padStart(2, '0')}`,
          email: `p${i}@example.com`,
          specialization: i % 2 ? 'Neurology' : 'Cardiology',
          hospital: i < 6 ? 'Alpha Hospital' : 'Beta Hospital',
        }),
      );
    }
    const page1 = await agent.get('/api/doctors?limit=5&page=1').expect(200);
    expect(page1.body.data).toHaveLength(5);
    expect(page1.body.pagination).toEqual({ page: 1, limit: 5, total: 12, totalPages: 3 });
    const page3 = await agent.get('/api/doctors?limit=5&page=3').expect(200);
    expect(page3.body.data).toHaveLength(2);

    const search = await agent.get('/api/doctors?search=person%2007').expect(200);
    expect(search.body.data).toHaveLength(1);
    // regex metacharacters are treated literally
    const evil = await agent.get('/api/doctors?search=' + encodeURIComponent('.*')).expect(200);
    expect(evil.body.data).toHaveLength(0);

    const combo = await agent.get('/api/doctors?specialization=Neurology&hospital=Alpha%20Hospital').expect(200);
    expect(combo.body.pagination.total).toBe(3);

    const sorted = await agent.get('/api/doctors?sortBy=name&order=asc&limit=1').expect(200);
    expect(sorted.body.data[0].name).toBe('Dr. Person 00');

    const future = await agent.get('/api/doctors?from=2999-01-01').expect(200);
    expect(future.body.pagination.total).toBe(0);
    const today = new Date().toISOString().slice(0, 10);
    const inRange = await agent.get(`/api/doctors?from=${today}&to=${today}`).expect(200);
    expect(inRange.body.pagination.total).toBe(12);
    await agent.get('/api/doctors?from=2024-05-02&to=2024-05-01').expect(400);
    await agent.get('/api/doctors?limit=1000').expect(400);
  });

  it('returns patient counts per doctor and filter options', async () => {
    const agent = await loggedInAgent();
    const a = (await agent.post('/api/doctors').send(doctorPayload()).expect(201)).body.data.id;
    const b = (await agent.post('/api/doctors').send(doctorPayload({ email: 'b@example.com', specialization: 'Dermatology' }))).body.data.id;
    await agent.post(`/api/doctors/${a}/patients`).send({ ...patientPayload(a), doctorId: undefined }).expect(201);
    await agent.post(`/api/doctors/${a}/patients`).send({ ...patientPayload(a, { fullName: 'Second Patient' }), doctorId: undefined }).expect(201);

    const list = await agent.get('/api/doctors').expect(200);
    const counts = Object.fromEntries(list.body.data.map((d: { id: string; patientCount: number }) => [d.id, d.patientCount]));
    expect(counts[a]).toBe(2);
    expect(counts[b]).toBe(0);

    const filters = await agent.get('/api/doctors/filters').expect(200);
    expect(filters.body.data.specializations).toEqual(['Cardiology', 'Dermatology']);
  });

  it("lists a doctor's patients and adds/deletes them", async () => {
    const agent = await loggedInAgent();
    const a = (await agent.post('/api/doctors').send(doctorPayload()).expect(201)).body.data.id;
    const p = await agent.post(`/api/doctors/${a}/patients`).send({ ...patientPayload(a), doctorId: undefined }).expect(201);
    expect(p.body.data.doctorId).toBe(a);
    expect(p.body.data.doctor.name).toBe('Dr. Amina Rahman');

    const list = await agent.get(`/api/doctors/${a}/patients`).expect(200);
    expect(list.body.pagination.total).toBe(1);

    await agent.delete(`/api/patients/${p.body.data.id}`).expect(200);
    expect((await agent.get(`/api/doctors/${a}`)).body.data.patientCount).toBe(0);
    await agent.get('/api/doctors/507f1f77bcf86cd799439011/patients').expect(404);
  });

  describe('deletion policy', () => {
    it('deletes an empty doctor', async () => {
      const agent = await loggedInAgent();
      const id = (await agent.post('/api/doctors').send(doctorPayload()).expect(201)).body.data.id;
      await agent.delete(`/api/doctors/${id}`).expect(200);
      expect(await Doctor.countDocuments()).toBe(0);
    });

    it('refuses (409) when patients exist and nothing changes', async () => {
      const agent = await loggedInAgent();
      const id = (await agent.post('/api/doctors').send(doctorPayload()).expect(201)).body.data.id;
      await agent.post('/api/patients').send(patientPayload(id)).expect(201);
      const res = await agent.delete(`/api/doctors/${id}`).expect(409);
      expect(res.body.errors ?? res.body).toBeDefined();
      expect(await Doctor.countDocuments()).toBe(1);
      expect(await Patient.countDocuments()).toBe(1);
    });

    it('reassigns patients to another doctor, then deletes', async () => {
      const agent = await loggedInAgent();
      const a = (await agent.post('/api/doctors').send(doctorPayload()).expect(201)).body.data.id;
      const b = (await agent.post('/api/doctors').send(doctorPayload({ email: 'b@example.com' })).expect(201)).body.data.id;
      await agent.post('/api/patients').send(patientPayload(a)).expect(201);
      const res = await agent.delete(`/api/doctors/${a}?reassignTo=${b}`).expect(200);
      expect(res.body.data.reassigned).toBe(1);
      expect((await agent.get(`/api/doctors/${b}`)).body.data.patientCount).toBe(1);
      await agent.delete(`/api/doctors/${b}?reassignTo=${b}`).expect(400);
    });

    it('cascades when explicitly requested', async () => {
      const agent = await loggedInAgent();
      const a = (await agent.post('/api/doctors').send(doctorPayload()).expect(201)).body.data.id;
      await agent.post('/api/patients').send(patientPayload(a)).expect(201);
      const res = await agent.delete(`/api/doctors/${a}?cascade=true`).expect(200);
      expect(res.body.data.removedPatients).toBe(1);
      expect(await Patient.countDocuments()).toBe(0);
    });
  });
});
