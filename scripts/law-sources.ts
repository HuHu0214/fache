export const RAW_BASE =
  'https://raw.githubusercontent.com/ImCa0/just-laws/master/';

export type LawSource = {
  id: string;
  title: string;
  shortTitle: string;
  effectiveAt: string;
  sourceUrl: string;
  files: string[];
  note?: string;
};

export const LAW_SOURCES: LawSource[] = [
  {
    id: 'civil-code',
    title: '中华人民共和国民法典',
    shortTitle: '民法典',
    effectiveAt: '2021-01-01',
    sourceUrl: 'https://flk.npc.gov.cn/',
    files: [
      'docs/civil-and-commercial/civil-code/01-general-principles.md',
      'docs/civil-and-commercial/civil-code/03-contracts.md',
      'docs/civil-and-commercial/civil-code/05-marriage-and-family.md',
      'docs/civil-and-commercial/civil-code/06-inheritance.md',
    ],
    note: 'v1 仅收录总则、合同、婚姻家庭、继承四编',
  },
  {
    id: 'labor-contracts-law',
    title: '中华人民共和国劳动合同法',
    shortTitle: '劳动合同法',
    effectiveAt: '2013-07-01',
    sourceUrl: 'https://flk.npc.gov.cn/',
    files: ['docs/social/labor-contracts-law/README.md'],
  },
  {
    id: 'labor-law',
    title: '中华人民共和国劳动法',
    shortTitle: '劳动法',
    effectiveAt: '1995-01-01',
    sourceUrl: 'https://flk.npc.gov.cn/',
    files: ['docs/social/labor-law/README.md'],
  },
  {
    id: 'labor-dispute-mediation-and-arbitration-law',
    title: '中华人民共和国劳动争议调解仲裁法',
    shortTitle: '劳动争议调解仲裁法',
    effectiveAt: '2008-05-01',
    sourceUrl: 'https://flk.npc.gov.cn/',
    files: [
      'docs/procedural/labor-dispute-mediation-and-arbitration-law/README.md',
    ],
  },
  {
    id: 'social-insurance-law',
    title: '中华人民共和国社会保险法',
    shortTitle: '社会保险法',
    effectiveAt: '2011-07-01',
    sourceUrl: 'https://flk.npc.gov.cn/',
    files: ['docs/social/social-insurance-law/README.md'],
  },
  {
    id: 'anti-domestic-violence-law',
    title: '中华人民共和国反家庭暴力法',
    shortTitle: '反家庭暴力法',
    effectiveAt: '2016-03-01',
    sourceUrl: 'https://flk.npc.gov.cn/',
    files: ['docs/social/anti-domestic-violence-law/README.md'],
  },
  {
    id: 'e-commerce-law',
    title: '中华人民共和国电子商务法',
    shortTitle: '电子商务法',
    effectiveAt: '2019-01-01',
    sourceUrl: 'https://flk.npc.gov.cn/',
    files: ['docs/economic/e-commerce-law/README.md'],
  },
];
