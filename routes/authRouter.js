const express = require("express");
const authRouter = express.Router();
const path = require('path');

const authController= require('../controllers/authController');




authRouter.get('/login', authController.getLogin);
authRouter.post('/login', authController.postLogin);
authRouter.get('/signup',authController.getSignUp);
authRouter.post('/signup',authController.postSignUp);
authRouter.post('/logout', authController.postLogout);

exports.authRouter = authRouter;