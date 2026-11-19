import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app';
import { Admin } from '../src/models/Admin';
import { Doctor } from '../src/models/Doctor';
import { Patient } from '../src/models/Patient';
import { createAdmin } from '../src/services/auth.service';

export const ADMIN = { name: 'Test Admin', email: 'admin@test.dev', password: 'correct-horse-battery' };

let mongod: MongoMemoryServer;

export async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('doctor-tracker-test'));
  await Promise.all([Admin.init(), Doctor.init(), Patient.init()]);
}

export async function stopDb() {
  await mongoose.disconnect();
  await mongod.stop();
}

export async function resetDb() {
  await Promise.all([Admin.deleteMany({}), Doctor.deleteMany({}), Patient.deleteMany({})]);
}

export const app = createApp();

/** supertest agent that is already logged in (keeps the session cookie). */
export async function loggedInAgent() {
  await createAdmin(ADMIN);
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: ADMIN.email, password: ADMIN.password }).expect(200);
  return agent;
}

export const doctorPayload = (over: Record<string, unknown> = {}) => ({
  name: 'Dr. Amina Rahman',
  specialization: 'Cardiology',
  hospital: 'Central Hospital',
  phone: '+8801711000001',
  email: 'amina.rahman@example.com',
  ...over,
});

export const patientPayload = (doctorId: string, over: Record<string, unknown> = {}) => ({
  fullName: 'Karim Hasan',
  age: 42,
  gender: 'male',
  phone: '+8801811000001',
  email: 'karim@example.com',
  condition: 'Hypertension',
  doctorId,
  ...over,
});
