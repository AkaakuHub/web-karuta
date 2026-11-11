import { useState, type ReactNode } from 'react';
import { Button, Stack } from '@mui/material';
import { LoadingIndicator } from '../shared/loadingIndicator';

interface DeckSettingsProps {
  disabled: boolean;
  label: string;
  defaultDeckIds: readonly string[];
  renderPicker: (deckId: string, onChange: (deckId: string) => void) => ReactNode;
  visible: boolean;
  onStart: (deckId: string) => void;
  renderOptions?: (deckId: string) => ReactNode;
  disabledForDeck?: (deckId: string) => boolean;
}

export function DeckSettings(props: DeckSettingsProps) {
  if (!props.visible) return null;
  if (!props.defaultDeckIds.length) return <LoadingIndicator label="出題範囲を読み込み中" />;
  return <DeckSelector {...props} />;
}

function DeckSelector({
  disabled,
  label,
  defaultDeckIds,
  onStart,
  renderOptions,
  disabledForDeck,
  renderPicker,
}: DeckSettingsProps) {
  const [selectedId, setSelectedId] = useState(() => {
    const id = defaultDeckIds[Math.floor(Math.random() * defaultDeckIds.length)];
    if (!id) throw new Error('出題範囲がありません');
    return id;
  });
  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      {renderPicker(selectedId, setSelectedId)}
      {renderOptions?.(selectedId)}
      <Button
        data-help="start"
        variant="contained"
        disabled={disabled || disabledForDeck?.(selectedId)}
        onClick={() => onStart(selectedId)}
      >
        {label}
      </Button>
    </Stack>
  );
}
