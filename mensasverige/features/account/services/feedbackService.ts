import apiClient from '../../common/services/apiClient';

export type FeedbackKind = 'idea' | 'bug' | 'feedback';

export type FeedbackItem = {
  number: number;
  title: string;
  body: string;
  html_url: string;
  state: string;
  created_at: string;
  labels: string[];
};

export type FeedbackCreate = {
  title: string;
  body: string;
  kind?: FeedbackKind;
};

export const createFeedback = (payload: FeedbackCreate): Promise<FeedbackItem> => {
  return apiClient.post('/feedback', payload).then(res => res.data);
};

export const listFeedback = (): Promise<FeedbackItem[]> => {
  return apiClient.get('/feedback').then(res => res.data);
};
