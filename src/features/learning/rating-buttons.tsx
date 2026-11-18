import { useState } from 'react';
import type { RatingInput } from '../../lib/db';
import { Button } from '../../components/ui/button';

const options: Array<{ value: RatingInput; label: string }> = [
  { value: 'again', label: '没懂' },
  { value: 'good', label: '大概懂了' },
  { value: 'easy', label: '很熟' },
];

export type RatingButtonsProps = {
  onRate: (rating: RatingInput) => void;
};

export function RatingButtons({ onRate }: RatingButtonsProps) {
  const [rated, setRated] = useState(false);

  if (rated) {
    return (
      <p className="text-sm text-[var(--muted)]">已加入复习</p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-[var(--muted)]">这次看懂了吗？</span>
      {options.map((option) => (
        <Button
          key={option.value}
          variant="outline"
          size="sm"
          onClick={() => {
            setRated(true);
            onRate(option.value);
          }}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
