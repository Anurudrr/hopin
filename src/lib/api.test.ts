import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAvailableRides,
  bookRide,
  cancelBooking,
  submitContactMessage,
} from '../../lib/api';
import * as mocks from '../mocks/supabase';

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: mocks.mockSupabaseClient,
}));

describe('API Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableRides', () => {
    it('should return empty array for empty city', async () => {
      const result = await getAvailableRides('');
      expect(result).toEqual([]);
    });

    it('should fetch rides for a city', async () => {
      const mockRides = [mocks.mockRide];

      mocks.mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockRides,
          error: null,
        }),
      });

      const result = await getAvailableRides('Bangalore');
      expect(result).toEqual(mockRides);
    });

    it('should throw error on database error', async () => {
      const error = new Error('Database error');

      mocks.mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: null,
          error,
        }),
      });

      await expect(getAvailableRides('Bangalore')).rejects.toThrow();
    });
  });

  describe('bookRide', () => {
    it('should create a booking', async () => {
      mocks.mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mocks.mockAuthUser },
      });

      mocks.mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: mocks.mockBooking.id,
        error: null,
      });

      mocks.mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({
          data: [mocks.mockBooking],
          error: null,
        }),
        single: vi.fn(),
      });

      const result = await bookRide(
        mocks.mockRide.id,
        2,
        'Home',
        12.9716,
        77.5946,
        'Office',
        12.972,
        77.605
      );

      expect(result).toBeTruthy();
    });

    it('should throw error if not authenticated', async () => {
      mocks.mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
      });

      await expect(
        bookRide('ride-id', 2, 'Home', 0, 0, 'Office', 0, 0)
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', async () => {
      mocks.mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mocks.mockAuthUser },
      });

      mocks.mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(
        cancelBooking(mocks.mockBooking.id)
      ).resolves.toBeUndefined();
    });

    it('should throw error if not authenticated', async () => {
      mocks.mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
      });

      await expect(cancelBooking('booking-id')).rejects.toThrow(
        'Not authenticated'
      );
    });
  });

  describe('submitContactMessage', () => {
    it('should submit contact message', async () => {
      mocks.mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
      });

      await expect(
        submitContactMessage({
          name: 'Test',
          email: 'test@example.com',
          topic: 'Support',
          message: 'Help needed',
          requestedRole: 'driver',
          requestedCity: 'Bangalore',
        })
      ).resolves.toBeUndefined();
    });

    it('should handle duplicate email gracefully', async () => {
      const duplicateError = new Error('Duplicate');
      (duplicateError as any).code = '23505';

      mocks.mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValueOnce({
          data: null,
          error: duplicateError,
        }),
      });

      await expect(
        submitContactMessage({
          name: 'Test',
          email: 'test@example.com',
          topic: 'Support',
          message: 'Help needed',
        })
      ).rejects.toThrow();
    });
  });
});
