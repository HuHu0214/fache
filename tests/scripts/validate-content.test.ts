import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateContent } from '../../scripts/validate-content';

async function writeFixture(
  root: string,
  opts: {
    articleNo?: string;
    duplicate?: boolean;
    draft?: boolean;
    scenarioId?: string;
  } = {},
) {
  const themeDir = join(root, 'content/themes/contracts');
  await mkdir(join(themeDir, 'scenarios'), { recursive: true });
  await mkdir(join(themeDir, 'concepts'), { recursive: true });
  await mkdir(join(root, 'content/laws'), { recursive: true });
  await writeFile(
    join(themeDir, 'theme.json'),
    JSON.stringify({ id: 'contracts', title: '合同', intro: '学合同', order: 1 }),
  );
  await writeFile(
    join(themeDir, 'concepts/contract-formation.mdx'),
    `---\nid: contract-formation\ntitle: 合同成立\noneLiner: 双方意思表示一致\narticleRefs:\n  - lawId: civil-code\n    articleNo: 第四百六十九条\nrelatedKpIds: []\nconfusions: []\nreviewPrompt: 合同一定要书面吗\nreviewAnswer: 不一定\norder: 1\nreviewStatus: ${opts.draft ? 'draft' : 'checked'}\n---\n\n正文`,
  );
  await writeFile(
    join(themeDir, 'scenarios/01.mdx'),
    `---\nid: ${opts.scenarioId ?? 'contract-formation-story'}\ntitle: 口头约定\nhook: 口头说好的算数吗\nkpIds: [contract-formation]\nprimaryKpId: contract-formation\narticleRefs:\n  - lawId: civil-code\n    articleNo: ${opts.articleNo ?? '第四百六十九条'}\norder: 1\nreviewStatus: checked\n---\n\n<ConceptLink id="contract-formation">合同成立</ConceptLink>`,
  );
  await writeFile(
    join(root, 'content/laws/civil-code.json'),
    JSON.stringify({
      law: {
        id: 'civil-code',
        title: '民法典',
        shortTitle: '民法典',
        effectiveAt: '2021-01-01',
        sourceUrl: 'https://flk.npc.gov.cn/',
        importedAt: '2026-11-18',
        articleCount: 1,
      },
      articles: [
        {
          lawId: 'civil-code',
          articleNo: '第四百六十九条',
          text: '当事人订立合同，可以采用书面形式、口头形式或者其他形式。',
          path: [],
        },
      ],
    }),
  );
  if (opts.duplicate) {
    await writeFile(
      join(themeDir, 'scenarios/02.mdx'),
      `---\nid: contract-formation-story\ntitle: 重复\nhook: 重复\nkpIds: [contract-formation]\nprimaryKpId: contract-formation\narticleRefs: []\norder: 2\nreviewStatus: checked\n---\n\n正文`,
    );
  }
}

test('合法内容无问题', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fajing-'));
  await writeFixture(root);
  expect(validateContent(root)).toEqual([]);
});

test('引用不存在的法条时报错', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fajing-'));
  await writeFixture(root, { articleNo: '第九百九十九条' });
  expect(
    validateContent(root).some((i) => i.message.includes('第九百九十九条')),
  ).toBe(true);
});

test('重复 id 报错', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fajing-'));
  await writeFixture(root, { duplicate: true });
  expect(
    validateContent(root).some((i) => i.message.includes('重复 id')),
  ).toBe(true);
});

test('不同类型可以复用同一个 id', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fajing-'));
  await writeFixture(root, { scenarioId: 'contract-formation' });
  expect(
    validateContent(root).some((i) => i.message.includes('重复 id')),
  ).toBe(false);
});

test('strict 模式下 draft 内容报错', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fajing-'));
  await writeFixture(root, { draft: true });
  expect(
    validateContent(root, { strict: true }).some((i) =>
      i.message.includes('checked'),
    ),
  ).toBe(true);
  expect(
    validateContent(root).some((i) => i.message.includes('checked')),
  ).toBe(false);
});
