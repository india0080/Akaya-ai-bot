import type { FastifyReply, FastifyRequest } from 'fastify';

/** Opens a Server-Sent Events stream; returns `send` and a cleanup registrar. */
export function openSse(req: FastifyRequest, reply: FastifyReply, corsOrigin: string) {
  reply.hijack();
  const origin = corsOrigin === '*' ? (req.headers.origin ?? '*') : corsOrigin;
  reply.raw.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
    'access-control-allow-origin': origin,
  });
  reply.raw.write(': connected\n\n');
  const send = (event: string, data: unknown) => {
    if (!reply.raw.writableEnded) reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const ping = setInterval(() => reply.raw.write(': ping\n\n'), 20000);
  const cleanups: (() => void)[] = [() => clearInterval(ping)];
  req.raw.on('close', () => cleanups.forEach((f) => f()));
  return {
    send,
    onClose: (f: () => void) => cleanups.push(f),
    end: () => {
      cleanups.forEach((f) => f());
      reply.raw.end();
    },
  };
}

export const userId = (req: FastifyRequest) => String(req.headers['x-user-id'] ?? 'demo').slice(0, 64);
