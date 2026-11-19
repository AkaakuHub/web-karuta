import { TextField } from '@mui/material';

export function CatalogSearch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      fullWidth
      size="small"
      type="search"
      name="catalog-search"
      autoComplete="off"
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{ mb: 2 }}
    />
  );
}
