const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  dateTime: {
    type: Date,
    required: [true, 'Please add an appointment date and time']
  },
  duration: {
    type: Number,
    required: [true, 'Please add duration in minutes'],
    min: [15, 'Duration must be at least 15 minutes']
  },
  reason: {
    type: String,
    required: [true, 'Please add a reason for the appointment']
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate appointments for the same doctor at the same time
appointmentSchema.index({ doctor: 1, dateTime: 1 }, { unique: true });

// Prevent patients from booking multiple appointments at the same time
appointmentSchema.index({ patient: 1, dateTime: 1 }, { unique: true });

// Check if appointment date is in the future
appointmentSchema.path('dateTime').validate(function(value) {
  return value > Date.now();
}, 'Appointment date must be in the future');

module.exports = mongoose.model('Appointment', appointmentSchema);