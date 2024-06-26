/// <reference types="vite/client" />
/// <reference types="@remix-run/node" />

import type { Server } from "socket.io";

declare module "@remix-run/node" {
  export interface AppLoadContext {
    socketIo: Server;
  }
}
