import { Server } from 'socket.io';
import { createServer } from 'http';

describe('Signaling Server', () => {
  it('should start and accept connections', (done) => {
    const httpServer = createServer();
    const io = new Server(httpServer);
    httpServer.listen(() => {
      const addr = httpServer.address();
      expect(addr).toBeTruthy();
      io.close();
      httpServer.close();
      done();
    });
  });
});
