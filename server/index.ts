import { createServer } from "node:http";

import { createRequestHandler } from "@remix-run/express";
import closeWithGrace from "close-with-grace";
import compression from "compression";
import express from "express";
import morgan from "morgan";

import { Server } from "socket.io";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      );

// Make sure you guard this with NODE_ENV check
if (process.env.NODE_ENV === "development") {
  if (process.env.MOCKS === "true") {
    await import("../mocks/index.ts");
  }
}

const app = express();

app.use(compression()); // compress static files

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", {
      immutable: true,
      maxAge: "1y",
    }),
  );
}
app.use(express.static("build/client", { maxAge: "1h" }));

app.use(morgan("tiny")); // logging

const httpServer = createServer(app);

const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.info("a user connected");
  socket.on("join", ({ roomId }) => {
    socket.join(roomId);
    console.info(`a user joined room ${roomId}`);
  });
  socket.on("disconnecting", () => {
    console.log(socket.rooms);
    // HACK: should specify the room to leave, without looping on all rooms
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        socket.to(roomId).emit("leave room");
      }
    }
  });
  socket.on("disconnect", () => {
    // should delete from db a player linked to the disconnected user here
    console.info("a user disconnected");
  });
});

app.all(
  "*",
  createRequestHandler({
    // @ts-ignore
    build: viteDevServer
      ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
      : await import("../build/server/index.js"),
    mode: process.env.NODE_ENV,
    getLoadContext() {
      return { socketIo: io };
    },
  }),
);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.info(`Running app in ${process.env.NODE_ENV} mode`);
  console.info(`Express server running at: http://localhost:${PORT}`);
});

// If you want to run the remix dev command with --no-restart, see https://github.com/remix-run/remix/blob/templates_v2_dev/templates/express

closeWithGrace(async () => {
  await new Promise((resolve, reject) => {
    httpServer.close((e) => (e ? reject(e) : resolve("ok")));
  });
});
