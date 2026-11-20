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
  const valueRef = useRef('');
  const dirtyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void getNote(targetType, targetId).then((note) => {
      if (cancelled) {
        return;
      }
      if (!touched.current) {
        const content = note?.content ?? '';
        setValue(content);
        valueRef.current = content;
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  useEffect(() => {
    return () => {
      if (!dirtyRef.current) {
        return;
      }
      const content = valueRef.current;
      if (content.trim() === '') {
        void deleteNote(noteId(targetType, targetId));
      } else {
        void saveNote(targetType, targetId, content);
      }
      dirtyRef.current = false;
    };
  }, [targetType, targetId]);

  useEffect(() => {
    if (!loaded || !dirtyRef.current) {
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        const content = valueRef.current;
        if (content.trim() === '') {
          await deleteNote(noteId(targetType, targetId));
        } else {
          await saveNote(targetType, targetId, content);
        }
        dirtyRef.current = false;
        setSaved(true);
      })();
    }, 500);
    return () => clearTimeout(timer);
  }, [value, loaded, targetType, targetId]);

  return (
    <div className="space-y-2">
      <label
        htmlFor={`note-${targetType}-${targetId}`}
        className="hud-label block"
      >
        我的笔记
      </label>
      <textarea
        id={`note-${targetType}-${targetId}`}
        value={value}
        onChange={(event) => {
          touched.current = true;
          dirtyRef.current = true;
          valueRef.current = event.target.value;
          setSaved(false);
          setValue(event.target.value);
        }}
        rows={4}
        placeholder="用自己的话记一句，下次回来更容易想起来。"
        className="w-full rounded-[2px] border border-[var(--line-strong)] bg-[var(--bg-elev)] p-3 text-sm leading-6 text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
      />
      <p className="font-mono text-[10px] tracking-[0.12em] text-[var(--muted)]">
        {saved ? '已保存' : '自动保存'}
      </p>
    </div>
  );
}
