export const RAW_BASE =
  'https://raw.githubusercontent.com/ImCa0/just-laws/master/';

export type LawSource = {
  id: string;
  title: string;
  shortTitle: string;
  effectiveAt: string;
  sourceUrl: string;
  files: string[];
  category?: string;
  categoryOrder?: number;
  note?: string;
};

