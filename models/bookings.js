const mongoose=require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  homeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Home",
    required: true
  },

  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  checkInDate: Date,
  checkOutDate: Date,
  numberOfNights: Number,
  numberOfGuests: Number,
  pricePerNight: Number,
  subtotal: Number,
  serviceFee: Number,
  totalPrice: Number,
  specialRequests: String,

  bookedAt: {
    type: Date,
    default: Date.now
  }
});

const Bookings = mongoose.model('Bookings', bookingSchema);

module.exports = Bookings;