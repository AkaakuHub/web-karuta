export interface Membership {
  id: string;
  connectionId: string;
  spectator: boolean;
}
export type Memberships = Record<string, Membership | null>;

export function endMembership(
  members: Memberships,
  token: string,
  connectionId: string,
): Memberships {
  if (members[token]?.connectionId !== connectionId) return members;
  const member = members[token];
  if (!member) return members;
  return { ...members, [token]: { ...member, connectionId: '' } };
}
