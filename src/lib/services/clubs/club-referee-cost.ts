type ClubWithTournaments = {
  id: string;
  tournaments: { id: string }[];
};

type GroupedAssignmentCost = {
  tournamentId: string;
  _sum: { totalCost: number | null };
};

export const aggregateRefereeCostByClub = (
  clubs: ClubWithTournaments[],
  grouped: GroupedAssignmentCost[],
): Record<string, number> => {
  const tournamentToClub = new Map<string, string>();

  for (const club of clubs) {
    for (const tournament of club.tournaments) {
      tournamentToClub.set(tournament.id, club.id);
    }
  }

  const refereeCostByClub: Record<string, number> = {};
  for (const club of clubs) {
    refereeCostByClub[club.id] = 0;
  }

  for (const group of grouped) {
    const clubId = tournamentToClub.get(group.tournamentId);
    if (!clubId) continue;

    refereeCostByClub[clubId] =
      (refereeCostByClub[clubId] ?? 0) + (group._sum.totalCost ?? 0);
  }

  return refereeCostByClub;
};
