import { components } from '@/api_schema/schema';

export type UserInterest = components['schemas']['UserInterest'];
export type InterestCategory = { category: string; items: UserInterest[] };
