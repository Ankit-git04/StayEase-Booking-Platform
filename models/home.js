const mongoose = require('mongoose');

const Bookings = require('./bookings');


const homeSchema = new mongoose.Schema({
    homeName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },  
   homeImage: {
        type: String
    },
     hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }   

}); 

homeSchema.post('findOneAndDelete', async function(doc) {
    if (!doc) return;

    const User = mongoose.model('User');
    const Bookings = mongoose.model('Bookings');

    // Remove from favourites
    await User.updateMany(
        {},
        {
            $pull: {
                favourites: doc._id
            }
        }
    );

    // Get related bookings
    const bookings = await Bookings.find({ homeId: doc._id });

    const bookingIds = bookings.map(b => b._id);

    // Remove booking ids from users
    await User.updateMany(
        {},
        {
            $pull: {
                bookings: { $in: bookingIds }
            }
        }
    );

    // Delete bookings
    await Bookings.deleteMany({ homeId: doc._id });
});

const Home = mongoose.model('Home', homeSchema);
 
 
 



module.exports = Home;








