import { Chip, Stack, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import {
  matchesPractice,
  type PracticeMode,
  type PracticeRecords,
} from '../../domain/practice/model.js';

const modes: { value: PracticeMode; label: string; detail: string }[] = [
  { value: 'all', label: 'すべて', detail: '選んだ範囲の全曲' },
  { value: 'due', label: '復習', detail: 'FSRSの復習予定を迎えた曲' },
  { value: 'failed', label: '失敗', detail: '最後の出題でお手つき・見送りした曲' },
  { value: 'weak', label: '苦手', detail: '失敗歴があり、学習中または正解数が失敗数以下の曲' },
];

export function PracticeOptions({
  ids,
  records,
  mode,
  onChange,
  now,
}: {
  ids: string[];
  now: Date;
  records: PracticeRecords;
  mode: PracticeMode;
  onChange: (value: PracticeMode) => void;
}) {
  const selected = ids.flatMap((id) => (records[id] ? [records[id]] : []));
  const successes = selected.reduce((sum, record) => sum + record.successes, 0);
  const attempts = selected.reduce((sum, record) => sum + record.successes + record.misses, 0);
  return (
    <Stack spacing={1}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={mode}
        aria-label="練習対象"
        onChange={(_, value: PracticeMode | null) => {
          if (value) onChange(value);
        }}
      >
        {modes.map((item) => (
          <Tooltip key={item.value} title={item.detail} describeChild>
            <ToggleButton value={item.value} sx={{ px: 0.5, flex: 1, whiteSpace: 'nowrap' }}>
              {item.label}{' '}
              {ids.filter((id) => matchesPractice(records[id], item.value, now)).length}
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
      {attempts > 0 && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Chip size="small" label={`学習済み ${selected.length}曲`} />
          <Chip size="small" label={`正答率 ${Math.round((successes / attempts) * 100)}%`} />
        </Stack>
      )}
    </Stack>
  );
}
