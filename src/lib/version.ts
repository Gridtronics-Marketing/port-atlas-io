export const APP_VERSION = "0.1.0";

export interface VersionInfo {
  version: string;
  date: string;
  changes: string[];
}

export const VERSION_HISTORY: VersionInfo[] = [
  {
    version: "0.1.0",
    date: "2025-10-01",
    changes: [
      "Fixed drawing mode UUID validation issues",
      "Added temporary drawing storage for new locations",
      "Improved error handling in database hooks",
      "Enhanced InteractiveFloorPlan to handle invalid location IDs",
      "Added graceful fallbacks for drawing operations",
    ],
  },
  {
    version: "0.0.0",
    date: "2025-09-01",
    changes: [
      "Initial release",
      "Core location management features",
      "Interactive floor plans",
      "Basic drawing capabilities",
    ],
  },
];

export const getCurrentVersion = () => APP_VERSION;
export const getVersionHistory = () => VERSION_HISTORY;
