import { AxiosError, AxiosResponse } from 'axios';
import { UpdateCheckHeaders } from '../types/UpdateCheckHeaders';
import { UpdateInfo } from '../store/UpdateSlice';
import useStore from '@/features/common/store/store';


const parseUpdateHeaders = (headers: AxiosResponse['headers']): UpdateInfo | null => {
  const isAvailable = headers[UpdateCheckHeaders.UpdateAvailable] === 'true';
  if (!isAvailable) return null;

  return {
    updateAvailable: true,
    latestVersion: headers[UpdateCheckHeaders.LatestVersion] ?? undefined,
    latestBuildNumber: Number(headers[UpdateCheckHeaders.LatestBuild]) || undefined,
    storeUrl: headers[UpdateCheckHeaders.StoreUrl] ?? undefined,
  };
};

export const UpdateCheckResponseInterceptor = async (
  response: AxiosResponse,
): Promise<AxiosResponse> => {
  const updateInfo = parseUpdateHeaders(response.headers);
  useStore.getState().setUpdateAvailableInfo(updateInfo);
  return response;
};

export const UpdateCheckErrorInterceptor = (error: AxiosError<UpdateInfo>) => {
  if (error.response?.status === 418 && error.response.data) {
    useStore.getState().setRequiredUpdateInfo(error.response.data);
  }

  return Promise.reject(error);
};
