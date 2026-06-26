const express= require('express');
const hostRouter = express.Router(); 
const path = require('path'); 
const rootDir = require('../utils/pathutils'); 

const hostController= require('../controllers/hostController');

hostRouter.get('/', hostController.getHostHome);

hostRouter.get('/add-home',  hostController.getAddHome);
hostRouter.post('/add-home', hostController.postAddHome);
hostRouter.get('/bookings', hostController.getHostBookings);
hostRouter.get('/edit-home/:_id', hostController.getEditHome);
hostRouter.post('/edit-home/:_id', hostController.postEditHome);
hostRouter.post('/delete-home/:_id', hostController.postDeleteHome);

exports.hostRouter = hostRouter;
