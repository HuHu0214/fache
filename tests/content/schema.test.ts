import {
  scenarioFrontmatterSchema,
  knowledgePointFrontmatterSchema,
} from '../../src/content/schema';

const scenario = {
  id: 'contract-formation',
  title: '口头说好的事，算数吗？',
  hook: '房东口头答应我续租，转头又租给别人。',
  kpIds: ['contract-formation'],
  primaryKpId: 'contract-formation',
  articleRefs: [{ lawId: 'civil-code', articleNo: '第四百六十九条' }],
  estimatedMinutes: 4,
  order: 1,
};

test('合法场景通过，reviewStatus 默认 draft', () => {
  const parsed = scenarioFrontmatterSchema.parse(scenario);
  expect(parsed.reviewStatus).toBe('draft');
});

test('阿拉伯数字条号被拒绝', () => {
  expect(() =>
    scenarioFrontmatterSchema.parse({
      ...scenario,
      articleRefs: [{ lawId: 'civil-code', articleNo: '第469条' }],
    }),
  ).toThrow();
});

test('primaryKpId 必须在 kpIds 中', () => {
  expect(() =>
    scenarioFrontmatterSchema.parse({ ...scenario, primaryKpId: 'missing' }),
  ).toThrow();
});

test('知识点必须有 reviewPrompt 和 reviewAnswer', () => {
  expect(() =>
    knowledgePointFrontmatterSchema.parse({
      id: 'x', title: 'x', oneLiner: 'x', articleRefs: [],
      relatedKpIds: [], confusions: [], order: 1,
    }),
  ).toThrow();
});
