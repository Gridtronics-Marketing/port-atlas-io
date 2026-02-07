export const TRADE_TYPES = [
  'low_voltage',
  'electrical',
  'plumbing',
  'hvac',
  'fire_life_safety',
  'access_control',
  'security_surveillance',
  'intrusion_alarm',
  'building_automation',
  'lighting_controls',
  'energy_management',
  'gas',
  'medical_gas',
  'water_treatment',
  'elevator',
  'escalator',
  'av_pro',
  'paging_notification',
  'parking_systems',
  'irrigation',
  'refrigeration',
  'commercial_kitchen',
  'industrial_safety',
] as const;

export type TradeType = typeof TRADE_TYPES[number];

export const TRADE_DISPLAY_NAMES: Record<TradeType, string> = {
  low_voltage: 'Low Voltage',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  fire_life_safety: 'Fire & Life Safety',
  access_control: 'Access Control',
  security_surveillance: 'Security Surveillance',
  intrusion_alarm: 'Intrusion Alarm',
  building_automation: 'Building Automation',
  lighting_controls: 'Lighting Controls',
  energy_management: 'Energy Management',
  gas: 'Gas',
  medical_gas: 'Medical Gas',
  water_treatment: 'Water Treatment',
  elevator: 'Elevator',
  escalator: 'Escalator',
  av_pro: 'A/V Pro',
  paging_notification: 'Paging & Notification',
  parking_systems: 'Parking Systems',
  irrigation: 'Irrigation',
  refrigeration: 'Refrigeration',
  commercial_kitchen: 'Commercial Kitchen',
  industrial_safety: 'Industrial Safety',
};

export const TRADE_COLORS: Record<TradeType, string> = {
  low_voltage: '220 90% 56%',
  electrical: '45 93% 47%',
  plumbing: '199 89% 48%',
  hvac: '142 71% 45%',
  fire_life_safety: '0 84% 60%',
  access_control: '262 83% 58%',
  security_surveillance: '330 81% 60%',
  intrusion_alarm: '14 100% 57%',
  building_automation: '173 80% 40%',
  lighting_controls: '48 96% 53%',
  energy_management: '88 50% 53%',
  gas: '28 80% 52%',
  medical_gas: '186 100% 42%',
  water_treatment: '210 79% 46%',
  elevator: '255 47% 50%',
  escalator: '280 50% 50%',
  av_pro: '326 78% 60%',
  paging_notification: '36 100% 50%',
  parking_systems: '200 18% 46%',
  irrigation: '152 69% 31%',
  refrigeration: '195 53% 50%',
  commercial_kitchen: '16 72% 50%',
  industrial_safety: '54 100% 40%',
};

export interface TradeCategory {
  label: string;
  trades: TradeType[];
}

export const TRADE_CATEGORIES: TradeCategory[] = [
  {
    label: 'Core Building Systems',
    trades: ['low_voltage', 'electrical', 'plumbing', 'hvac', 'fire_life_safety'],
  },
  {
    label: 'Security & Controls',
    trades: ['access_control', 'security_surveillance', 'intrusion_alarm'],
  },
  {
    label: 'Automation & Smart Systems',
    trades: ['building_automation', 'lighting_controls', 'energy_management'],
  },
  {
    label: 'Utilities & Specialty',
    trades: ['gas', 'medical_gas', 'water_treatment', 'refrigeration', 'commercial_kitchen', 'industrial_safety'],
  },
  {
    label: 'Vertical & Site Systems',
    trades: ['elevator', 'escalator', 'parking_systems', 'irrigation', 'paging_notification', 'av_pro'],
  },
];

export const getTradeDisplayName = (trade: string): string =>
  TRADE_DISPLAY_NAMES[trade as TradeType] || trade;

export const getTradeColor = (trade: string): string =>
  TRADE_COLORS[trade as TradeType] || '0 0% 50%';
