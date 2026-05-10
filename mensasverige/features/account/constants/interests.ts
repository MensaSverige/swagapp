// NOTE: After running `yarn generate-types`, replace this local type with:
// import { components } from '@/api_schema/schema';
// export type UserInterest = components['schemas']['UserInterest'];
export type UserInterest = string;

export type InterestCategory = { category: string; items: UserInterest[] };
