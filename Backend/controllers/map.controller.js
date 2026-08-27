const mapService = require('../services/maps.service');
const { validationResult } = require('express-validator');

module.exports.getCoordinates = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { address } = req.query;

    try {
        const coordinates = await mapService.getAddressCoordinate(address);
        return res.status(200).json(coordinates);
    } catch (error) {
        console.error('getCoordinates error:', error.message || error);
        return res.status(404).json({ message: 'Coordinates not found' });
    }
};

module.exports.getDistanceTime = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { origin, destination } = req.query;
        const distanceTime = await mapService.getDistanceTime(origin, destination);

        return res.status(200).json(distanceTime);
    } catch (err) {
        console.error('getDistanceTime error:', err.message || err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports.getAutoCompleteSuggestions = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { input } = req.query;

        if (!input || input.trim().length < 3) {
            return res.status(200).json([]);
        }

        const suggestions = await mapService.getAutoCompleteSuggestions(input);
        return res.status(200).json(suggestions || []);
    } catch (err) {
        // Log detailed error for debugging, but return empty array to prevent client crashes
        console.error('getAutoCompleteSuggestions backend error:', err.response?.data || err.message || err);
        return res.status(200).json([]);
    }
};