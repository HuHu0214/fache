import { db, type Bookmark, type TargetType } from '../../lib/db';

export function bookmarkId(
  targetType: TargetType,
  targetId: string,
): string {
  return `${targetType}:${targetId}`;
}

export async function toggleBookmark(
  targetType: TargetType,
  targetId: string,
): Promise<boolean> {
  const id = bookmarkId(targetType, targetId);
  const existing = await db.bookmarks.get(id);
  if (existing) {
    await db.bookmarks.delete(id);
    return false;
  }
  await db.bookmarks.put({
    id,
    targetType,
    targetId,
    createdAt: new Date().toISOString(),
  });
  return true;
}

export async function isBookmarked(
  targetType: TargetType,
  targetId: string,
): Promise<boolean> {
  return (await db.bookmarks.get(bookmarkId(targetType, targetId))) !== undefined;
}

export async function listBookmarks(): Promise<Bookmark[]> {
  return db.bookmarks.orderBy('createdAt').reverse().toArray();
}
