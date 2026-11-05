// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { db } = require('./db');

// *****************************************************
// <!-- Section 2 : App Settings -->
// *****************************************************

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'resources')));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// *****************************************************
// <!-- Section 3 : API Routes -->
// *****************************************************

app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});

app.get('/', (req, res) => {
  res.redirect('/home');
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;

  if (!username || !password) {
    return res.status(400).render('pages/register', {
      message: 'Username and password are required',
      error: true,
    });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    await db.none(
      'INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3)',
      [username.trim(), hash, email ? email.toLowerCase().trim() : null]
    );
    res.redirect('/login');
  } catch (err) {
    console.log(err);
    if (err.code === '23505') {
      return res.status(400).render('pages/register', {
        message: 'Username or email is already taken',
        error: true,
      });
    }
    res.status(500).render('pages/register', {
      message: 'Registration failed',
      error: true,
    });
  }
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [
      username ? username.trim() : '',
    ]);

    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(400).render('pages/login', {
        message: 'Incorrect username or password',
        error: true,
      });
    }

    req.session.regenerate(err => {
      if (err) {
        return res.status(500).render('pages/login', {
          message: 'Login failed',
          error: true,
        });
      }
      req.session.user = {
        user_id: user.user_id,
        username: user.username,
      };
      req.session.save(() => {
        res.redirect('/home');
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('pages/login', {
      message: 'Login failed',
      error: true,
    });
  }
});

const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

app.use(auth);

app.get('/home', (req, res) => {
  res.render('pages/home', {
    username: req.session.user.username,
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = app;
