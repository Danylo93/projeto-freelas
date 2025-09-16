import React from 'react';
import { act, render } from '@testing-library/react-native';
import Index from '@/app/index';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/app/auth/index', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'auth-screen' }, 'Auth Screen');
});

jest.mock('@/app/provider/index', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'provider-home' }, 'Provider Home');
});

jest.mock('@/app/client/index', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'client-home' }, 'Client Home');
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Index screen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUseAuth.mockReset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows splash while authentication is loading', () => {
    mockUseAuth.mockReturnValue({ isLoading: true, isAuthenticated: false, user: null } as any);

    const { getByText } = render(<Index />);

    expect(getByText('ServiçoApp')).toBeTruthy();
  });

  it('renders auth flow when the user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: false, user: null } as any);

    const { getByTestId } = render(<Index />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(getByTestId('auth-screen')).toBeTruthy();
  });

  it('renders provider home after the splash animation', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: '1', name: 'Provider', user_type: 1 },
    } as any);

    const { getByTestId } = render(<Index />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(getByTestId('provider-home')).toBeTruthy();
  });
});
