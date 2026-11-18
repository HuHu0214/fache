import { db, type Note, type TargetType } from '../../lib/db';

export function noteId(
  targetType: TargetType,
  targetId: string,
): string {
  return `${targetType}:${targetId}`;
}

export async function saveNote(
  targetType: TargetType,
  targetId: string,
  content: string,
): Promise<void> {
  await db.notes.put({
    id: noteId(targetType, targetId),
    targetType,
    targetId,
    content,
    updatedAt: new Date().toISOString(),
  });
}

export async function getNote(
  targetType: TargetType,
  targetId: string,
): Promise<Note | undefined> {
  return db.notes.get(noteId(targetType, targetId));
}

export async function listNotes(): Promise<Note[]> {
  return db.notes.orderBy('updatedAt').reverse().toArray();
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}
