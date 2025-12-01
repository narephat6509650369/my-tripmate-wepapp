import type { Request, Response } from "express";
import { deleteTrip, getTripsByUserId, } from "../models/tripModel.js";
import { initializeTrip } from "../services/tripService.js";
/*
export const getTripsController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    // Assuming a function getTripsByUserId exists in tripModel.ts
    const trips = await getTripsByUserId(userId);
    res.status(200).json({ trips });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      message: "Failed to retrieve trips",
      error: message
    });
  }
}*/

export const deleteTripController = async (req: Request, res: Response) => {
  try {
    const tripId = req.params.tripId;
    const ownerId = req.params.ownerId||""; 

    if (!tripId) {
      return res.status(400).json({ message: "tripId is required" });
    }

    await deleteTrip(tripId, ownerId);

    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      message: "Failed to delete trip",
      error: message
    });
  }
}


export const addTripController = async (req: Request, res: Response) => {
  try{
    const { user_id, trip_name, description, num_days } = req.body;
    const newTrip = await initializeTrip({ user_id, trip_name, description, num_days });
    res.status(200).json({ message: "Trip added successfully", trip: newTrip });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      message: "Failed to add trip",
      error: message
    });
  }
}
export default addTripController;