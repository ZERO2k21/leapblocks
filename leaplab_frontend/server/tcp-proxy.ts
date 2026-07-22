import { WebSocketServer, WebSocket } from 'ws';
import * as net from 'net';
import * as http from 'http';
import * as url from 'url';

const PORT = Number(process.env.TCP_PROXY_PORT) || 3002;

const server = http.createServer((_req, res) => {
    res.writeHead(200);
    res.end('Electra TCP Proxy');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    const params = new url.URL(req.url ?? '/', `http://localhost`).searchParams;
    const host = params.get('host');
    const port = Number(params.get('port'));

    if (!host || !port) {
        ws.close(1008, 'Missing host or port');
        return;
    }

    console.log(`[proxy] New connection -> ${host}:${port}`);

    const tcp = new net.Socket();
    tcp.connect(port, host);

    tcp.on('connect', () => {
        console.log(`[proxy] TCP connected to ${host}:${port}`);
    });

    tcp.on('data', (chunk: Buffer) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(chunk);
        }
    });

    tcp.on('close', () => ws.close());
    tcp.on('error', (err: Error) => {
        console.error(`[proxy] TCP error: ${err.message}`);
        ws.close(1011, err.message);
    });

    ws.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as any);
        tcp.write(buf);
    });

    ws.on('close', () => {
        tcp.destroy();
        console.log(`[proxy] WS closed for ${host}:${port}`);
    });

    ws.on('error', () => tcp.destroy());
});

server.listen(PORT, () => {
    console.log(`[Electra TCP Proxy] Listening on :${PORT}`);
});
