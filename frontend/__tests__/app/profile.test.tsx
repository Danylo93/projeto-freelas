import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ProfileScreen from '@/app/profile/index';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '(11) 98888-7777',
        user_type: 2,
      },
      logout: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays the current profile information', () => {
    const { getByText } = render(<ProfileScreen onBack={jest.fn()} />);

    expect(getByText('Maria Silva')).toBeTruthy();
    expect(getByText('maria@example.com')).toBeTruthy();
    expect(getByText('(11) 98888-7777')).toBeTruthy();
  });

  it('allows toggling edit mode', () => {
    const { getByTestId, getByPlaceholderText, queryByPlaceholderText } = render(
      <ProfileScreen onBack={jest.fn()} />
    );

    expect(queryByPlaceholderText('Seu nome completo')).toBeNull();

    fireEvent.press(getByTestId('toggle-edit-button'));

    expect(getByPlaceholderText('Seu nome completo')).toBeTruthy();
    expect(getByTestId('save-profile-button')).toBeEnabled();

    fireEvent.press(getByTestId('cancel-edit-button'));

    expect(queryByPlaceholderText('Seu nome completo')).toBeNull();
  });
});
