import { useState } from 'react';
import { Dialog } from './ui/dialog';

const STORAGE_KEY = 'fajing.disclaimer';

export function Disclaimer() {
  const [accepted, setAccepted] = useState(
    () => localStorage.getItem(STORAGE_KEY) !== null,
  );

  return (
    <Dialog
      open={!accepted}
      onOpenChange={(open) => {
        if (!open) {
          localStorage.setItem(STORAGE_KEY, '1');
          setAccepted(true);
        }
      }}
      title="免责声明"
    >
      <p>
        本站内容仅供学习，不构成法律意见。具体案件请咨询执业律师。
      </p>
      <p className="mt-2 text-[var(--muted)]">
        法条原文来自国家法律法规数据库，解释文字仅供参考。
      </p>
    </Dialog>
  );
}
