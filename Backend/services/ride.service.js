const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const crypto = require('crypto');

// Haversine formula to compute distance in KM between lat/lng points
function getHaversineDistanceInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function getFare(pickup, destination) {
    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    let distanceInKm = 5;
    let durationInMinutes = 15;

    try {
        const distanceTime = await mapService.getDistanceTime(pickup, destination);
        if (distanceTime && distanceTime.distance && distanceTime.duration) {
            distanceInKm = distanceTime.distance.value / 1000;
            durationInMinutes = distanceTime.duration.value / 60;
        }
    } catch (err) {
        console.warn('Google Maps Distance Matrix failed, calculating dynamic coordinate fallback:', err.message);
        
        try {
            const pickupCoords = await mapService.getAddressCoordinate(pickup);
            const destinationCoords = await mapService.getAddressCoordinate(destination);

            if (pickupCoords?.ltd && destinationCoords?.ltd) {
                distanceInKm = getHaversineDistanceInKm(
                    pickupCoords.ltd,
                    pickupCoords.lng,
                    destinationCoords.ltd,
                    destinationCoords.lng
                );
                // Estimate 30 km/h average speed
                durationInMinutes = Math.max(5, Math.round((distanceInKm / 30) * 60));
            }
        } catch (coordErr) {
            console.warn('Coordinates geocoding failed, using baseline static estimates:', coordErr.message);
        }
    }

    const baseFare = {
        auto: 30,
        car: 50,
        moto: 20
    };

    const perKmRate = {
        auto: 10,
        car: 15,
        moto: 8
    };

    const perMinuteRate = {
        auto: 2,
        car: 3,
        moto: 1.5
    };

    const fare = {
        auto: Math.round(baseFare.auto + (distanceInKm * perKmRate.auto) + (durationInMinutes * perMinuteRate.auto)),
        car: Math.round(baseFare.car + (distanceInKm * perKmRate.car) + (durationInMinutes * perMinuteRate.car)),
        moto: Math.round(baseFare.moto + (distanceInKm * perKmRate.moto) + (durationInMinutes * perMinuteRate.moto))
    };

    return fare;
}

module.exports.getFare = getFare;

function getOtp(num) {
    // Generate strictly n-digit OTP (e.g. 6 digits: 100000 - 999999)
    const min = Math.pow(10, num - 1);
    const max = Math.pow(10, num) - 1;
    return crypto.randomInt(min, max).toString();
}

module.exports.createRide = async ({ user, pickup, destination, vehicleType }) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    const fare = await getFare(pickup, destination);

    const ride = await rideModel.create({
        user,
        pickup,
        destination,
        otp: getOtp(6),
        fare: fare[vehicleType]
    });

    return ride;
};

module.exports.confirmRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    await rideModel.findOneAndUpdate(
        { _id: rideId },
        {
            status: 'accepted',
            captain: captain._id
        }
    );

    const ride = await rideModel.findOne({ _id: rideId })
        .populate('user')
        .populate('captain')
        .select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    return ride;
};

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({ _id: rideId })
        .populate('user')
        .populate('captain')
        .select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    await rideModel.findOneAndUpdate(
        { _id: rideId },
        { status: 'ongoing' }
    );

    return ride;
};

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    await rideModel.findOneAndUpdate(
        { _id: rideId },
        { status: 'completed' }
    );

    return ride;
};