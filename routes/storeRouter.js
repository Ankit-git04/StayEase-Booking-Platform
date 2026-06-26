const express = require("express");
const storeRouter = express.Router();
const path = require('path');

const homesController= require('../controllers/storeController');


const isAuth = (req, res, next) => {
    if (req.isLoggedIn) {
        return next();
    }
    res.redirect('/auth/login');
};


storeRouter.get('/', homesController.getHome);

storeRouter.get('/Homedetails/:_id',isAuth, homesController.getHomeDetails);

storeRouter.get('/bookings/form/:_id',isAuth, homesController.getBookingForm);
storeRouter.get('/bookings',isAuth,homesController.getBookings);
storeRouter.post('/bookings/:_id',isAuth,homesController.postBookings);
storeRouter.get('/favourites',isAuth,homesController.getFavourites);
storeRouter.post('/favourites/:_id',isAuth, homesController.AddToFavourites);
storeRouter.post('/favourites/delete/:_id',isAuth, homesController.RemoveFromFavourites);
storeRouter.get('/search', homesController.getSearchResults);

exports.storeRouter = storeRouter;