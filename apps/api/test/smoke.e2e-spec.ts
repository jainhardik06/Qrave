import request from 'supertest';

const API = process.env.API_BASE || 'http://localhost:3001/api';

function randEmail() {
  return `test${Date.now()}_${Math.floor(Math.random() * 10000)}@e2e.local`;
}

describe('API smoke', () => {
  it('GET / should respond with hello message', async () => {
    const res = await request(API).get('/');
    expect(res.status).toBe(200);
    expect(res.body?.message).toBeDefined();
  });

  it('register then login returns access_token', async () => {
    const email = randEmail();
    const password = 'pass123';

    // register
    const reg = await request(API)
      .post('/auth/register')
      .send({ businessName: 'E2E Biz', email, password });

    expect([200, 201]).toContain(reg.status);
    expect(reg.body?.access_token).toBeDefined();

    // login
    const login = await request(API)
      .post('/auth/login')
      .send({ email, password });

    expect(login.status).toBe(200);
    expect(login.body?.access_token).toBeDefined();
  });
});
