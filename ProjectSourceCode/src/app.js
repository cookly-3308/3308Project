
 // *****************************************************
 // Section 1: Import Dependencies
 // *****************************************************

const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { db } = require('./db');
const validateRegistration = require('./validateRegistration');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const convertHeic = require('heic-convert');

// *****************************************************
// Section 2: App Settings
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

// Store uploaded photos outside public resources.
const uploadDir =
  process.env.UPLOAD_DIR ||
  path.join(__dirname, '..', 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 5,
  },
});

// Session configuration
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
// Section 3: Public Routes
// *****************************************************

app.get('/welcome', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome!',
  });
});

app.get('/', (req, res) => {
  res.redirect('/home');
});

// *****************************************************
// Registration
// *****************************************************

app.get('/register', (req, res) => {
  res.render('pages/register', {
    layout: 'cookly',
  });
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
      `INSERT INTO users
       (username, password_hash, email)
       VALUES ($1, $2, $3)`,
      [
        username.trim(),
        hash,
        email ? email.toLowerCase().trim() : null,
      ]
    );

    res.redirect('/login');
  } catch (err) {
    console.error(err);

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

// *****************************************************
// Login
// *****************************************************

app.get('/login', (req, res) => {
  res.render('pages/login', {
    layout: 'cookly',
  });
});

app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const user = await db.oneOrNone(
      'SELECT * FROM users WHERE username = $1',
      [username ? username.trim() : '']
    );

    if (
      !user ||
      !(await bcrypt.compare(
        password || '',
        user.password_hash
      ))
    ) {
      return res.status(400).render('pages/login', {
        layout: 'cookly',
        message: 'Incorrect username or password',
        error: true,
      });
    }

    req.session.regenerate(err => {
      if (err) {
        return res.status(500).render('pages/login', {
          layout: 'cookly',
          message: 'Login failed',
          error: true,
        });
      }

      req.session.user = {
        user_id: user.user_id,
        username: user.username,
      };

      req.session.save(err => {
        if (err) {
          return res.status(500).render('pages/login', {
            layout: 'cookly',
            message: 'Login failed',
            error: true,
          });
        }

        res.redirect('/home');
      });
    });
  } catch (err) {
    console.error(err);

    res.status(500).render('pages/login', {
      layout: 'cookly',
      message: 'Login failed',
      error: true,
    });
  }
});

// *****************************************************
// Section 4: Authentication Middleware
// *****************************************************

const auth = (req, res, next) => {
  // Development-only preview bypass.
  // Only allows viewing frontend pages and recipe details.
  // It does not create a fake authenticated user.

  const devBypass =
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_BYPASS_AUTH === 'true';

  const previewPages = [
    '/home',
    '/pantry',
    '/recipes',
  ];

  const isRecipeDetails =
    /^\/recipes\/\d+$/.test(req.path);

  if (
    devBypass &&
    req.method === 'GET' &&
    (
      previewPages.includes(req.path) ||
      isRecipeDetails
    )
  ) {
    return next();
  }

  // Normal authentication
  if (!req.session.user) {
    return res.redirect('/login');
  }

  next();
};

app.use(auth);

// *****************************************************
// Section 5: Home Page
// *****************************************************

app.get('/home', (req, res) => {
  res.render('pages/home', {
    layout: 'cookly',
    username: req.session.user?.username || 'Test User',
    showSidebar: true,
    activeHome: true,
  });
});

// *****************************************************
// Section 6: Pantry Page
// *****************************************************

app.get('/pantry', (req, res) => {
  res.render('pages/pantry', {
    layout: false,
    username: req.session.user?.username || 'Test User',
  });
});

// *****************************************************
// Section 7: Recipe Browser
// *****************************************************

// Retrieves recipes from PostgreSQL.
// Supports optional search by recipe name.
// Example: /recipes?q=chicken

