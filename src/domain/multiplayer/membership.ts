export interface Membership {
  id: string;
  connectionId: string;
  spectator: boolean;
}
export type Memberships = Record<string, Membership | null>;

export function removeMembership(
  members: Memberships,
  token: string,
  connectionId: string,
): Memberships {
  if (members[token]?.connectionId !== connectionId) return members;
  const next = { ...members };
  delete next[token];
  return next;
}
