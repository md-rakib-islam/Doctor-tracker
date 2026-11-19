export const queryKeys = {
  me: ["auth", "me"] as const,
  doctors: {
    all: ["doctors"] as const,
    list: (params: object) => ["doctors", "list", params] as const,
    detail: (id: string) => ["doctors", "detail", id] as const,
    patients: (id: string, params: object) => ["doctors", "detail", id, "patients", params] as const,
    filters: ["doctors", "filters"] as const,
    options: ["doctors", "options"] as const,
  },
  patients: {
    all: ["patients"] as const,
    list: (params: object) => ["patients", "list", params] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    overview: (days: number) => ["dashboard", "overview", days] as const,
    perDoctor: (params: object) => ["dashboard", "per-doctor", params] as const,
    statistics: (params: object) => ["dashboard", "statistics", params] as const,
  },
};
