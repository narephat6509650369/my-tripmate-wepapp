import {  initializeTrip } from "../models/tripModel.js";

export const tripService = {
  addTrip: async (userId: string,trip_name: string, description?: string | null, num_days?: number) => {
    const response = await fetch('/api/trips/AddTrip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(await initializeTrip({ trip_id: userId, trip_name, description: description || null, num_days: num_days || 1 })),
    });
    return response.json();
  },
};  

export default tripService