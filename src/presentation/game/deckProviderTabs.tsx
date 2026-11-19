import { Tab, Tabs } from '@mui/material';

export function DeckProviderTabs({
  providers,
  value,
  combinedLabel,
  label,
  onChange,
}: {
  providers: readonly { id: string; label: string }[];
  value: string;
  combinedLabel: string;
  label: string;
  onChange: (id: string) => void;
}) {
  if (providers.length < 2) return null;
  return (
    <Tabs
      value={value}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      aria-label={label}
      onChange={(_, id: string) => onChange(id)}
    >
      {providers.map(({ id, label }) => (
        <Tab key={id} value={id} label={label} />
      ))}
      <Tab value="mixed" label={combinedLabel} />
    </Tabs>
  );
}
