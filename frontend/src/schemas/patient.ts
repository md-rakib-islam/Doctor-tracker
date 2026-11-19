import { z } from "zod";
import { PATIENT_CONDITIONS } from "@/constants";
import { phoneSchema } from "./doctor";

export const patientSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  age: z
    .string()
    .trim()
    .min(1, "Age is required")
    .regex(/^\d+$/, "Age must be a whole number")
    .refine((v) => Number(v) <= 120, "Age must be between 0 and 120"),
  gender: z.enum(["male", "female", "other"], "Select a gender"),
  phone: phoneSchema,
  email: z.union([z.literal(""), z.email("Enter a valid email address")]),
  condition: z.enum(PATIENT_CONDITIONS, "Select a condition"),
  doctorId: z.string().min(1, "Select a doctor"),
});

/** Form state (age kept as string for the input); converted to the API shape by `toPatientPayload`. */
export type PatientFormInput = z.input<typeof patientSchema>;

export interface PatientFormValues {
  fullName: string;
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  email: string;
  condition: string;
  doctorId: string;
}

export const toPatientPayload = (v: z.output<typeof patientSchema>): PatientFormValues => ({
  ...v,
  age: Number(v.age),
});
