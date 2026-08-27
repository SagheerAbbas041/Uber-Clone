const axios = require('axios');
const captainModel = require('../models/captain.model');

// Helper to reliably retrieve Google Maps API key
const getApiKey = () => process.env.GOOGLE_MAPS_API || process.env.GOOGLE_MAPS_API_KEY;

module.exports.getAddressCoordinate = async (address) => {
    if (!address) {
        throw new Error('Address is required');
    }

    const apiKey = getApiKey();
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            return {
                ltd: location.lat,
                lng: location.lng
            };
        } else {
            throw new Error(`Unable to fetch coordinates: ${response.data.status}`);
        }
    } catch (error) {
        console.error('getAddressCoordinate Error:', error.message);
        throw error;
    }
};

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const apiKey = getApiKey();
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);

        if (response.data.status === 'OK') {
            const element = response.data.rows[0]?.elements[0];

            if (!element || element.status === 'ZERO_RESULTS' || element.status === 'NOT_FOUND') {
                throw new Error('No routes found between origin and destination');
            }

            if (element.status !== 'OK') {
                throw new Error(`Distance Matrix Element Error: ${element.status}`);
            }

            return element;
        } else {
            throw new Error(`Distance Matrix API Error: ${response.data.status}`);
        }
    } catch (err) {
        console.error('getDistanceTime Error:', err.message);
        throw err;
    }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('Query input is required');
    }

    const apiKey = getApiKey();
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            return response.data.predictions
                .map(prediction => prediction.description)
                .filter(Boolean);
        } else if (response.data.status === 'ZERO_RESULTS') {
            return [];
        } else {
            throw new Error(`Autocomplete API Error: ${response.data.status}`);
        }
    } catch (err) {
        console.error('getAutoCompleteSuggestions Error:', err.message);
        throw err;
    }
};

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
    // 1 Degree Latitude/Longitude is approx 111 km.
    // Range boundary math to find captains with ltd & lng stored in db without index crash
    const radiusInDegrees = radius / 111;

    const captains = await captainModel.find({
        'location.ltd': {
            $gte: ltd - radiusInDegrees,
            $lte: ltd + radiusInDegrees
        },
        'location.lng': {
            $gte: lng - radiusInDegrees,
            $lte: lng + radiusInDegrees
        }
    });

    return captains;
};