const {registeredHomes} = require('../models/home');
const Home = require('../models/home');
const fs = require('fs');
const path = require('path');
const Bookings = require('../models/bookings');


exports.getAddHome=(req, res, next) => {
    

  res.render('host/AddHome', { pageTitle: 'Add Home' , isLoggedIn: req.isLoggedIn});
};


exports.getHostHome = (req, res, next) => {
  const hostId = req.user._id;

  Home.find({ hostId: hostId })
    .then((homes) => {
      res.render('host/host-home-list', {
        registeredHomes: homes,
        pageTitle: 'Host Home List',
        isLoggedIn: req.isLoggedIn
      });
    })
    .catch((err) => {
      console.error('Error fetching host homes:', err);
      res.status(500).render('500', {
        pageTitle: 'Internal Server Error',
        isLoggedIn: req.isLoggedIn
      });
    });
};


exports.getHostBookings = async (req, res, next) => {
    try {
        const bookings = await Bookings.find({
            hostId: req.user._id
        })
        .populate('homeId')
        .populate('userId');

        res.render('host/hostBookings', {
            bookings,
            pageTitle: 'Host Bookings',
            isLoggedIn: req.isLoggedIn
        });
    } catch (err) {
        console.error(err);

        res.status(500).render('500', {
            pageTitle: 'Internal Server Error',
            isLoggedIn: req.isLoggedIn
        });
    }
};



  
exports.getEditHome=(req, res, next) => {
  const _id = req.params._id;

  Home.findById(_id).then((home) => {
    if (!home) {
        return res.status(404).render('404', { pageTitle: 'Home Not Found' });
    } 
    res.render('host/EditHome', { home: home, pageTitle: 'Edit Home', isLoggedIn: req.isLoggedIn });
  }).catch(err => {
    console.error('Error fetching home details:', err);
    res.status(500).render('500', { pageTitle: 'Internal Server Error' });
  });
};

exports.postEditHome = async (req, res, next) => {
  try {
    const _id = req.params._id;

    const updateData = {
      homeName: req.body.homeName,
      location: req.body.location,
      price: req.body.price
    };
   const home = await Home.findById(_id);

if (req.file) {
  const oldImagePath = path.join(
    __dirname,
    '..',
    'public',
    home.homeImage.replace(/^\//, '')
  );

  fs.unlink(oldImagePath, err => {
    if (err) {
      console.error(err);
    }
  });

  updateData.homeImage = '/uploads/' + req.file.filename;
}

    await Home.findByIdAndUpdate(_id, updateData);

    res.redirect('/host');
  } catch (err) {
    console.error('Error updating home:', err);
    res.status(500).render('500', {
      pageTitle: 'Internal Server Error'
    });
  }
};

exports.postDeleteHome = (req, res, next) => {
  const _id = req.params._id;

  Home.findByIdAndDelete(_id)
    .then(deletedHome => {
      if (!deletedHome) {
        return res.status(404).send('Home not found');
      }

      const oldImagePath = path.join(
        __dirname,
        '..',
        'public',
        deletedHome.homeImage
      );

      fs.unlink(oldImagePath, err => {
        if (err) {
          console.error('Error deleting image:', err);
        } else {
          console.log('Image deleted successfully');
        }
      });

      res.redirect('/host');
    })
    .catch(err => {
      console.error('Error deleting home:', err);
      res.status(500).render('500', {
        pageTitle: 'Internal Server Error',
        isLoggedIn: req.isLoggedIn
      });
    });
};





  // This will store the registered homes in memory
exports.postAddHome=(req, res, next) => {
  // Here you would normally handle the form data and save it to a database
   

      if (!req.file) {
        res.status(422).send('Image upload failed. Please try again.');
        return; 
      }

    const { homeName, location, price } = req.body;
  const homeImage = '/uploads/' + req.file.filename;
  const hostId = req.user._id; 


  
  const newHome = new Home( { homeName, location, price,homeImage ,hostId} );
  newHome.save().then(() => {
   
    res.render('host/HomeAdded', { pageTitle: 'Home Added', isLoggedIn: req.isLoggedIn }); 
  }).catch(err => {
    console.error('Error saving home:', err);
    res.status(500).render('500', { pageTitle: 'Internal Server Error', isLoggedIn: req.isLoggedIn });
  });

  
}
