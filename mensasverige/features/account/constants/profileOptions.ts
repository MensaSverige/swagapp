import { ProfileOptionItem, ProfileOptionCategory } from '../../../api_schema/types';

export type { ProfileOptionItem, ProfileOptionCategory };

export function findOption(
    items: ProfileOptionItem[],
    value: string | null | undefined,
): ProfileOptionItem | undefined {
    if (!value) return undefined;
    return items.find(o => o.value === value);
}
