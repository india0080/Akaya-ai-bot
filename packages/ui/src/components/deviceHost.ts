import { createContext, useContext } from 'react';

/** The phone "device" element; overlays (sheets) portal into it so they stay inside the frame. */
export const DeviceHostContext = createContext<HTMLElement | null>(null);
export const useDeviceHost = () => useContext(DeviceHostContext);
