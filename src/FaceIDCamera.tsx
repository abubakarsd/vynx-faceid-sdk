import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
// Note: In a real environment, you would import Camera from 'react-native-vision-camera' or 'expo-camera'
// We will write clean React Native code that handles the state machine and can hook into any camera driver.

export interface FaceIDCameraProps {
  apiKey: string;
  apiEndpoint: string;
  mode: 'enroll' | 'verify' | 'recognize';
  externalUserId?: string;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
  activeLiveness?: boolean;
}

export const FaceIDCamera = ({
  apiKey,
  apiEndpoint,
  mode,
  externalUserId,
  onSuccess,
  onError,
  activeLiveness = false,
}: FaceIDCameraProps) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [instruction, setInstruction] = useState<string>('Align your face within the frame');
  const [faceBbox, setFaceBbox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const frameInterval = useRef<any>(null);

  // Request camera permissions
  useEffect(() => {
    // Permission request simulation
    setHasPermission(true);
    
    // Start scanning loop (e.g. capturing frames and sending to detect API)
    startScanning();

    return () => {
      if (frameInterval.current) {
        clearInterval(frameInterval.current);
      }
    };
  }, []);

  const startScanning = () => {
    if (frameInterval.current) {
      clearInterval(frameInterval.current);
    }
    // Capture a frame every 1 second (1 FPS) for real-time face detection
    frameInterval.current = setInterval(async () => {
      if (!isScanning || loading) return;

      try {
        // 1. Capture base64 frame/image from camera driver (simulated here)
        const mockFrameBase64 = 'data:image/jpeg;base64,...';
        
        // 2. Call detect endpoint
        const detectedFaces = await detectFaceOnBackend(mockFrameBase64);
        
        if (detectedFaces && typeof detectedFaces === 'object' && 'rateLimited' in detectedFaces && detectedFaces.rateLimited) {
          setFaceBbox(null);
          setInstruction('Rate limit exceeded. Pausing scanning...');
          // Stop current interval and temporarily disable scanning
          if (frameInterval.current) {
            clearInterval(frameInterval.current);
          }
          setIsScanning(false);
          // Restart scanning after 5 seconds to let rate limit window cool down
          setTimeout(() => {
            setIsScanning(true);
            startScanning();
          }, 5000);
          return;
        }

        if (Array.isArray(detectedFaces) && detectedFaces.length > 0) {
          const primaryFace = detectedFaces[0];
          setFaceBbox({
            x: primaryFace.x,
            y: primaryFace.y,
            width: primaryFace.width,
            height: primaryFace.height,
          });

          // Face is aligned. If we are in automatic verification/recognition mode, trigger action.
          if (mode === 'recognize' || mode === 'verify') {
            clearInterval(frameInterval.current);
            performBiometricAction(mockFrameBase64);
          }
        } else {
          setFaceBbox(null);
          setInstruction('Align your face within the frame');
        }
      } catch (err) {
        console.error('Frame detection error:', err);
      }
    }, 1000);
  };

  const detectFaceOnBackend = async (base64Image: string): Promise<any> => {
    try {
      // Mock network response or make real fetch call
      const response = await fetch(`${apiEndpoint}/face/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ image: base64Image }),
      });
      
      if (response.status === 429) {
        const data = await response.json();
        return { rateLimited: true, message: data.message || 'Rate limit exceeded' };
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.faces;
    } catch (e) {
      return null;
    }
  };

  const performBiometricAction = async (base64Image: string) => {
    setLoading(true);
    setIsScanning(false);
    setInstruction('Processing identity...');

    try {
      const url = mode === 'verify' 
        ? `${apiEndpoint}/face/verify` 
        : `${apiEndpoint}/face/recognize`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          externalUserId,
          image: base64Image,
        }),
      });

      const result = await response.json();
      setLoading(false);

      if (result.verified || result.identified) {
        setInstruction('Access Granted');
        onSuccess(result);
      } else {
        setInstruction('Verification Failed');
        onError(result);
        // Restart scanning after delay
        setTimeout(() => {
          setIsScanning(true);
          startScanning();
        }, 2000);
      }
    } catch (err) {
      setLoading(false);
      setInstruction('Biometric error');
      onError(err);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text style={styles.text}>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text style={styles.text}>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Native Camera View Placeholder */}
      <View style={styles.cameraPreview}>
        <Text style={styles.cameraPlaceholderText}>[ Camera Active Preview ]</Text>

        {/* Scan Target Circle Outline */}
        <View style={styles.scannerCircle} />

        {/* Dynamic Bounding Box Overlay */}
        {faceBbox && (
          <View 
            style={[
              styles.boundingBox, 
              { 
                left: faceBbox.x, 
                top: faceBbox.y, 
                width: faceBbox.width, 
                height: faceBbox.height 
              }
            ]} 
          />
        )}
      </View>

      {/* Control overlay */}
      <View style={styles.overlay}>
        <Text style={styles.instructionText}>{instruction}</Text>
        {loading && <ActivityIndicator size="large" color="#00ffcc" style={styles.spinner} />}
        
        {mode === 'enroll' && (
          <TouchableOpacity 
            style={styles.enrollButton}
            onPress={() => performBiometricAction('data:image/jpeg;base64,...')}
          >
            <Text style={styles.buttonText}>Capture & Enroll</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  cameraPreview: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    color: '#3a3a4c',
    fontSize: 16,
    fontStyle: 'italic',
  },
  scannerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: '#00ffcc',
    borderStyle: 'dashed',
    position: 'absolute',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#39ff14',
    borderRadius: 4,
  },
  overlay: {
    padding: 30,
    backgroundColor: '#111116',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  enrollButton: {
    backgroundColor: '#00ffcc',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#0a0a0c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spinner: {
    marginVertical: 10,
  },
  text: {
    color: '#ffffff',
  }
});
