import { useEffect, useRef, useState } from 'react';
import type { TargetType } from '../../lib/db';
import { deleteNote, getNote, noteId, saveNote } from './notes-repo';

export type NoteEditorProps = {
  targetType: TargetType;
  targetId: string;
};

export function NoteEditor({ targetType, targetId }: NoteEditorProps) {
  const [value, setValue] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const touched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    void getNote(targetType, targetId).then((note) => {
      if (cancelled) {
        return;
      }
      if (!touched.current) {
        setValue(note?.content ?? '');
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        if (value.trim() === '') {
          await deleteNote(noteId(targetType, targetId));
        } else {
          await saveNote(targetType, targetId, value);
        }
        setSaved(true);
      })();
    }, 500);
    return () => clearTimeout(timer);
  }, [value, loaded, targetType, targetId]);

  return (
    <div className="space-y-2">
      <label
        htmlFor={`note-${targetType}-${targetId}`}
        className="block text-sm font-medium"
      >
        我的笔记
      </label>
      <textarea
        id={`note-${targetType}-${targetId}`}
        value={value}
        onChange={(event) => {
          touched.current = true;
          setSaved(false);
          setValue(event.target.value);
        }}
        rows={4}
        placeholder="用自己的话记一句，下次回来更容易想起来。"
        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] p-3 text-sm leading-6 text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      />
      <p className="text-xs text-[var(--muted)]">
        {saved ? '已保存' : '自动保存'}
      </p>
    </div>
  );
}
