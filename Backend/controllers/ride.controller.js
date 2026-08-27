const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');

module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: "User authentication failed or session expired." });
    }

    const { pickup, destination, vehicleType } = req.body;

    try {
        const ride = await rideService.createRide({ 
            user: req.user._id, 
            pickup, 
            destination, 
            vehicleType 
        });
        
        // Return initial response to rider immediately
        res.status(201).json(ride);

        // Async dispatch socket notification to captains
        try {
            const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
            
            // Expanded radius search for development/testing (e.g., 50 km)
            const captainsInRadius = await mapService.getCaptainsInTheRadius(
                pickupCoordinates.ltd, 
                pickupCoordinates.lng, 
                50
            );

            const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');
            
            if (rideWithUser) {
                const rideDataForCaptain = rideWithUser.toObject();
                rideDataForCaptain.otp = ""; // Hide OTP for captain proposal

                captainsInRadius.forEach(captain => {
                    // Match vehicle type if captain profile contains vehicleType
                    if (captain.socketId && (!captain.vehicle || captain.vehicle.vehicleType === vehicleType)) {
                        sendMessageToSocketId(captain.socketId, {
                            event: 'new-ride',
                            data: rideDataForCaptain
                        });
                    }
                });
            }
        } catch (socketErr) {
            console.error("Captain Socket Broadcast Error:", socketErr.message);
        }

    } catch (err) {
        console.error("Create Ride Error:", err);
        if (!res.headersSent) {
            return res.status(500).json({ message: err.message });
        }
    }
};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;

    try {
        const fare = await rideService.getFare(pickup, destination);
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });

        if (ride?.user?.socketId) {
            sendMessageToSocketId(ride.user.socketId, {
                event: 'ride-confirmed',
                data: ride
            });
        }

        return res.status(200).json(ride);
    } catch (err) {
        console.error("Confirm Ride Error:", err);
        return res.status(500).json({ message: err.message });
    }
};

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        if (ride?.user?.socketId) {
            sendMessageToSocketId(ride.user.socketId, {
                event: 'ride-started',
                data: ride
            });
        }

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        if (ride?.user?.socketId) {
            sendMessageToSocketId(ride.user.socketId, {
                event: 'ride-ended',
                data: ride
            });
        }

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};