import apiClient from '../../common/services/apiClient';

export type FeedbackKind = 'idea' | 'bug' | 'feedback';

export type FeedbackAuthor = {
  type: 'app_user' | 'github';
  label: string;
};

export type VoteTally = {
  up: number;
  down: number;
  score: number;
  my_vote: -1 | 0 | 1;
};

export type FeedbackItem = {
  number: number;
  title: string;
  body: string;
  html_url: string;
  state: string;
  created_at: string;
  labels: string[];
  comments: number;
  author: FeedbackAuthor;
  mine: boolean;
  votes: VoteTally;
};

export type FeedbackComment = {
  id: number;
  body: string;
  created_at: string;
  author: FeedbackAuthor;
  mine: boolean;
};

export type FeedbackCreate = {
  title: string;
  body: string;
  kind?: FeedbackKind;
};

export const createFeedback = (payload: FeedbackCreate): Promise<FeedbackItem> => {
  return apiClient.post('/feedback', payload).then(res => res.data);
};

export const listFeedback = (
  scope: 'all' | 'mine' = 'all',
): Promise<FeedbackItem[]> => {
  return apiClient.get('/feedback', { params: { scope } }).then(res => res.data);
};

export const voteFeedback = (
  number: number,
  value: -1 | 0 | 1,
): Promise<VoteTally> => {
  return apiClient.post(`/feedback/${number}/vote`, { value }).then(res => res.data);
};

export const listComments = (number: number): Promise<FeedbackComment[]> => {
  return apiClient.get(`/feedback/${number}/comments`).then(res => res.data);
};

export const createComment = (
  number: number,
  body: string,
): Promise<FeedbackComment> => {
  return apiClient.post(`/feedback/${number}/comments`, { body }).then(res => res.data);
};
