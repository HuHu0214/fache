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
