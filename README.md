# Vynx FaceID — Client SDK

A lightweight **React Native & TypeScript** wrapper module that enables developers to add biometric screens, automated camera frame extraction, and live gesture guides in minutes.

---

## 📦 Installation
```bash
npm install @vynxtechnology/faceid
```

---

## ⚡ Integration Quickstart
Render the `FaceIDCamera` component in your layout. The SDK manages frame-rate capture loops, dynamic guide overlays, and API submissions automatically:

```tsx
import React from 'react';
import { FaceIDCamera } from '@vynxtechnology/faceid';

export default function BiometricScreen() {
  return (
    <FaceIDCamera
      apiKey="vxf_live_your_key_here"
      apiEndpoint="https://api.vynxfaceid.com"
      mode="verify"
      externalUserId="user_uuid_102"
      activeLiveness={true}
      onSuccess={(identity) => {
        console.log("Verified user:", identity);
      }}
      onError={(error) => {
        console.error("Verification failed:", error);
      }}
    />
  );
}
```

---

## 🔬 SDK Functions
* **Camera access & frame-capture loops**.
* **Landmarks bounding guide overlay**.
* **Gestures request checklist** (blink, look straight, turn left, turn right).
