import type { UserDto, WarehouseDto } from '@dzen/shared';
import { catalogApi } from '@/features/catalog/catalog.api';
import { useHydrateOnce } from '@/store/hydrate';

export interface UsersPageData {
  users: UserDto[] | null;
  warehouses: WarehouseDto[] | null;
}

export type WarehouseFilter = number | 'none' | null;

export function matchesWarehouse(user: UserDto, filter: WarehouseFilter): boolean {
  if (filter === null) return true;
  if (filter === 'none') return user.warehouse === null;
  return user.warehouse?.id === filter;
}

export function useHydrateUsersPage(initial: UsersPageData): void {
  useHydrateOnce((store) => {
    const state = store.getState();
    if (initial.users && !catalogApi.endpoints.users.select()(state).data) {
      store.dispatch(
        catalogApi.util.upsertQueryEntries([
          { endpointName: 'users', arg: undefined, value: initial.users },
        ]),
      );
    }
    if (initial.warehouses && !catalogApi.endpoints.warehouses.select()(state).data) {
      store.dispatch(
        catalogApi.util.upsertQueryEntries([
          { endpointName: 'warehouses', arg: undefined, value: initial.warehouses },
        ]),
      );
    }
  });
}
