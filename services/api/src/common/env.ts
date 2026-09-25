import { loadEnv, type Env } from '@mettlo/config';

export const ENV = Symbol('ENV');
export const env: Env = loadEnv();
