import type { ProductGroupDto, StatsDto } from '@dzen/shared';
import { catalogApi } from '@/features/catalog/catalog.api';
import { api } from '@/store/api';
import { useHydrateOnce } from '@/store/hydrate';

export const statsApi = api.injectEndpoints({
  endpoints: (build) => ({
    stats: build.query<StatsDto, void>({
      query: () => '/stats',
      providesTags: ['Stats'],
    }),
  }),
});

export const { useStatsQuery } = statsApi;

export interface GroupsPageData {
  stats: StatsDto | null;
  groups: ProductGroupDto[] | null;
}

export function useHydrateGroupsPage(initial: GroupsPageData): void {
  useHydrateOnce((store) => {
    const state = store.getState();
    if (initial.stats && !statsApi.endpoints.stats.select()(state).data) {
      store.dispatch(
        statsApi.util.upsertQueryEntries([
          { endpointName: 'stats', arg: undefined, value: initial.stats },
        ]),
      );
    }
    if (initial.groups && !catalogApi.endpoints.groups.select()(state).data) {
      store.dispatch(
        catalogApi.util.upsertQueryEntries([
          { endpointName: 'groups', arg: undefined, value: initial.groups },
        ]),
      );
    }
  });
}
