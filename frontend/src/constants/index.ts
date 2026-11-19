import { LayoutDashboard, Stethoscope, Users } from "lucide-react";

export const PATIENT_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Cardiac Disease",
  "Arthritis",
  "Migraine",
  "Allergy",
  "Infection",
  "Injury",
  "Skin Disorder",
  "Pregnancy Care",
  "Other",
] as const;

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export const PAGE_SIZES = [10, 20, 50] as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/patients", label: "Patients", icon: Users },
] as const;

export const APP_NAME = "Doctor Tracker";
