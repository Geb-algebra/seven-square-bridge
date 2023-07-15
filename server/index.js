import { createServer } from 'http';

import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import { createRequestHandler } from '@remix-run/express';

import * as build from '../build/index.js';
import { broadcastDevReady } from '@remix-run/node';
import { Server } from 'socket.io';

const app = express();

app.use(compression()); // compress static files

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// Remix fingerprints its assets so we can cache forever.
app.use('/build', express.static('public/build', { immutable: true, maxAge: '1y' }));

// Aggressively cache fonts for a year
app.use('/fonts', express.static('public/fonts', { immutable: true, maxAge: '1y' }));

app.use(morgan('tiny')); // logging

const httpServer = createServer(app);
const io = new Server(httpServer);

io.on('connection', (socket) => {
  console.info('a user connected');
  socket.on('join', ({ roomId }) => {
    socket.join(roomId);
    console.info(`a user joined room ${roomId}`);
  });
  socket.on('disconnecting', () => {
    console.log(socket.rooms);
    // HACK: should specify the room to leave, without looping on all rooms
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('leave room');
      }
    });
  });
  socket.on('disconnect', () => {
    // should delete from db a player linked to the disconnected user here
    console.info('a user disconnected');
  });
});

app.all(
  '*',
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
    getLoadContext() {
      return { socketIo: io };
    },
  }),
);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.info(`Running app in ${process.env.NODE_ENV} mode`);
  console.info(`Express server listening on port ${PORT}`);
  if (process.env.NODE_ENV === 'development') broadcastDevReady(build);
});

// If you want to run the remix dev command with --no-restart, see https://github.com/remix-run/remix/blob/templates_v2_dev/templates/express
