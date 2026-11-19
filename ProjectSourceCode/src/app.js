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
const validateRegistration = require('./validateRegistration');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');

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

// Configure fridge photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum 5 MB
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }

    callback(null, true);
  },
});

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
  res.render('pages/register', { layout: 'cookly' });
});

app.post('/register', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;

  if (!validateRegistration({ username, password })) {
    return res.status(400).render('pages/register', {
      layout: 'cookly',
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
        layout: 'cookly',
        message: 'Username or email is already taken',
        error: true,
      });
    }
    res.status(500).render('pages/register', {
      layout: 'cookly',
      message: 'Registration failed',
      error: true,
    });
  }
});

app.get('/login', (req, res) => {
  res.render('pages/login', { layout: 'cookly' });
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
        layout: 'cookly',
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
      layout: 'cookly',
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
    layout: 'cookly',
    username: req.session.user.username,
    showSidebar: true,
    activeHome: true,
  });
});

// Pantry Page
app.get('/pantry', (req, res) => {
  res.render('pages/pantry', {
    layout: false,
    username: req.session.user.username,
  });
});

// AI Ingredient Recognition
app.post('/api/pantry/analyze', (req, res) => {

  // Handle image uploads and validation errors
  upload.single('photo')(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        error: uploadError.message,
      });
    }

    // Make sure a photo was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'Please upload a fridge photo.',
      });
    }

    // Verify the actual image format using file signatures
    const buffer = req.file.buffer;
    const isJpeg = buffer.length >= 3 &&
      buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));

    const isPng = buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      );

    const isWebp = buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';

    const detectedType = isJpeg ? 'image/jpeg'
      : isPng ? 'image/png'
      : isWebp ? 'image/webp'
      : null;

    if (!detectedType || detectedType !== req.file.mimetype) {
      return res.status(400).json({
        error: 'Invalid image format.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini API is not configured.',
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      // Ask Gemini to identify visible food ingredients
      const startTime = Date.now();
      console.log('Sending image to Gemini...');
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: [
          {
            text: `Identify the food ingredients visible in this refrigerator photo.

              Return a list of unique ingredient names.

              Rules:
              - Include only ingredients you can reasonably identify.
              - Do not invent ingredients that are not visible.
              - Use simple names such as "Milk", "Eggs", or "Tomatoes".
              - Do not guess quantities or expiration dates.
            - If nothing recognizable is visible, return an empty list.`,
          },
          {
            inlineData: {
              mimeType: detectedType,
              data: buffer.toString('base64'),
            },
          },
        ],
        config: {
          httpOptions: {
            timeout: 90000,
            retryOptions: {
              attempts: 1
            }
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              ingredients: {
                type: 'ARRAY',
                items: {
                  type: 'STRING',
                },
              },
            },
            required: ['ingredients'],
          },
        },
      });

      console.log(
        `Gemini responded in ${((Date.now() - startTime) / 1000).toFixed(1)} seconds`
      );

      const result = JSON.parse(response.text);

      if (!Array.isArray(result.ingredients) ||
          !result.ingredients.every(name => typeof name === 'string')) {
        throw new Error('Unexpected Gemini response format');
      }

      return res.json({
        ingredients: result.ingredients,
      });

    } catch (error) {
      console.error('Gemini ingredient analysis failed:', error.message);

      return res.status(502).json({
        error: 'Unable to analyze the photo. Please try again.',
      });
    }
  });
});

// Recipe browser, with optional search (?q=chicken)
app.get('/recipes', async (req, res) => {
  const search = (req.query.q || '').trim();
  const recipes = await db.any(
    `SELECT recipe_id, name, description, prep_time, cook_time
     FROM recipes
     WHERE $1 = '' OR name ILIKE '%' || $1 || '%'
     ORDER BY name`,
    [search]
  );
  res.render('pages/recipes', {
    layout: 'cookly',
    showSidebar: true,
    activeRecipes: true,
    recipes,
    search,
  });
});

// One recipe with its ingredients
app.get('/recipes/:id', async (req, res) => {
  const recipe = await db.oneOrNone(
    'SELECT * FROM recipes WHERE recipe_id = $1',
    [req.params.id]
  );
  if (!recipe) {
    return res.status(404).send('Recipe not found');
  }
  const ingredients = await db.any(
    `SELECT ingredient_name, quantity, unit
     FROM recipe_ingredients
     WHERE recipe_id = $1
     ORDER BY ingredient_name`,
    [req.params.id]
  );
  res.render('pages/recipe', {
    layout: 'cookly',
    showSidebar: true,
    activeRecipes: true,
    recipe,
    ingredients,
  });
});


app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = app;
