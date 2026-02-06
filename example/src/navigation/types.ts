import type { Article } from '../data/articles';

export type HomeStackParamList = {
  ArticleList: undefined;
  ArticleDetail: { article: Article };
};

export type RootTabParamList = {
  HomeTab: undefined;
  Video: undefined;
  Settings: undefined;
};
