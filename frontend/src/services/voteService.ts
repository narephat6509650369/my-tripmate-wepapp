// ==========================================
// 📁 src/services/voteService.ts
// ==========================================

import api from './api';
import { VoteCategory, VoteOption } from '../types';

export const voteService = {
  async getCategories(tripId: number): Promise<VoteCategory[]> {
    const response = await api.get<{ categories: VoteCategory[] }>(`/trips/${tripId}/votes`);
    return response.data.categories;
  },

  async createCategory(tripId: number, data: {
    category: VoteCategory['category'];
    title: string;
    description?: string;
  }): Promise<VoteCategory> {
    const response = await api.post<{ category: VoteCategory }>(`/trips/${tripId}/votes`, data);
    return response.data.category;
  },

  async addOption(categoryId: number, optionText: string): Promise<VoteOption> {
    const response = await api.post<{ option: VoteOption }>(`/votes/${categoryId}/options`, {
      option_text: optionText,
    });
    return response.data.option;
  },

  async castVote(optionId: number): Promise<void> {
    await api.post(`/options/${optionId}/vote`);
  },

  async removeVote(optionId: number): Promise<void> {
    await api.delete(`/options/${optionId}/vote`);
  },

  async getResults(categoryId: number): Promise<VoteOption[]> {
    const response = await api.get<{ results: VoteOption[] }>(`/votes/${categoryId}/results`);
    return response.data.results;
  },
};