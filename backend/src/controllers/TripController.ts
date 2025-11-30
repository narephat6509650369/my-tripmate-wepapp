import type { Request, Response } from "express";

export const addTripController = (req: Request, res: Response) => {
  // Implementation for adding a trip
  res.status(201).json({ message: "Trip added successfully" });
}