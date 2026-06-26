
const Home = require('../models/home');
const Bookings = require('../models/bookings');
const User = require('../models/User');
const Fuse = require('fuse.js');


exports.getHome=(req, res, next) => {
    Home.find().then((homes) => {
        res.render('store/home-list', { registeredHomes: homes, pageTitle: 'Home List', isLoggedIn: req.isLoggedIn,user: req.user });
    }).catch(err => {
        console.error('Error fetching homes:', err);      
    }); 
};

exports.getHomeDetails=(req, res, next) => {
    const _id = req.params._id;
    Home.findById(_id).then((home) => {
        if (!home) {
            return res.status(404).render('404', { pageTitle: 'Home Not Found', isLoggedIn: req.isLoggedIn });
        }
        res.render('store/homeDetails', { home: home, pageTitle: 'Home Details', isLoggedIn: req.isLoggedIn });
    }).catch(err => {
        console.error('Error fetching home details:', err);
        res.status(500).render('500', { pageTitle: 'Internal Server Error', isLoggedIn: req.isLoggedIn });
    });
};

exports.getBookingForm = (req, res, next) => {
    const _id = req.params._id;
    Home.findById(_id).then((home) => {
       
        if (!home) {
            return res.status(404).render('404', { pageTitle: 'Home Not Found', isLoggedIn: req.isLoggedIn });
        }
        res.render('store/bookingform', { home: home, pageTitle: 'Book ' + home.homeName, isLoggedIn: req.isLoggedIn });
    }).catch(err => {
        console.error('Error fetching home for booking:', err);
        res.status(500).render('500', { pageTitle: 'Internal Server Error', isLoggedIn: req.isLoggedIn });
    });
};

exports.getBookings = (req, res, next) => {
  const user = req.user;

  User.findById(user._id)
    .populate({
      path: 'bookings',
      populate: {
        path: 'homeId'
      }
    })
    .then((user) => {
      res.render('store/bookings', {
        bookings: user.bookings,
        pageTitle: 'Bookings',
        isLoggedIn: req.isLoggedIn
      });
    })
    .catch(err => {
      console.error(err);
    });
};




exports.postBookings = async (req, res, next) => {
    try {
        const homeId = req.params._id;
        const user = req.user;

        const { checkInDate, checkOutDate, numberOfPeople, specialRequests } = req.body;

        if (!user) return res.status(401).send('Unauthorized');

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        if (checkOut <= checkIn) {
            return res.status(400).send('Invalid dates');
        }

        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        const home = await Home.findById(homeId).populate('hostId');
        if (!home) return res.status(404).send('Home not found');

        // Check if selected dates overlap an existing booking
            const conflictingBooking = await Bookings.findOne({
                homeId: home._id,
                checkInDate: { $lt: checkOut },
                checkOutDate: { $gt: checkIn }
            });
        
            if (conflictingBooking) {

               req.session.message = 'already-booked';

             return res.redirect(req.get('referer') || '/');
              
            }

        const guests = parseInt(numberOfPeople) || 1;

        let pricePerNight = home.price;
        if (guests > 1) {
            pricePerNight = home.price + (home.price * 0.15 * (guests - 1));
        }

        const subtotal = nights * pricePerNight;
        const serviceFee = subtotal * 0.10;
        const totalPrice = subtotal + serviceFee;

        // ✅ CREATE BOOKING IN DATABASE
        const booking = await Bookings.create({
            userId: user._id,
            homeId: home._id,
            hostId: home.hostId,   // 👈 IMPORTANT (so host can see bookings)

            checkInDate,
            checkOutDate,
            numberOfNights: nights,
            numberOfGuests: guests,

            pricePerNight,
            subtotal,
            serviceFee,
            totalPrice,

            specialRequests: specialRequests || ''
        });

        // optional: store reference in user (lightweight)
        await User.findByIdAndUpdate(user._id, {
            $push: { bookings: booking._id }
        });

        res.redirect('/bookings');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

exports.getFavourites = (req, res, next) => {
    User.findById(req.user._id)
        .populate('favourites')
        .then((user) => {
            res.render('store/favourites', {
                favouriteHomes: user.favourites,
                pageTitle: 'Favourites', 
                isLoggedIn: req.isLoggedIn
            });
        })
        .catch(err => {
            console.error('Error fetching favourite homes:', err);
            res.status(500).render('500', {
                pageTitle: 'Internal Server Error'
                , isLoggedIn: req.isLoggedIn
            });
        });
};

exports.AddToFavourites = (req, res, next) => {
    const _id = req.params._id;
    const user=req.user;
    if (!user) {
        return res.status(401).render('401', { pageTitle: 'Unauthorized', isLoggedIn: req.isLoggedIn });
    }
        if (user.favourites.includes(_id)) {
            
         req.session.message = 'already-favourite';

             return res.redirect(req.get('referer') || '/');
              
        }

    
    user.favourites.push(_id);
    user.save().then(() => {
        res.redirect('/favourites');
    }).catch(err => {
        console.error('Error adding to favourites:', err);
        res.status(500).render('500', { pageTitle: 'Internal Server Error', isLoggedIn: req.isLoggedIn });
    });
    
};
    
    

exports.RemoveFromFavourites=(req, res, next) => {
    const _id = req.params._id;
    const user=req.user;
    if (!user) {
        return res.status(401).render('401', { pageTitle: 'Unauthorized', isLoggedIn: req.isLoggedIn });
    }
    user.favourites.pull(_id);
    user.save().then(() => {
        res.redirect('/favourites');
    }).catch(err => {
        console.error('Error removing from favourites:', err);
        res.status(500).render('500', { pageTitle: 'Internal Server Error', isLoggedIn: req.isLoggedIn });
    });
};   

 exports.getSearchResults = async (req, res, next) => {
  try {
    const requiredLocation = req.query.requiredLocation?.trim() || '';

    let homes = await Home.find({
      location: {
        $regex: requiredLocation,
        $options: 'i'
      }
    });

    let displayLocation = requiredLocation;

    if (homes.length === 0 && requiredLocation) {

      const allHomes = await Home.find().lean();

      const fuse = new Fuse(allHomes, {
        keys: ['location'],
        threshold: 0.3
      });

      const results = fuse.search(requiredLocation);

      homes = results.map(result => result.item);

      
    }
    if (homes.length > 0) {
        displayLocation = homes[0].location;
      }
 
    res.render('store/search-results', {
      homes,
      requiredLocation,
      displayLocation,
      pageTitle: 'Search Results',
      isLoggedIn: req.isLoggedIn,
      user: req.user
    });

  } catch (err) {
    console.error('Error fetching search results:', err);

    res.status(500).render('500', {
      pageTitle: 'Internal Server Error',
      isLoggedIn: req.isLoggedIn
    });
  }
};