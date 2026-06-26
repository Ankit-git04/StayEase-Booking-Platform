
require('dotenv').config();

const express = require("express");
const path = require('path');
const session=require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();



const multer = require('multer');
const {storeRouter} = require('./routes/storeRouter');
const {hostRouter} = require('./routes/hostRouter');
const {authRouter}= require('./routes/authRouter');
const rootDir = require('./utils/pathutils');
const {mongoClient} = require('./utils/database');
const User = require('./models/User');

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

app.use(express.static(path.join(rootDir, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(multer({ storage, fileFilter}).single('homeImage')); // For handling file uploads



app.set('view engine', 'ejs');
app.set('views', 'views');

const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: 'sessions'
});

app.use(session({
  secret:process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,

  store: store
}));

app.use((req, res, next) => {
    if (!req.session.userId) {
        return next();
    }

    User.findById(req.session.userId)
        .then(user => {
            req.user = user;
            res.locals.user = user || null;
           
            next();
        })
        .catch(err => console.log(err));
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
    res.locals.message = req.session.message || null;

    delete req.session.message;

    next();
});

app.use((req,res,next)=>{

  req.isLoggedIn = req.session.isLoggedIn || false;
  res.locals.isLoggedIn = req.isLoggedIn;
  res.locals.user = req.user || null;
  console.log('isLoggedIn:', req.isLoggedIn);
  next();
});

app.use('/host', (req, res, next) => {
    if (!req.isLoggedIn) {
        return res.redirect('/auth/login');
    }

    if (!req.user || req.user.userType !== 'host') {
        return res.redirect('/');
    }

    next();
});

app.use( storeRouter);
app.use('/auth',authRouter);
app.use('/host', hostRouter);


app.use((req, res, next) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found' });
});

// Sample data for listings and bookings  




const port = 3000;

mongoClient(()=>{
  
  app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
})


