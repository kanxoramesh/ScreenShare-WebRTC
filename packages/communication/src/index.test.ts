import { CommunicationProtocol } from './index';

describe('CommunicationProtocol', () => {
  it('should create a response', () => {
    const req = { requestId: '1', type: 'PING', payload: {} };
    const res = CommunicationProtocol.createResponse(req, { ok: true }, 'success');
    expect(res.status).toBe('success');
    expect(res.requestId).toBe('1');
  });
});
