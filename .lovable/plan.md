

# Fix Guided 360 Capture

## Problems Found

1. **Infinite re-render loop**: The orientation tracking `useEffect` has a dependency cycle. Calling `requestPermission` changes `permissionGranted`, which recreates `startTracking`, which re-triggers the effect -- creating repeated listener registrations or an infinite loop.

2. **Dual fullscreen overlay conflict**: On web browsers, the photo capture function (`captureWebPhotoWithProcessing`) creates its own fullscreen camera modal at z-index 9999. The GuidedPanoramaCapture is already a fullscreen overlay at z-index 9999. These conflict, causing the capture to appear broken.

3. **No desktop/web fallback**: When device orientation sensors aren't available (most desktop browsers), the compass shows "--" indefinitely with no way to proceed meaningfully. Users should be able to capture photos manually without compass guidance.

## Fixes

### File: `src/components/GuidedPanoramaCapture.tsx`

**Fix the useEffect dependency cycle:**
- Remove `requestPermission`, `startTracking`, `stopTracking` from the dependency array
- Use a ref-based approach or run the init logic only once on mount with proper cleanup
- This prevents the infinite re-trigger loop

**Fix the capture flow for web:**
- Instead of calling `usePhotoCapture.capturePhoto()` (which creates its own camera modal), directly use the Capacitor Camera API or a simpler file input for web
- Alternatively, temporarily hide the GuidedPanoramaCapture overlay while the camera modal is active, then restore it after capture

**Add manual mode fallback:**
- When orientation is not supported or compass shows "--", display a simple message like "Point your phone at angle X and tap capture"
- Allow the user to manually select which angle they're capturing instead of requiring compass alignment
- Add a "Skip compass" option that lets users capture in any order without orientation tracking

### File: `src/hooks/useDeviceOrientation.ts`

**Stabilize callback references:**
- Wrap `requestPermission` and `startTracking` with proper memoization that doesn't change on every `permissionGranted` state update
- Use refs internally for state that callbacks need to read, so the callback identity stays stable

## Technical Details

### GuidedPanoramaCapture.tsx changes:
- Replace the `useEffect` at line 63 with a stable init pattern using `useRef` for tracking initialization state
- Add `manualMode` state -- set to `true` when orientation is unsupported or after a timeout (5 seconds without valid alpha readings)
- In manual mode, show angle selector buttons instead of compass, letting users pick which direction they're capturing
- For photo capture, set a flag before calling `capturePhoto` and use CSS to hide the guided overlay temporarily (or raise the camera modal z-index above it)

### useDeviceOrientation.ts changes:
- Add `useRef` for `permissionGranted` so `startTracking` doesn't need it as a dependency
- Make `requestPermission` and `startTracking` stable references using refs for internal state reads
- This breaks the dependency cycle at the root