app.get('/recipes', async (req, res) => {
  try {
    const search =
      typeof req.query.q === 'string'
        ? req.query.q.trim()
        : '';

    const recipes = await db.any(
      `SELECT
          recipe_id,
          name,
          description,
          prep_time,
          cook_time
       FROM recipes
       WHERE $1 = ''
          OR name ILIKE '%' || $1 || '%'
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

  } catch (err) {
    console.error('Recipe browser error:', err);

    res.status(500).send(
      'Unable to load recipes.'
    );
  }
});

// *****************************************************
// Section 8: Individual Recipe Details
// *****************************************************

app.get('/recipes/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(404).send('Recipe not found');
  }

  try {
    // Retrieve the requested recipe
    const recipe = await db.oneOrNone(
      `SELECT *
       FROM recipes
       WHERE recipe_id = $1`,
      [req.params.id]
    );

    if (!recipe) {
      return res.status(404).send(
        'Recipe not found'
      );
    }

    // Retrieve all ingredients for the recipe
    const ingredients = await db.any(
      `SELECT
          ingredient_name,
          quantity,
          unit
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

  } catch (err) {
    console.error('Recipe details error:', err);

    res.status(500).send(
      'Unable to load recipe details.'
    );
  }
});

// *****************************************************
// Section 9: Fridge Photo Storage API
// *****************************************************

const imageTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Upload up to five photos.
// Accepted field name: photos

app.post(
  '/photos',
  (req, res, next) => {
    upload.array('photos', 5)(req, res, err => {
      if (err) {
        return res.status(400).json({
          error: 'Upload up to 5 photos, 15 MB each',
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      const files = req.files || [];

      if (files.length === 0) {
        return res.status(400).json({
          error: 'Choose at least one photo',
        });
      }

      // Validate image types
      for (const file of files) {
        const ext =
          path.extname(file.originalname).toLowerCase();

        const isHeic =
          ext === '.heic' ||
          ext === '.heif' ||
          file.mimetype === 'image/heic' ||
          file.mimetype === 'image/heif';

        if (!isHeic && !imageTypes[file.mimetype]) {
          return res.status(400).json({
            error: 'Photos must be HEIC, JPEG, PNG, or WebP',
          });
        }
      }

      const userId = req.session.user.user_id;
      const saved = [];

      for (const file of files) {
        const ext =
          path.extname(file.originalname).toLowerCase();

        const isHeic =
          ext === '.heic' ||
          ext === '.heif' ||
          file.mimetype === 'image/heic' ||
          file.mimetype === 'image/heif';

        let buffer = file.buffer;
        let mimeType = file.mimetype;

        // Convert HEIC/HEIF to JPEG
        if (isHeic) {
          try {
            buffer = Buffer.from(
              await convertHeic({
                buffer: file.buffer,
                format: 'JPEG',
                quality: 0.9,
              })
            );
          } catch (err) {
            console.error(err);

            return res.status(400).json({
              error: `Could not read ${file.originalname}`,
            });
          }

          mimeType = 'image/jpeg';
        }

        const fileName =
          `${userId}-${crypto.randomUUID()}` +
          imageTypes[mimeType];

        await fs.promises.writeFile(
          path.join(uploadDir, fileName),
          buffer
        );

        const photo = await db.one(
          `INSERT INTO user_photos
             (user_id, image_path, mime_type)
           VALUES ($1, $2, $3)
           RETURNING
             photo_id,
             mime_type,
             status,
             uploaded_at`,
          [userId, fileName, mimeType]
        );

        saved.push(photo);
      }

      res.status(201).json({
        photos: saved,
      });

    } catch (err) {
      console.error('Photo upload error:', err);

      res.status(500).json({
        error: 'Unable to upload photos',
      });
    }
  }
);

// *****************************************************
// Section 10: List User Photos
// *****************************************************

app.get('/photos', async (req, res) => {
  try {
    const photos = await db.any(
      `SELECT
          photo_id,
          mime_type,
          status,
          uploaded_at,
          processed_at
       FROM user_photos
       WHERE user_id = $1
       ORDER BY uploaded_at DESC`,
      [req.session.user.user_id]
    );

    res.json({ photos });

  } catch (err) {
    console.error('Photo listing error:', err);

    res.status(500).json({
      error: 'Unable to retrieve photos',
    });
  }
});

// *****************************************************
// Section 11: Retrieve User Photo
// *****************************************************

app.get('/photos/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(404).json({
      error: 'Photo not found',
    });
  }

  try {
    const photo = await db.oneOrNone(
      `SELECT image_path, mime_type
       FROM user_photos
       WHERE photo_id = $1
         AND user_id = $2`,
      [
        req.params.id,
        req.session.user.user_id,
      ]
    );

    if (!photo) {
      return res.status(404).json({
        error: 'Photo not found',
      });
    }

    res.type(photo.mime_type);

    res.sendFile(
      path.join(uploadDir, photo.image_path)
    );

  } catch (err) {
    console.error('Photo retrieval error:', err);

    res.status(500).json({
      error: 'Unable to retrieve photo',
    });
  }
});

// *****************************************************
// Section 12: Delete User Photo
// *****************************************************

app.delete('/photos/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(404).json({
      error: 'Photo not found',
    });
  }

  try {
    const photo = await db.oneOrNone(
      `DELETE FROM user_photos
       WHERE photo_id = $1
         AND user_id = $2
       RETURNING image_path`,
      [
        req.params.id,
        req.session.user.user_id,
      ]
    );

    if (!photo) {
      return res.status(404).json({
        error: 'Photo not found',
      });
    }

    await fs.promises.rm(
      path.join(uploadDir, photo.image_path),
      { force: true }
    );

    res.json({
      deleted: Number(req.params.id),
    });

  } catch (err) {
    console.error('Photo deletion error:', err);

    res.status(500).json({
      error: 'Unable to delete photo',
    });
  }
});

// *****************************************************
// Section 13: Logout
// *****************************************************

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// *****************************************************
// Section 14: Export Application
// *****************************************************

module.exports = app;
