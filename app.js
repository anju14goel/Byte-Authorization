const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(session({
  secret: 'your_secret_key', // Replace with a secure key
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport for GitHub
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/github/callback"
}, (accessToken, refreshToken, profile, done) => {
  // Save user profile information if needed
  return done(null, profile);
}));

// Configure Passport for Google (YouTube)
passport.use(new GoogleStrategy({
  clientID: process.env.YOUTUBE_CLIENT_ID,
  clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback",
  scope: ['https://www.googleapis.com/auth/youtube.readonly']
}, async (accessToken, refreshToken, profile, done) => {
  // Save user profile information if needed
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/subscriptions', {
      params: {
        part: 'snippet',
        mine: true,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const isSubscribed = response.data.items.some(item => item.snippet.resourceId.channelId === 'UCpDPqe2kjwb5OKJGtjcsqIw');
    done(null, { profile, isSubscribed });
  } catch (error) {
    done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the home page! <a href="/auth/github">Login with GitHub</a> <a href="/auth/google">Login with Google</a>');
});

app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.send(`You are logged in with GitHub as ${req.user.username}.`);
  }
);

app.get('/auth/google',
  passport.authenticate('google')
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    if (req.user.isSubscribed) {
      res.send('You are subscribed to B.Y.T.E. on YouTube.');
    } else {
      res.send('You are not subscribed to B.Y.T.E. on YouTube.');
    }
  }
);

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
