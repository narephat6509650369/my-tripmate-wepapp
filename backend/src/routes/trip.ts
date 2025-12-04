import express from 'express';
import { addTripController, getMyTrips, getTripDetail, deleteTripController} from "../controllers/TripController.js";


const router = express.Router();

router.post('/AddTrip', addTripController);
router.get('/GetTrip', (req, res) => {
    // Implementation for getting trips
    res.status(200).json({ message: "Trips retrieved successfully" });
});
router.put('/UpdateTrip', (req, res) => {
    // Implementation for updating a trip
    res.status(200).json({ message: "Trip updated successfully" });
});
router.delete('/DeleteTrip', deleteTripController);

router.get("/my-trips", getMyTrips);

router.get("/:tripId", getTripDetail);

export default router;