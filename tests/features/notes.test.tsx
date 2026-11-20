import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from '../../src/features/notes/NoteEditor';
import { BookmarkButton } from '../../src/features/bookmarks/BookmarkButton';
import { getNote } from '../../src/features/notes/notes-repo';
import { db } from '../../src/lib/db';

beforeEach(async () => {
  await Promise.all([db.notes.clear(), db.bookmarks.clear()]);
});

test('输入笔记后自动保存', async () => {
  render(
    <NoteEditor targetType="kp" targetId="contract-formation" />,
  );
  await userEvent.type(
    screen.getByRole('textbox'),
    '记得看第四百六十九条',
  );
  await vi.waitFor(
    async () => {
      expect(
        (await getNote('kp', 'contract-formation'))?.content,
      ).toContain('第四百六十九条');
    },
    { timeout: 2000 },
  );
});

test('切换目标时不会把上一篇笔记写到下一篇', async () => {
  const view = render(
    <NoteEditor
      key="kp:a"
      targetType="kp"
      targetId="target-a"
    />,
  );
  await userEvent.type(screen.getByRole('textbox'), 'A 的笔记');
  view.rerender(
    <NoteEditor
      key="kp:b"
      targetType="kp"
      targetId="target-b"
    />,
  );
  expect(screen.getByRole('textbox')).toHaveValue('');
  await vi.waitFor(
    async () => {
      expect((await getNote('kp', 'target-a'))?.content).toContain(
        'A 的笔记',
      );
    },
    { timeout: 2000 },
  );
  expect(await getNote('kp', 'target-b')).toBeUndefined();
});

test('离开页面时立即保存未完成的编辑', async () => {
  const view = render(
    <NoteEditor targetType="kp" targetId="target-c" />,
  );
  await userEvent.type(screen.getByRole('textbox'), '立刻离开');
  view.unmount();
  await vi.waitFor(
    async () => {
      expect((await getNote('kp', 'target-c'))?.content).toContain(
        '立刻离开',
      );
    },
    { timeout: 2000 },
  );
});

test('刚打开时不会误显示已保存', async () => {
  render(<NoteEditor targetType="kp" targetId="fresh-target" />);
  await new Promise((resolve) => setTimeout(resolve, 650));
  expect(screen.getByText('自动保存')).toBeInTheDocument();
});

test('收藏按钮可切换并带 aria-pressed', async () => {
  render(
    <BookmarkButton
      targetType="kp"
      targetId="contract-formation"
    />,
  );
  const btn = await screen.findByRole('button', { name: /收藏/ });
  expect(btn).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(btn);
  expect(
    await screen.findByRole('button', { name: /已收藏/ }),
  ).toHaveAttribute('aria-pressed', 'true');
});
