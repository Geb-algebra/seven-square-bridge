export type Room = {
  id: string;
  players: Player[];
  game: string | null;
};

export type Player = {
  id: string;
  userId: string;
  userName: string;
  roomId: string;
};
