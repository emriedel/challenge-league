// Shared League type definitions

export interface League {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  isOwner: boolean;
  inviteCode?: string; // Only shown to owners
  owner?: {
    id: string;
    username: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Extended league type with additional member information
export interface LeagueWithMembers extends League {
  memberships?: {
    userId: string;
    leagueId: string;
    isActive: boolean;
    user: {
      id: string;
      username: string;
    };
  }[];
}

// Type for league creation responses
export interface CreateLeagueResponse {
  league: League;
}

// Type for joining league responses
export interface JoinLeagueResponse {
  league: League;
}