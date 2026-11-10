import { useState } from 'react';
import { Box, Chip, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import PersonRounded from '@mui/icons-material/PersonRounded';
import PersonAddRounded from '@mui/icons-material/PersonAddRounded';
import PersonRemoveRounded from '@mui/icons-material/PersonRemoveRounded';
import WifiOffRounded from '@mui/icons-material/WifiOffRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded';
import WorkspacePremiumRounded from '@mui/icons-material/WorkspacePremiumRounded';
import { waitingPlayers } from '../../domain/multiplayer/participants.js';
import type { RoomView } from '../../domain/multiplayer/protocol.js';
import { ConfirmDialog } from '../shared/confirmDialog.js';

export function RoomPlayers({
  room,
  you,
  onKick,
  onUnkick,
}: {
  room: RoomView;
  you: string;
  onKick: (id: string) => void;
  onUnkick: (id: string) => void;
}) {
  const [menu, setMenu] = useState<{ element: HTMLElement; id: string } | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const host = room.host === you;
  const waitingIds = new Set(waitingPlayers(room).map((player) => player.id));
  const menuPlayer = room.players.find((player) => player.id === menu?.id);
  const selected = room.players.find((player) => player.id === target);
  return (
    <>
      <Box
        data-game-panel="players"
        aria-label="参加者"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          minWidth: 0,
          height: { xs: 20, sm: 28 },
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {room.players.map((player) => {
          const ready = room.ready.includes(player.id);
          const waiting = waitingIds.has(player.id);
          const status = player.removed
            ? '退出済み'
            : !player.connected
              ? '切断中'
              : waiting
                ? '準備中'
                : room.phase === 'loading'
                  ? '準備完了'
                  : '接続中';
          const Icon = !player.connected
            ? WifiOffRounded
            : player.id === room.host
              ? WorkspacePremiumRounded
              : waiting
                ? HourglassEmptyRounded
                : ready
                  ? CheckCircleRounded
                  : PersonRounded;
          return (
            <Tooltip
              key={player.id}
              title={`${player.name}・${player.id === room.host ? 'ホスト・' : ''}${status}・${player.score}枚`}
              describeChild
            >
              <Chip
                size="small"
                icon={<Icon />}
                aria-label={`${player.name} ${status} ${player.score}枚`}
                color={
                  player.removed || !player.connected
                    ? 'default'
                    : waiting
                      ? 'warning'
                      : ready
                        ? 'success'
                        : player.id === you
                          ? 'primary'
                          : 'default'
                }
                variant={player.connected ? 'filled' : 'outlined'}
                onClick={
                  host && player.id !== you
                    ? (event) => setMenu({ element: event.currentTarget, id: player.id })
                    : undefined
                }
                label={
                  <Box component="span" sx={{ display: 'inline-flex', gap: 0.75 }}>
                    <span>{player.name}</span>
                    <strong>{player.score}枚</strong>
                  </Box>
                }
                sx={{
                  flexShrink: 0,
                  height: { xs: 18, sm: 24 },
                  opacity: player.removed ? 0.5 : 1,
                  '& .MuiChip-label': { px: 0.75, fontSize: { xs: 10, sm: 12 } },
                  '& .MuiChip-icon': { fontSize: { xs: 13, sm: 18 }, ml: 0.5 },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      <Menu open={host && menu !== null} anchorEl={menu?.element} onClose={() => setMenu(null)}>
        <MenuItem
          sx={{
            color: menuPlayer?.removed ? 'text.primary' : 'error.main',
          }}
          onClick={() => {
            if (menu && menuPlayer?.removed) {
              onUnkick(menu.id);
            } else {
              setTarget(menu?.id ?? null);
            }
            setMenu(null);
          }}
        >
          <ListItemIcon>
            {menuPlayer?.removed ? <PersonAddRounded /> : <PersonRemoveRounded color="error" />}
          </ListItemIcon>
          {menuPlayer?.removed ? 'キックを解除' : '退出させる'}
        </MenuItem>
      </Menu>
      <ConfirmDialog
        open={host && !!selected && !selected.removed}
        title={`${selected?.name ?? ''}さんを退出させますか？`}
        confirmLabel="退出させる"
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (selected) onKick(selected.id);
          setTarget(null);
        }}
      />
    </>
  );
}
