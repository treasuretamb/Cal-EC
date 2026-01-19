
import { Event } from './types';

export const CATEGORIES = ['Intellectual', 'Physical', 'Service', 'Social', 'Spiritual', 'Other'] as const;

export const CATEGORY_COLORS = {
  Intellectual: '#FFB347', // Light Orange
  Physical: '#FDE047',     // Yellow
  Service: '#EF4444',      // Red
  Social: '#EC4899',       // Pink
  Spiritual: '#B0E0E6',    // Powder Blue
  Other: '#22C55E',        // Green
};

export const INITIAL_EVENTS: Event[] = [];
