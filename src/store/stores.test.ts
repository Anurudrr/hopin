import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../store/useAuthStore';
import { useBookingStore } from '../../store/useBookingStore';
import * as mocks from '../mocks/supabase';

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: mocks.mockSupabaseClient,
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should set user and session on successful initialization', async () => {
    const { result } = renderHook(() => useAuthStore());

    mocks.mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
      data: {
        session: {
          user: mocks.mockAuthUser,
          access_token: 'test-token',
        },
      },
    });

    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.user).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });

  it('should handle sign up', async () => {
    const { result } = renderHook(() => useAuthStore());

    mocks.mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
      data: { user: mocks.mockAuthUser },
      error: null,
    });

    await act(async () => {
      await result.current.signUp('test@example.com', 'password123', 'Test User');
    });

    expect(mocks.mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: { full_name: 'Test User' },
      },
    });
  });

  it('should handle sign out', async () => {
    const { result } = renderHook(() => useAuthStore());

    mocks.mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
      error: null,
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('should fetch profile after authentication', async () => {
    const { result } = renderHook(() => useAuthStore());

    mocks.mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: mocks.mockAuthUser },
    });

    mocks.mockSupabaseClient.from.mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce({
        data: [mocks.mockProfile],
        error: null,
      }),
    });

    await act(async () => {
      await result.current.fetchProfile();
    });

    expect(result.current.profile).toBeTruthy();
  });
});

describe('useBookingStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useBookingStore());
    expect(result.current.currentRequest).toEqual({ seats: 1 });
    expect(result.current.selectedRide).toBeNull();
    expect(result.current.isSearching).toBe(false);
    expect(result.current.activeRide).toBeNull();
    expect(result.current.bookingError).toBeNull();
  });

  it('should select a ride', () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.selectRide(mocks.mockRide);
    });

    expect(result.current.selectedRide).toEqual(mocks.mockRide);
  });

  it('should update seats with clamping', () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.selectRide(mocks.mockRide);
      result.current.setSeats(5);
    });

    // Should clamp to max available seats
    expect(result.current.currentRequest.seats).toBeLessThanOrEqual(
      mocks.mockRide.seats_available
    );
  });

  it('should clear booking error', () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      useBookingStore.setState({ bookingError: 'Test error' });
      result.current.clearBookingError();
    });

    expect(result.current.bookingError).toBeNull();
  });

  it('should reset booking state', () => {
    const { result } = renderHook(() => useBookingStore());

    act(() => {
      result.current.selectRide(mocks.mockRide);
      result.current.reset();
    });

    expect(result.current.selectedRide).toBeNull();
    expect(result.current.isSearching).toBe(false);
    expect(result.current.activeRide).toBeNull();
  });
});
