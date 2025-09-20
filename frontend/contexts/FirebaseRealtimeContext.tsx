import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ref, onValue, off, push, set, update, remove, onDisconnect } from 'firebase/database';
import { database } from '../utils/firebase';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

interface RealtimeContextType {
  isConnected: boolean;
  sendMessage: (event: string, data: any) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  subscribeToRequest: (requestId: string, callback: (data: any) => void) => () => void;
  subscribeToProviderLocation: (providerId: string, callback: (data: any) => void) => () => void;
  subscribeToOffers: (providerId: string, callback: (data: any) => void) => () => void;
  updateRequestStatus: (requestId: string, status: string, data?: any) => Promise<void>;
  updateProviderLocation: (providerId: string, location: { lat: number; lng: number; heading?: number }) => Promise<void>;
  createOffer: (providerId: string, requestId: string, offerData: any) => Promise<void>;
  acceptOffer: (providerId: string, requestId: string) => Promise<void>;
  rejectOffer: (providerId: string, requestId: string) => Promise<void>;
}

const FirebaseRealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useFirebaseRealtime = () => {
  const context = useContext(FirebaseRealtimeContext);
  if (!context) {
    throw new Error('useFirebaseRealtime must be used within a FirebaseRealtimeProvider');
  }
  return context;
};

export const FirebaseRealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();
  const listenersRef = useRef<Map<string, () => void>>(new Map());
  const roomsRef = useRef<Set<string>>(new Set());

  // Monitor connection status
  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val();
      setIsConnected(connected);
      console.log('🔥 [FIREBASE] Connection status:', connected ? 'connected' : 'disconnected');
    });

    return () => {
      off(connectedRef, 'value', unsubscribe);
    };
  }, []);

  // Handle user presence
  useEffect(() => {
    if (!user || !isConnected) return;

    const userRef = ref(database, `users/${user.id}`);
    const userStatusRef = ref(database, `users/${user.id}/status`);
    const userLocationRef = ref(database, `users/${user.id}/location`);

    // Set user online
    set(userStatusRef, 'online');
    
    // Set user offline when disconnected
    onDisconnect(userStatusRef).set('offline');
    onDisconnect(userLocationRef).remove();

    return () => {
      // Cleanup on unmount
      set(userStatusRef, 'offline');
    };
  }, [user, isConnected]);

  const sendMessage = (event: string, data: any) => {
    if (!user) return;

    const messageRef = ref(database, `messages/${Date.now()}`);
    set(messageRef, {
      type: event,
      data,
      userId: user.id,
      userType: user.user_type,
      timestamp: Date.now()
    });
  };

  const joinRoom = (roomId: string) => {
    if (!user) return;

    const roomRef = ref(database, `rooms/${roomId}/members/${user.id}`);
    set(roomRef, {
      userId: user.id,
      userType: user.user_type,
      joinedAt: Date.now()
    });
    roomsRef.current.add(roomId);
    console.log('🚪 [FIREBASE] Joined room:', roomId);
  };

  const leaveRoom = (roomId: string) => {
    if (!user) return;

    const roomRef = ref(database, `rooms/${roomId}/members/${user.id}`);
    remove(roomRef);
    roomsRef.current.delete(roomId);
    console.log('🚪 [FIREBASE] Left room:', roomId);
  };

  const subscribeToRequest = (requestId: string, callback: (data: any) => void) => {
    const requestRef = ref(database, `requests/${requestId}`);
    
    const unsubscribe = onValue(requestRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });

    // Store listener for cleanup
    const listenerKey = `request_${requestId}`;
    listenersRef.current.set(listenerKey, unsubscribe);

    return () => {
      off(requestRef, 'value', unsubscribe);
      listenersRef.current.delete(listenerKey);
    };
  };

  const subscribeToProviderLocation = (providerId: string, callback: (data: any) => void) => {
    const locationRef = ref(database, `providerLocations/${providerId}`);
    
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });

    // Store listener for cleanup
    const listenerKey = `provider_location_${providerId}`;
    listenersRef.current.set(listenerKey, unsubscribe);

    return () => {
      off(locationRef, 'value', unsubscribe);
      listenersRef.current.delete(listenerKey);
    };
  };

  const subscribeToOffers = (providerId: string, callback: (data: any) => void) => {
    const offersRef = ref(database, `offers/${providerId}`);
    
    const unsubscribe = onValue(offersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });

    // Store listener for cleanup
    const listenerKey = `offers_${providerId}`;
    listenersRef.current.set(listenerKey, unsubscribe);

    return () => {
      off(offersRef, 'value', unsubscribe);
      listenersRef.current.delete(listenerKey);
    };
  };

  const updateRequestStatus = async (requestId: string, status: string, data?: any) => {
    const requestRef = ref(database, `requests/${requestId}`);
    const updateData = {
      status,
      updatedAt: Date.now(),
      ...data
    };
    
    await update(requestRef, updateData);
    console.log('📝 [FIREBASE] Request status updated:', requestId, status);
  };

  const updateProviderLocation = async (providerId: string, location: { lat: number; lng: number; heading?: number }) => {
    const locationRef = ref(database, `providerLocations/${providerId}`);
    const locationData = {
      ...location,
      updatedAt: Date.now()
    };
    
    await set(locationRef, locationData);
    console.log('📍 [FIREBASE] Provider location updated:', providerId, location);
  };

  const createOffer = async (providerId: string, requestId: string, offerData: any) => {
    const offerRef = ref(database, `offers/${providerId}/${requestId}`);
    const offer = {
      ...offerData,
      requestId,
      providerId,
      createdAt: Date.now(),
      status: 'pending'
    };
    
    await set(offerRef, offer);
    console.log('💼 [FIREBASE] Offer created:', providerId, requestId);
  };

  const acceptOffer = async (providerId: string, requestId: string) => {
    const offerRef = ref(database, `offers/${providerId}/${requestId}`);
    await update(offerRef, { status: 'accepted', acceptedAt: Date.now() });
    
    // Update request status
    await updateRequestStatus(requestId, 'accepted', { assignedProvider: providerId });
    console.log('✅ [FIREBASE] Offer accepted:', providerId, requestId);
  };

  const rejectOffer = async (providerId: string, requestId: string) => {
    const offerRef = ref(database, `offers/${providerId}/${requestId}`);
    await update(offerRef, { status: 'rejected', rejectedAt: Date.now() });
    console.log('❌ [FIREBASE] Offer rejected:', providerId, requestId);
  };

  // Cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach((unsubscribe) => {
        unsubscribe();
      });
      listenersRef.current.clear();
    };
  }, []);

  return (
    <FirebaseRealtimeContext.Provider value={{
      isConnected,
      sendMessage,
      joinRoom,
      leaveRoom,
      subscribeToRequest,
      subscribeToProviderLocation,
      subscribeToOffers,
      updateRequestStatus,
      updateProviderLocation,
      createOffer,
      acceptOffer,
      rejectOffer
    }}>
      {children}
    </FirebaseRealtimeContext.Provider>
  );
};
