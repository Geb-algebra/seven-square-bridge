export type Room = {
  id: string;
  players: Player[];
};

export type Player = {
  id: string;
  userId: string;
  userName: string;
  roomId: string;
};
