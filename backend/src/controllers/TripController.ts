import type { Request, Response } from "express";
import { initializeTrip,fetchMyTrips,fetchTripDetail,joinTripServiceByCode, joinTripServiceByLink, removeMemberService, deleteTripService} from "../services/tripService.js";
import type { JwtPayload } from "../express.d.js"

export const addTripController = async (req: Request, res: Response) => {
  try{
    const { trip_name, description, num_days } = req.body;
    const user_id = (req.user as JwtPayload).user_id;
    if (!trip_name || typeof trip_name !== 'string' || trip_name.trim() === '') {
      return res.status(400).json({ message: "Trip name is required and must be a string." });
    }
    if (!num_days || typeof num_days !== 'number' || num_days < 1) {
      return res.status(400).json({ message: "Number of days must be a number greater than 0." });
    }
    const newTrip = await initializeTrip( user_id, trip_name, description, num_days );
    res.status(201).json({ message: "Trip added successfully", trip: newTrip });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      message: "Failed to add trip",
      error: message
    });
  }
}

export const getMyTrips = async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as JwtPayload).user_id;

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

/*
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
*/
export const deleteTripController = async (req: Request, res: Response) => {
  try {
    const tripId = req.params.tripId;
    const ownerId = req.params.ownerId||""; 

    if (!tripId) {
      return res.status(400).json({ message: "tripId is required" });
    }

    await deleteTripService(tripId, ownerId);

    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      message: "Failed to delete trip",
      error: message
    });
  }
}

export const joinTripByCode = async (req: Request, res: Response) => {
  try {
    const { invite_code } = req.body;
    const {user_id} = req.body;

    if (!invite_code) {
      return res.status(400).json({ error: "invite code is required" });
    }
    if (!user_id) {
      return res.status(400).json({ error: "user id is required" });
    }

    const result = await joinTripServiceByCode(invite_code, user_id!);

    return res.status(200).json({
      success: true,
      message: "Joined trip successfully",
      data: result,
    });

  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const joinTripByLink = async (req: Request, res: Response) => {
  try {
    const { trip_id } = req.params;
    const user_id = req.body;

     if (!trip_id) {
      return res.status(400).json({ error: "trip id is required" });
    }
    if (!user_id) {
      return res.status(400).json({ error: "user id is required" });
    }
    
    const result = await joinTripServiceByLink(trip_id, user_id!);

    return res.status(200).json({
      success: true,
      message: "Joined trip successfully",
      data: result,
    });

  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const removeMemberController = async (req: Request, res: Response) => {
  try {
    const { trip_id, member_id } = req.params;
    const owner_id = req.body.owner_id;

    if (!trip_id || !member_id) {
      return res.status(400).json({ message: "tripId and memberId are required" });
    }
    if(!owner_id){
      return res.status(400).json({ message: "OwnerId are required" });
    }

    const result = await removeMemberService({ trip_id, member_id, owner_id });

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    return res.status(200).json({ message: "Member removed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

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

export default {addTripController, deleteTripController, getMyTrips, joinTripByCode, joinTripByLink};