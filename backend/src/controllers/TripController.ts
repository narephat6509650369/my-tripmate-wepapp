import type { Request, Response } from "express";
import { deleteTrip } from "../models/tripModel.js";
import { initializeTrip,fetchMyTrips,fetchTripDetail } from "../services/tripService.js";

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

export async function getMyTrips(req: Request, res: Response) {
    try {
        const {user_id} = req.body;

        if (!user_id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const trips = await fetchMyTrips(user_id);

        return res.status(200).json({
            success: true,
            data: trips
        });

    } catch (error) {
        console.error("getMyTrips error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

export async function getTripDetail(req: Request, res: Response) {
    try {
        const { trip_Id } = req.params;

        if (!trip_Id) {
            return res.status(400).json({ message: "tripId is required" });
        }

        const tripDetail = await fetchTripDetail(trip_Id);

        if (!tripDetail) {
            return res.status(404).json({ message: "Trip not found" });
        }

        return res.status(200).json({
            success: true,
            data: tripDetail
        });

    } catch (error) {
        console.error("getTripDetail error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

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

/*
export const updateTripController = async (req: Request, res: Response) => {
  try {
    const { trip_id, trip_name, description, num_days } = req.body; 
    if (!trip_id) {
      return res.status(400).json({ message: "trip_id is required" });
    }
    // Assuming a function updateTrip exists in tripModel.ts
    await updateTrip(trip_id, trip_name, description, num_days);
    res.status(200).json({ message: "Trip updated successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      message: "Failed to update trip",
      error: message
    });
  }
};
*/

export default {addTripController, deleteTripController, getMyTrips, getTripDetail};