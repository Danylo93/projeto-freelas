#!/usr/bin/env python3
"""
Test Socket.io connection specifically
"""

import socketio
import time

def test_socketio():
    print("Testing Socket.io connection...")
    
    try:
        # Create socket client
        sio = socketio.SimpleClient()
        
        # Try to connect
        socket_url = "https://jobber.preview.emergentagent.com"
        print(f"Connecting to: {socket_url}")
        
        sio.connect(socket_url, wait_timeout=10)
        
        if sio.connected:
            print("✅ Socket.io connection successful!")
            
            # Test sending a message
            sio.emit('test_message', {'data': 'Hello from test'})
            print("✅ Message sent successfully")
            
            # Wait a bit
            time.sleep(2)
            
            sio.disconnect()
            print("✅ Disconnected successfully")
        else:
            print("❌ Failed to establish connection")
            
    except Exception as e:
        print(f"❌ Socket.io connection failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_socketio()