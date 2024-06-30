import {
  unstable_defineAction as defineAction,
  unstable_defineLoader as defineLoader,
} from "@remix-run/node";
import invariant from "tiny-invariant";
import { getGameByRoomId, getInitializedGame, saveGameByRoomId } from "~/game/lifecycle";
import type { Card } from "~/game/models";
import {
  addToMeld,
  discard,
  draw,
  finishWaitingCalled,
  getAllMelds,
  getHandsAndMeldsFromDeck,
  isSelectedCardMeldable,
  makeNewMeld,
} from "~/game/service";
import { getRoomById } from "~/room/lifecycle";
import type { Player, Room } from "~/room/models";
import { authenticator } from "~/services/auth.server";
import { getSession } from "~/services/session.server";
import { getRequiredStringFromFormData } from "~/utils";

export const loader = defineLoader(async ({ request, response }) => {
  const session = await getSession(request);
  const player: Player = session.get("player");
  invariant(player, "playerId is required");
  return {
    game: await getGameByRoomId(player.roomId),
    error: null,
  };
});

export const action = defineAction(async ({ request, response, params, context }) => {
  await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  const session = await getSession(request);
  const player: Player = session.get("player");
  invariant(player, "playerId is required");
  const room = await getRoomById(player.roomId);
  invariant(room, "Room not found");
  const formData = await request.formData();
  const command = getRequiredStringFromFormData(formData, "command");

  if (command === "start game") {
    const game = getInitializedGame(room.players);
    await saveGameByRoomId(player.roomId, game);
    context.socketIo.emit(command);
    return {
      game,
      error: null,
    };
  }

  const game = await getGameByRoomId(player.roomId);
  if (!game) {
    throw new Error("Game not found");
  }
  const selectedCards = getRequiredStringFromFormData(formData, "selected-cards").split(
    ",",
  ) as Card[];
  if (command === "meld") {
    try {
      makeNewMeld(selectedCards, player, game.deck);
      await saveGameByRoomId(player.roomId, game);
      context.socketIo.emit(command);
      return {
        game,
        error: null,
      };
    } catch (error) {
      const existingMelds = getAllMelds(game.deck);
      for (const meldId of existingMelds.keys()) {
        try {
          addToMeld(selectedCards, player, meldId, game.deck);
          await saveGameByRoomId(player.roomId, game);
          context.socketIo.emit(command);
          return {
            game,
            error: null,
          };
        } catch (e) {
          console.log(e);
        }
      }
      response.status = 400;
      return { game, error: "selected cards can't be meld" };
    }
  }
  if (command === "discard") {
    if (selectedCards.length !== 1) {
      response.status = 400;
      return { game, error: "You must select one card to discard" };
    }
    discard(selectedCards[0], player, game.deck);
    finishWaitingCalled(game.deck);
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    const nextPlayer = game.players[game.currentPlayerIndex];
    // the player who use all cards will not draw a card and finishes the game at this turn
    const { hand } = getHandsAndMeldsFromDeck(game.deck, nextPlayer.id);
    if (hand.length !== 0) {
      draw(game.players[game.currentPlayerIndex], game.deck);
    }
    await saveGameByRoomId(player.roomId, game);
    context.socketIo.emit(command);
    return {
      game,
      error: null,
    };
  }
  response.status = 400;
  return { game, error: "Invalid command" };
});
