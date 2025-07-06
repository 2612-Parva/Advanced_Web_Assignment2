const Appointment = require('../models/Appointment');
const ErrorResponse = require('../utils/errorResponse');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  let query;

  if (req.user.role === 'patient') {
    query = Appointment.find({ patient: req.user.id }).populate({
      path: 'doctor',
      select: 'name email'
    });
  } else if (req.user.role === 'doctor') {
    query = Appointment.find({ doctor: req.user.id }).populate({
      path: 'patient',
      select: 'name email'
    });
  } else {
    // Admin can see all appointments
    query = Appointment.find().populate([
      { path: 'patient', select: 'name email' },
      { path: 'doctor', select: 'name email' }
    ]);
  }

  try {
    const appointments = await query;

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate([
      { path: 'patient', select: 'name email' },
      { path: 'doctor', select: 'name email' }
    ]);

    if (!appointment) {
      return next(
        new ErrorResponse(`No appointment with the id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is appointment owner or admin
    if (
      appointment.patient._id.toString() !== req.user.id &&
      appointment.doctor._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to access this appointment`,
          401
        )
      );
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add appointment
// @route   POST /api/appointments
// @access  Private
exports.addAppointment = async (req, res, next) => {
  // Add user to req.body
  req.body.patient = req.user.id;

  try {
    // Check if doctor exists and is a doctor
    const doctor = await User.findById(req.body.doctor);
    if (!doctor || doctor.role !== 'doctor') {
      return next(
        new ErrorResponse(`No doctor with the id of ${req.body.doctor}`, 404)
      );
    }

    // Check for existing appointment at the same time
    const existingAppointment = await Appointment.findOne({
      $or: [
        { doctor: req.body.doctor, dateTime: req.body.dateTime },
        { patient: req.user.id, dateTime: req.body.dateTime }
      ]
    });

    if (existingAppointment) {
      return next(
        new ErrorResponse(
          'There is already an appointment scheduled at this time',
          400
        )
      );
    }

    const appointment = await Appointment.create(req.body);

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res, next) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return next(
        new ErrorResponse(`No appointment with the id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is appointment owner or admin
    if (
      appointment.patient.toString() !== req.user.id &&
      appointment.doctor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this appointment`,
          401
        )
      );
    }

    // Check for time conflicts if dateTime is being updated
    if (req.body.dateTime) {
      const existingAppointment = await Appointment.findOne({
        $or: [
          { doctor: appointment.doctor, dateTime: req.body.dateTime },
          { patient: appointment.patient, dateTime: req.body.dateTime }
        ],
        _id: { $ne: req.params.id }
      });

      if (existingAppointment) {
        return next(
          new ErrorResponse(
            'There is already an appointment scheduled at this time',
            400
          )
        );
      }
    }

    appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return next(
        new ErrorResponse(`No appointment with the id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is appointment owner or admin
    if (
      appointment.patient.toString() !== req.user.id &&
      appointment.doctor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this appointment`,
          401
        )
      );
    }

    await appointment.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};