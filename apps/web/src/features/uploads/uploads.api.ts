import type { UploadResult } from '@dzen/shared';
import { api } from '@/store/api';

export const uploadsApi = api.injectEndpoints({
  endpoints: (build) => ({
    uploadImage: build.mutation<UploadResult, File>({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/uploads', method: 'POST', body };
      },
    }),
  }),
});

export const { useUploadImageMutation } = uploadsApi;
