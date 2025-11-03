// ==========================================
// 📁 src/services/tripService.ts
// ==========================================

import api from './api';
import { Trip, TripMember } from '../types';

export interface CreateTripData {
  name: string;
  description?: string;
}

export interface UpdateTripData extends CreateTripData {
  status?: Trip['status'];
  start_date?: string;
  end_date?: string;
  budget_min?: number;
  budget_max?: number;
}

export const tripService = {
  async getAll(): Promise<Trip[]> {
    const response = await api.get<{ trips: Trip[] }>('/trips');
    return response.data.trips;
  },

  async getById(id: number): Promise<Trip> {
    const response = await api.get<{ trip: Trip }>(`/trips/${id}`);
    return response.data.trip;
  },

  async create(data: CreateTripData): Promise<Trip> {
    const response = await api.post<{ trip: Trip }>('/trips', data);
    return response.data.trip;
  },

  async update(id: number, data: UpdateTripData): Promise<Trip> {
    const response = await api.put<{ trip: Trip }>(`/trips/${id}`, data);
    return response.data.trip;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/trips/${id}`);
  },

  async getMembers(tripId: number): Promise<TripMember[]> {
    const response = await api.get<{ members: TripMember[] }>(`/trips/${tripId}/members`);
    return response.data.members;
  },

  async inviteMember(tripId: number, email: string): Promise<void> {
    await api.post(`/trips/${tripId}/members`, { email });
  },

  async removeMember(tripId: number, userId: number): Promise<void> {
    await api.delete(`/trips/${tripId}/members/${userId}`);
  },
};