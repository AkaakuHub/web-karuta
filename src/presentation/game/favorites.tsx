import { createContext, useContext, useState, type ReactNode } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import StarRounded from '@mui/icons-material/StarRounded';
import StarBorderRounded from '@mui/icons-material/StarBorderRounded';
import { FavoriteStore } from '../../infrastructure/game/favoriteStore.js';
import { useKarutaConfig } from '../config/karutaProvider.js';
import { errorMessage } from '../shared/errorMessage.js';
import { ErrorAlert } from '../shared/errorAlert.js';
import { GameToast } from './gameToast.js';

const Favorites = createContext<{
  ids: readonly string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
} | null>(null);

export function FavoritesProvider({
  resolveId,
  children,
}: {
  resolveId: (id: string) => string;
  children: ReactNode;
}) {
  const { storagePrefix } = useKarutaConfig();
  const [store] = useState(() => new FavoriteStore(localStorage, `${storagePrefix}-favorites`));
  const [ids, setIds] = useState(store.ids);
  const [error, setError] = useState('');
  const toggle = (id: string) => {
    try {
      setIds(store.toggle(resolveId(id)));
    } catch (reason) {
      setError(errorMessage(reason, 'スターを保存できません'));
    }
  };
  return (
    <Favorites value={{ ids, has: (id) => ids.includes(resolveId(id)), toggle }}>
      {children}
      <GameToast open={!!error} onClose={() => setError('')}>
        <ErrorAlert message={error} />
      </GameToast>
    </Favorites>
  );
}

export function useFavorites() {
  const favorites = useContext(Favorites);
  if (!favorites) throw new Error('FavoritesProviderがありません');
  return favorites;
}

export function FavoriteButton({ id, title }: { id: string; title: string }) {
  const favorites = useContext(Favorites);
  if (!favorites) return null;
  const selected = favorites.has(id);
  const label = selected ? `${title}のスターを解除` : `${title}をスターに保存`;
  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        aria-pressed={selected}
        onClick={() => favorites.toggle(id)}
        size="small"
        sx={{ flexShrink: 0, p: 0.5, color: selected ? '#a76500' : 'text.secondary' }}
      >
        {selected ? (
          <StarRounded sx={{ fontSize: 20 }} />
        ) : (
          <StarBorderRounded sx={{ fontSize: 20 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
