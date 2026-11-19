import bcrypt from 'bcrypt';
import { Admin } from '../models/Admin';
import { ApiError } from '../utils/ApiError';
import { signToken } from '../utils/jwt';

export const BCRYPT_ROUNDS = 12;

// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export async function login(email: string, password: string) {
  const admin = await Admin.findOne({ email }).select('+passwordHash name email').lean();
  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !valid) throw ApiError.unauthorized('Invalid email or password');

  const { token, expiresAt } = signToken(String(admin._id));
  return { token, expiresAt, admin: { id: String(admin._id), name: admin.name, email: admin.email } };
}

export async function createAdmin(input: { name: string; email: string; password: string }) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const admin = await Admin.create({ name: input.name, email: input.email, passwordHash });
  return { id: String(admin._id), name: admin.name, email: admin.email };
}
