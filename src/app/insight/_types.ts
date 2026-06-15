export type FormData = {
  email: string;
  company: string;
  employees: string;
  name: string;
  role: string;
  whatsapp: string;
  challenge: string;
  target: string;
};

export const LIKERT_OPTIONS = [
  { value: 1, label: "Sangat Tidak Setuju" },
  { value: 2, label: "Tidak Setuju" },
  { value: 3, label: "50:50" },
  { value: 4, label: "Setuju" },
  { value: 5, label: "Sangat Setuju" },
] as const;
