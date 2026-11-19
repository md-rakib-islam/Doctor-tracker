import { Schema, model, Types, type InferSchemaType } from 'mongoose';
import { GENDERS, PATIENT_CONDITIONS } from '../config/constants';

const patientSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, required: true, enum: GENDERS },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    condition: { type: String, required: true, enum: PATIENT_CONDITIONS },
    doctorId: { type: Types.ObjectId, ref: 'Doctor', required: true },
  },
  { timestamps: true },
);

// A doctor's patient list (newest first) + the $group/$lookup in "patients per doctor".
patientSchema.index({ doctorId: 1, createdAt: -1 });
// Condition filter combined with the default sort.
patientSchema.index({ condition: 1, createdAt: -1 });
// Default list ordering, date-range filter and registration time-series aggregation.
patientSchema.index({ createdAt: -1 });
// Gender filter + gender distribution.
patientSchema.index({ gender: 1, createdAt: -1 });
// Search (anchored/unanchored regex still benefits from index-only scans on these keys).
patientSchema.index({ fullName: 1 });
patientSchema.index({ phone: 1 });

export type PatientDoc = InferSchemaType<typeof patientSchema>;
export const Patient = model('Patient', patientSchema);
