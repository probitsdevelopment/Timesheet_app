const base = import.meta.env.VITE_API_BASE_URL || "";
const port = import.meta.env.VITE_API_PORT;
export const baseURL = base && port ? `${base}:${port}` : base;