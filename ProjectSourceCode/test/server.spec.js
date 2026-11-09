const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app');
const {db, pgp} = require('../src/db');
const bcrypt = require('bcryptjs');

chai.use(chaiHttp);
const {expect} = chai;

after(() => {
  pgp.end();
});

describe('Welcome route', () => {
  it('returns the default welcome message', async () => {
    const res = await chai.request(app).get('/welcome');
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal({
      status: 'success',
      message: 'Welcome!',
    });
  });
});


describe('Registration route', () => {
  it('registers a new user successfully', async () => {
    const username = 'lab10_test_user';
    const password = 'testPassword123';
    const email = 'lab10_test@example.com';

    await db.none('DELETE FROM users WHERE username = $1', [username]);

    try {
      const res = await chai.request(app)
        .post('/register')
        .redirects(0)
        .type('form')
        .send({username, password, email});

      expect(res).to.have.status(302);
      expect(res).to.redirectTo(/\/login$/);

      const users = await db.any(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      expect(users).to.have.lengthOf(1);

      const user = users[0];

      expect(user.email).to.equal(email);
      expect(user.password_hash.trim()).to.not.equal(password);
      expect(await bcrypt.compare(password, user.password_hash.trim()))
        .to.equal(true);
    } finally {
      await db.none('DELETE FROM users WHERE username = $1', [username]);
    }
  });


  it('rejects registration without a password', async () => {
    const username = 'lab10_missing_password';

    await db.none('DELETE FROM users WHERE username = $1', [username]);

    try {
      const res = await chai.request(app)
        .post('/register')
        .type('form')
        .send({
          username,
          email: 'missing_password@example.com',
        });

      expect(res).to.have.status(400);

      const user = await db.oneOrNone(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      expect(user).to.be.null;
    } finally {
      await db.none('DELETE FROM users WHERE username = $1', [username]);
    }
  });


});
