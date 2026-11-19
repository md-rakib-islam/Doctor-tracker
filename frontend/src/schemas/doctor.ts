import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number (7-20 digits, may start with +)");

export const doctorSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  specialization: z.string().trim().min(2, "Specialization is required").max(100),
  hospital: z.string().trim().min(2, "Hospital is required").max(150),
  phone: phoneSchema,
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
});

export type DoctorFormValues = z.infer<typeof doctorSchema>;
