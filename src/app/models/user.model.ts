export interface User {
  id: string;
  name: string;
  selectedCard?: number | null;
  hasSelected: boolean;
}

export interface Room {
  id: string;
  code: string;
  users: User[];
  isRevealed: boolean;
  createdAt: Date;
}

export interface GameState {
  room: Room | null;
  currentUser: User | null;
  gamePhase: 'voting' | 'revealed';
}

export interface CardResult {
  userSelections: { user: string; card: number }[];
  mostSelected: number | null;
  totalVotes: number;
}
