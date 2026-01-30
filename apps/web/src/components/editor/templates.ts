// Pre-built templates for common signage types

export interface TemplateElement {
  type: 'text' | 'rect' | 'circle' | 'triangle';
  props: Record<string, any>;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  elements: TemplateElement[];
  animation?: 'fade' | 'slide' | 'zoom' | 'bounce';
}

export const TEMPLATES: Template[] = [
  // ==================== RETAIL ====================
  {
    id: 'sale-banner',
    name: 'Sale Banner',
    category: 'Retail',
    thumbnail: '🏷️',
    animation: 'bounce',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#ef4444' } },
      { type: 'circle', props: { left: 100, top: 100, radius: 150, fill: '#dc2626', opacity: 0.5 } },
      { type: 'circle', props: { left: 1100, top: 500, radius: 200, fill: '#fca5a5', opacity: 0.3 } },
      { type: 'text', props: { left: 672, top: 150, text: 'SALE', fontSize: 200, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 400, text: 'UP TO 50% OFF', fontSize: 80, fontFamily: 'Arial', fontWeight: 'bold', fill: '#fef08a', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 550, text: 'Limited Time Only', fontSize: 36, fontFamily: 'Arial', fill: '#ffffff', originX: 'center' } }
    ]
  },
  {
    id: 'flash-sale',
    name: 'Flash Sale',
    category: 'Retail',
    thumbnail: '⚡',
    animation: 'zoom',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#1f2937' } },
      { type: 'rect', props: { left: 0, top: 300, width: 1344, height: 200, fill: '#fbbf24' } },
      { type: 'text', props: { left: 672, top: 120, text: 'FLASH', fontSize: 120, fontFamily: 'Arial', fontWeight: 'bold', fill: '#fbbf24', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 350, text: 'SALE', fontSize: 140, fontFamily: 'Arial', fontWeight: 'bold', fill: '#1f2937', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 580, text: 'TODAY ONLY • ENDS MIDNIGHT', fontSize: 32, fontFamily: 'Arial', fill: '#9ca3af', originX: 'center' } }
    ]
  },
  {
    id: 'new-arrivals',
    name: 'New Arrivals',
    category: 'Retail',
    thumbnail: '✨',
    animation: 'slide',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#faf5ff' } },
      { type: 'rect', props: { left: 50, top: 50, width: 600, height: 668, fill: '#c4b5fd', rx: 20 } },
      { type: 'text', props: { left: 900, top: 200, text: 'NEW', fontSize: 80, fontFamily: 'Georgia', fill: '#7c3aed', originX: 'center' } },
      { type: 'text', props: { left: 900, top: 320, text: 'ARRIVALS', fontSize: 80, fontFamily: 'Georgia', fill: '#7c3aed', originX: 'center' } },
      { type: 'text', props: { left: 900, top: 480, text: 'Discover our latest collection', fontSize: 28, fontFamily: 'Georgia', fill: '#6b7280', originX: 'center' } },
      { type: 'rect', props: { left: 750, top: 560, width: 300, height: 60, fill: '#7c3aed', rx: 30 } },
      { type: 'text', props: { left: 900, top: 575, text: 'SHOP NOW', fontSize: 24, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } }
    ]
  },
  {
    id: 'clearance',
    name: 'Clearance',
    category: 'Retail',
    thumbnail: '🔖',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#fef3c7' } },
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 150, fill: '#dc2626' } },
      { type: 'text', props: { left: 672, top: 50, text: 'CLEARANCE', fontSize: 80, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 300, text: '70%', fontSize: 250, fontFamily: 'Arial', fontWeight: 'bold', fill: '#dc2626', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 550, text: 'OFF EVERYTHING', fontSize: 60, fontFamily: 'Arial', fontWeight: 'bold', fill: '#1f2937', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 650, text: 'While supplies last', fontSize: 28, fontFamily: 'Arial', fill: '#6b7280', originX: 'center' } }
    ]
  },

  // ==================== RESTAURANT ====================
  {
    id: 'menu-board',
    name: 'Menu Board',
    category: 'Restaurant',
    thumbnail: '🍽️',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#1c1917' } },
      { type: 'text', props: { left: 672, top: 50, text: "TODAY'S SPECIALS", fontSize: 64, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#fbbf24', originX: 'center' } },
      { type: 'rect', props: { left: 50, top: 150, width: 600, height: 250, fill: '#292524', rx: 15 } },
      { type: 'text', props: { left: 80, top: 180, text: 'Grilled Salmon', fontSize: 36, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#ffffff' } },
      { type: 'text', props: { left: 80, top: 240, text: 'Fresh Atlantic salmon with herbs', fontSize: 22, fontFamily: 'Arial', fill: '#a8a29e' } },
      { type: 'text', props: { left: 80, top: 330, text: '$24.99', fontSize: 40, fontFamily: 'Arial', fontWeight: 'bold', fill: '#22c55e' } },
      { type: 'rect', props: { left: 694, top: 150, width: 600, height: 250, fill: '#292524', rx: 15 } },
      { type: 'text', props: { left: 724, top: 180, text: 'Ribeye Steak', fontSize: 36, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#ffffff' } },
      { type: 'text', props: { left: 724, top: 240, text: '12oz prime cut, aged 28 days', fontSize: 22, fontFamily: 'Arial', fill: '#a8a29e' } },
      { type: 'text', props: { left: 724, top: 330, text: '$34.99', fontSize: 40, fontFamily: 'Arial', fontWeight: 'bold', fill: '#22c55e' } },
      { type: 'rect', props: { left: 50, top: 440, width: 600, height: 250, fill: '#292524', rx: 15 } },
      { type: 'text', props: { left: 80, top: 470, text: 'Pasta Primavera', fontSize: 36, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#ffffff' } },
      { type: 'text', props: { left: 80, top: 530, text: 'Fresh vegetables in garlic sauce', fontSize: 22, fontFamily: 'Arial', fill: '#a8a29e' } },
      { type: 'text', props: { left: 80, top: 620, text: '$18.99', fontSize: 40, fontFamily: 'Arial', fontWeight: 'bold', fill: '#22c55e' } }
    ]
  },
  {
    id: 'happy-hour',
    name: 'Happy Hour',
    category: 'Restaurant',
    thumbnail: '🍺',
    animation: 'fade',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#0f172a' } },
      { type: 'circle', props: { left: 100, top: 600, radius: 300, fill: '#f97316', opacity: 0.2 } },
      { type: 'circle', props: { left: 1200, top: 100, radius: 250, fill: '#fbbf24', opacity: 0.2 } },
      { type: 'text', props: { left: 672, top: 100, text: 'HAPPY', fontSize: 120, fontFamily: 'Arial', fontWeight: 'bold', fill: '#fbbf24', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 240, text: 'HOUR', fontSize: 120, fontFamily: 'Arial', fontWeight: 'bold', fill: '#f97316', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 420, text: '4PM - 7PM DAILY', fontSize: 48, fontFamily: 'Arial', fill: '#ffffff', originX: 'center' } },
      { type: 'rect', props: { left: 200, top: 520, width: 400, height: 100, fill: '#1e293b', rx: 10 } },
      { type: 'text', props: { left: 400, top: 550, text: '$5 BEERS', fontSize: 36, fontFamily: 'Arial', fontWeight: 'bold', fill: '#fbbf24', originX: 'center' } },
      { type: 'rect', props: { left: 744, top: 520, width: 400, height: 100, fill: '#1e293b', rx: 10 } },
      { type: 'text', props: { left: 944, top: 550, text: '$7 COCKTAILS', fontSize: 36, fontFamily: 'Arial', fontWeight: 'bold', fill: '#f97316', originX: 'center' } }
    ]
  },
  {
    id: 'coffee-menu',
    name: 'Coffee Menu',
    category: 'Restaurant',
    thumbnail: '☕',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#422006' } },
      { type: 'text', props: { left: 672, top: 50, text: 'COFFEE MENU', fontSize: 72, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#fef3c7', originX: 'center' } },
      { type: 'rect', props: { left: 80, top: 160, width: 550, height: 80, fill: '#78350f', rx: 10 } },
      { type: 'text', props: { left: 100, top: 180, text: 'Espresso', fontSize: 32, fontFamily: 'Georgia', fill: '#fef3c7' } },
      { type: 'text', props: { left: 560, top: 180, text: '$3.50', fontSize: 32, fontFamily: 'Arial', fill: '#fbbf24' } },
      { type: 'rect', props: { left: 80, top: 260, width: 550, height: 80, fill: '#78350f', rx: 10 } },
      { type: 'text', props: { left: 100, top: 280, text: 'Cappuccino', fontSize: 32, fontFamily: 'Georgia', fill: '#fef3c7' } },
      { type: 'text', props: { left: 560, top: 280, text: '$4.50', fontSize: 32, fontFamily: 'Arial', fill: '#fbbf24' } },
      { type: 'rect', props: { left: 80, top: 360, width: 550, height: 80, fill: '#78350f', rx: 10 } },
      { type: 'text', props: { left: 100, top: 380, text: 'Latte', fontSize: 32, fontFamily: 'Georgia', fill: '#fef3c7' } },
      { type: 'text', props: { left: 560, top: 380, text: '$5.00', fontSize: 32, fontFamily: 'Arial', fill: '#fbbf24' } },
      { type: 'rect', props: { left: 714, top: 160, width: 550, height: 80, fill: '#78350f', rx: 10 } },
      { type: 'text', props: { left: 734, top: 180, text: 'Mocha', fontSize: 32, fontFamily: 'Georgia', fill: '#fef3c7' } },
      { type: 'text', props: { left: 1194, top: 180, text: '$5.50', fontSize: 32, fontFamily: 'Arial', fill: '#fbbf24' } },
      { type: 'rect', props: { left: 714, top: 260, width: 550, height: 80, fill: '#78350f', rx: 10 } },
      { type: 'text', props: { left: 734, top: 280, text: 'Cold Brew', fontSize: 32, fontFamily: 'Georgia', fill: '#fef3c7' } },
      { type: 'text', props: { left: 1194, top: 280, text: '$4.75', fontSize: 32, fontFamily: 'Arial', fill: '#fbbf24' } }
    ]
  },

  // ==================== CORPORATE ====================
  {
    id: 'welcome-sign',
    name: 'Welcome Sign',
    category: 'Corporate',
    thumbnail: '👋',
    animation: 'fade',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#1e3a5f' } },
      { type: 'rect', props: { left: 50, top: 50, width: 1244, height: 668, fill: 'transparent', stroke: '#60a5fa', strokeWidth: 3, rx: 10 } },
      { type: 'text', props: { left: 672, top: 250, text: 'WELCOME', fontSize: 120, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 420, text: 'Your Company Name', fontSize: 48, fontFamily: 'Arial', fill: '#93c5fd', originX: 'center' } }
    ]
  },
  {
    id: 'meeting-room',
    name: 'Meeting Room',
    category: 'Corporate',
    thumbnail: '🏢',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#111827' } },
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 200, fill: '#1f2937' } },
      { type: 'text', props: { left: 672, top: 70, text: 'CONFERENCE ROOM A', fontSize: 56, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'rect', props: { left: 100, top: 280, width: 500, height: 120, fill: '#22c55e', rx: 10 } },
      { type: 'text', props: { left: 350, top: 310, text: 'AVAILABLE', fontSize: 48, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 480, text: 'Next Meeting: 2:00 PM', fontSize: 36, fontFamily: 'Arial', fill: '#9ca3af', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 560, text: 'Q4 Planning Session', fontSize: 28, fontFamily: 'Arial', fill: '#6b7280', originX: 'center' } }
    ]
  },
  {
    id: 'directory',
    name: 'Directory',
    category: 'Corporate',
    thumbnail: '📋',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#f8fafc' } },
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 120, fill: '#1e40af' } },
      { type: 'text', props: { left: 672, top: 35, text: 'BUILDING DIRECTORY', fontSize: 48, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'rect', props: { left: 50, top: 160, width: 600, height: 70, fill: '#e2e8f0', rx: 8 } },
      { type: 'text', props: { left: 80, top: 180, text: 'Floor 1 - Reception & Lobby', fontSize: 28, fontFamily: 'Arial', fill: '#1e293b' } },
      { type: 'rect', props: { left: 50, top: 250, width: 600, height: 70, fill: '#e2e8f0', rx: 8 } },
      { type: 'text', props: { left: 80, top: 270, text: 'Floor 2 - Human Resources', fontSize: 28, fontFamily: 'Arial', fill: '#1e293b' } },
      { type: 'rect', props: { left: 50, top: 340, width: 600, height: 70, fill: '#e2e8f0', rx: 8 } },
      { type: 'text', props: { left: 80, top: 360, text: 'Floor 3 - Engineering', fontSize: 28, fontFamily: 'Arial', fill: '#1e293b' } },
      { type: 'rect', props: { left: 694, top: 160, width: 600, height: 70, fill: '#e2e8f0', rx: 8 } },
      { type: 'text', props: { left: 724, top: 180, text: 'Floor 4 - Marketing', fontSize: 28, fontFamily: 'Arial', fill: '#1e293b' } },
      { type: 'rect', props: { left: 694, top: 250, width: 600, height: 70, fill: '#e2e8f0', rx: 8 } },
      { type: 'text', props: { left: 724, top: 270, text: 'Floor 5 - Executive Offices', fontSize: 28, fontFamily: 'Arial', fill: '#1e293b' } }
    ]
  },

  // ==================== EVENTS ====================
  {
    id: 'event-announcement',
    name: 'Event Announcement',
    category: 'Events',
    thumbnail: '🎉',
    animation: 'zoom',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#7c3aed' } },
      { type: 'circle', props: { left: 100, top: 100, radius: 80, fill: '#a78bfa', opacity: 0.5 } },
      { type: 'circle', props: { left: 1100, top: 500, radius: 120, fill: '#c4b5fd', opacity: 0.3 } },
      { type: 'text', props: { left: 672, top: 150, text: 'JOIN US FOR', fontSize: 36, fontFamily: 'Arial', fill: '#e9d5ff', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 280, text: 'GRAND OPENING', fontSize: 96, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 450, text: 'Saturday, March 15th', fontSize: 42, fontFamily: 'Arial', fill: '#fde047', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 540, text: '10:00 AM - 8:00 PM', fontSize: 32, fontFamily: 'Arial', fill: '#e9d5ff', originX: 'center' } }
    ]
  },
  {
    id: 'concert',
    name: 'Concert Promo',
    category: 'Events',
    thumbnail: '🎸',
    animation: 'slide',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#0c0a09' } },
      { type: 'rect', props: { left: 0, top: 600, width: 1344, height: 168, fill: '#dc2626' } },
      { type: 'text', props: { left: 672, top: 80, text: 'LIVE IN CONCERT', fontSize: 36, fontFamily: 'Arial', fill: '#dc2626', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 220, text: 'ARTIST NAME', fontSize: 120, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 420, text: 'WORLD TOUR 2024', fontSize: 48, fontFamily: 'Arial', fill: '#a8a29e', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 640, text: 'MARCH 20 • MAIN ARENA • 8PM', fontSize: 36, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } }
    ]
  },
  {
    id: 'webinar',
    name: 'Webinar',
    category: 'Events',
    thumbnail: '💻',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#0f172a' } },
      { type: 'rect', props: { left: 50, top: 50, width: 620, height: 668, fill: '#1e293b', rx: 20 } },
      { type: 'text', props: { left: 360, top: 150, text: 'FREE WEBINAR', fontSize: 28, fontFamily: 'Arial', fill: '#22d3ee', originX: 'center' } },
      { type: 'text', props: { left: 360, top: 280, text: 'Master Digital', fontSize: 48, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 360, top: 350, text: 'Marketing', fontSize: 48, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 360, top: 480, text: 'Thursday, 2PM EST', fontSize: 28, fontFamily: 'Arial', fill: '#94a3b8', originX: 'center' } },
      { type: 'rect', props: { left: 160, top: 560, width: 400, height: 60, fill: '#22d3ee', rx: 30 } },
      { type: 'text', props: { left: 360, top: 575, text: 'REGISTER FREE', fontSize: 24, fontFamily: 'Arial', fontWeight: 'bold', fill: '#0f172a', originX: 'center' } },
      { type: 'circle', props: { left: 1000, top: 384, radius: 250, fill: '#22d3ee', opacity: 0.1 } }
    ]
  },

  // ==================== INFORMATION ====================
  {
    id: 'info-display',
    name: 'Info Display',
    category: 'Information',
    thumbnail: 'ℹ️',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#0f172a' } },
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 120, fill: '#0ea5e9' } },
      { type: 'text', props: { left: 50, top: 35, text: 'INFORMATION', fontSize: 48, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff' } },
      { type: 'text', props: { left: 80, top: 200, text: '• First point of information', fontSize: 36, fontFamily: 'Arial', fill: '#ffffff' } },
      { type: 'text', props: { left: 80, top: 280, text: '• Second point of information', fontSize: 36, fontFamily: 'Arial', fill: '#ffffff' } },
      { type: 'text', props: { left: 80, top: 360, text: '• Third point of information', fontSize: 36, fontFamily: 'Arial', fill: '#ffffff' } }
    ]
  },
  {
    id: 'hours',
    name: 'Business Hours',
    category: 'Information',
    thumbnail: '🕐',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#1f2937' } },
      { type: 'text', props: { left: 672, top: 80, text: 'BUSINESS HOURS', fontSize: 64, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'rect', props: { left: 300, top: 200, width: 744, height: 70, fill: '#374151', rx: 8 } },
      { type: 'text', props: { left: 350, top: 220, text: 'Monday - Friday', fontSize: 28, fontFamily: 'Arial', fill: '#ffffff' } },
      { type: 'text', props: { left: 900, top: 220, text: '9AM - 6PM', fontSize: 28, fontFamily: 'Arial', fontWeight: 'bold', fill: '#22c55e' } },
      { type: 'rect', props: { left: 300, top: 290, width: 744, height: 70, fill: '#374151', rx: 8 } },
      { type: 'text', props: { left: 350, top: 310, text: 'Saturday', fontSize: 28, fontFamily: 'Arial', fill: '#ffffff' } },
      { type: 'text', props: { left: 900, top: 310, text: '10AM - 4PM', fontSize: 28, fontFamily: 'Arial', fontWeight: 'bold', fill: '#22c55e' } },
      { type: 'rect', props: { left: 300, top: 380, width: 744, height: 70, fill: '#374151', rx: 8 } },
      { type: 'text', props: { left: 350, top: 400, text: 'Sunday', fontSize: 28, fontFamily: 'Arial', fill: '#ffffff' } },
      { type: 'text', props: { left: 900, top: 400, text: 'CLOSED', fontSize: 28, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ef4444' } }
    ]
  },
  {
    id: 'wifi-info',
    name: 'WiFi Info',
    category: 'Information',
    thumbnail: '📶',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#1e3a8a' } },
      { type: 'text', props: { left: 672, top: 100, text: 'FREE WiFi', fontSize: 96, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'rect', props: { left: 300, top: 280, width: 744, height: 200, fill: '#1e40af', rx: 20 } },
      { type: 'text', props: { left: 672, top: 320, text: 'Network: GuestWiFi', fontSize: 36, fontFamily: 'Arial', fill: '#93c5fd', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 400, text: 'Password: Welcome123', fontSize: 36, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 560, text: 'Connect and enjoy!', fontSize: 28, fontFamily: 'Arial', fill: '#60a5fa', originX: 'center' } }
    ]
  },

  // ==================== ENTERTAINMENT ====================
  {
    id: 'now-playing',
    name: 'Now Playing',
    category: 'Entertainment',
    thumbnail: '🎵',
    animation: 'fade',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#18181b' } },
      { type: 'rect', props: { left: 80, top: 150, width: 450, height: 450, fill: '#3f3f46', rx: 20 } },
      { type: 'text', props: { left: 600, top: 180, text: 'NOW PLAYING', fontSize: 28, fontFamily: 'Arial', fill: '#22c55e' } },
      { type: 'text', props: { left: 600, top: 260, text: 'Song Title', fontSize: 56, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff' } },
      { type: 'text', props: { left: 600, top: 350, text: 'Artist Name', fontSize: 36, fontFamily: 'Arial', fill: '#a1a1aa' } },
      { type: 'rect', props: { left: 600, top: 450, width: 650, height: 8, fill: '#3f3f46', rx: 4 } },
      { type: 'rect', props: { left: 600, top: 450, width: 250, height: 8, fill: '#22c55e', rx: 4 } }
    ]
  },
  {
    id: 'movie-showtimes',
    name: 'Movie Showtimes',
    category: 'Entertainment',
    thumbnail: '🎬',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#0c0a09' } },
      { type: 'text', props: { left: 672, top: 50, text: 'NOW SHOWING', fontSize: 56, fontFamily: 'Arial', fontWeight: 'bold', fill: '#fbbf24', originX: 'center' } },
      { type: 'rect', props: { left: 50, top: 150, width: 400, height: 500, fill: '#1c1917', rx: 15 } },
      { type: 'rect', props: { left: 70, top: 170, width: 360, height: 250, fill: '#292524', rx: 10 } },
      { type: 'text', props: { left: 250, top: 450, text: 'ACTION MOVIE', fontSize: 24, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 250, top: 500, text: '2:00 • 5:00 • 8:00', fontSize: 20, fontFamily: 'Arial', fill: '#fbbf24', originX: 'center' } },
      { type: 'rect', props: { left: 472, top: 150, width: 400, height: 500, fill: '#1c1917', rx: 15 } },
      { type: 'rect', props: { left: 492, top: 170, width: 360, height: 250, fill: '#292524', rx: 10 } },
      { type: 'text', props: { left: 672, top: 450, text: 'COMEDY', fontSize: 24, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 500, text: '1:30 • 4:30 • 7:30', fontSize: 20, fontFamily: 'Arial', fill: '#fbbf24', originX: 'center' } },
      { type: 'rect', props: { left: 894, top: 150, width: 400, height: 500, fill: '#1c1917', rx: 15 } },
      { type: 'rect', props: { left: 914, top: 170, width: 360, height: 250, fill: '#292524', rx: 10 } },
      { type: 'text', props: { left: 1094, top: 450, text: 'DRAMA', fontSize: 24, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 1094, top: 500, text: '3:00 • 6:00 • 9:00', fontSize: 20, fontFamily: 'Arial', fill: '#fbbf24', originX: 'center' } }
    ]
  },

  // ==================== HEALTHCARE ====================
  {
    id: 'wait-time',
    name: 'Wait Time',
    category: 'Healthcare',
    thumbnail: '🏥',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#f0fdf4' } },
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 150, fill: '#16a34a' } },
      { type: 'text', props: { left: 672, top: 50, text: 'CURRENT WAIT TIME', fontSize: 48, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 350, text: '15', fontSize: 200, fontFamily: 'Arial', fontWeight: 'bold', fill: '#16a34a', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 520, text: 'MINUTES', fontSize: 48, fontFamily: 'Arial', fill: '#166534', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 650, text: 'Please check in at the front desk', fontSize: 28, fontFamily: 'Arial', fill: '#6b7280', originX: 'center' } }
    ]
  },

  // ==================== FITNESS ====================
  {
    id: 'class-schedule',
    name: 'Class Schedule',
    category: 'Fitness',
    thumbnail: '🏋️',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#0f172a' } },
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 120, fill: '#ea580c' } },
      { type: 'text', props: { left: 672, top: 35, text: "TODAY'S CLASSES", fontSize: 56, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'rect', props: { left: 50, top: 160, width: 400, height: 100, fill: '#1e293b', rx: 10 } },
      { type: 'text', props: { left: 80, top: 185, text: '6:00 AM', fontSize: 24, fontFamily: 'Arial', fill: '#ea580c' } },
      { type: 'text', props: { left: 80, top: 220, text: 'Morning Yoga', fontSize: 28, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff' } },
      { type: 'rect', props: { left: 472, top: 160, width: 400, height: 100, fill: '#1e293b', rx: 10 } },
      { type: 'text', props: { left: 502, top: 185, text: '9:00 AM', fontSize: 24, fontFamily: 'Arial', fill: '#ea580c' } },
      { type: 'text', props: { left: 502, top: 220, text: 'HIIT Training', fontSize: 28, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff' } },
      { type: 'rect', props: { left: 894, top: 160, width: 400, height: 100, fill: '#1e293b', rx: 10 } },
      { type: 'text', props: { left: 924, top: 185, text: '12:00 PM', fontSize: 24, fontFamily: 'Arial', fill: '#ea580c' } },
      { type: 'text', props: { left: 924, top: 220, text: 'Spin Class', fontSize: 28, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff' } },
      { type: 'rect', props: { left: 50, top: 290, width: 400, height: 100, fill: '#1e293b', rx: 10 } },
      { type: 'text', props: { left: 80, top: 315, text: '5:00 PM', fontSize: 24, fontFamily: 'Arial', fill: '#ea580c' } },
      { type: 'text', props: { left: 80, top: 350, text: 'CrossFit', fontSize: 28, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff' } },
      { type: 'rect', props: { left: 472, top: 290, width: 400, height: 100, fill: '#1e293b', rx: 10 } },
      { type: 'text', props: { left: 502, top: 315, text: '6:30 PM', fontSize: 24, fontFamily: 'Arial', fill: '#ea580c' } },
      { type: 'text', props: { left: 502, top: 350, text: 'Zumba', fontSize: 28, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff' } },
      { type: 'rect', props: { left: 894, top: 290, width: 400, height: 100, fill: '#1e293b', rx: 10 } },
      { type: 'text', props: { left: 924, top: 315, text: '8:00 PM', fontSize: 24, fontFamily: 'Arial', fill: '#ea580c' } },
      { type: 'text', props: { left: 924, top: 350, text: 'Pilates', fontSize: 28, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff' } }
    ]
  },

  // ==================== SOCIAL MEDIA ====================
  {
    id: 'follow-us',
    name: 'Follow Us',
    category: 'Social',
    thumbnail: '📱',
    animation: 'bounce',
    elements: [
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } },
      { type: 'rect', props: { left: 0, top: 0, width: 1344, height: 768, fill: '#6366f1' } },
      { type: 'text', props: { left: 672, top: 150, text: 'FOLLOW US', fontSize: 96, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', originX: 'center' } },
      { type: 'text', props: { left: 672, top: 300, text: '@yourcompany', fontSize: 64, fontFamily: 'Arial', fill: '#e0e7ff', originX: 'center' } },
      { type: 'circle', props: { left: 350, top: 500, radius: 60, fill: '#ffffff' } },
      { type: 'circle', props: { left: 550, top: 500, radius: 60, fill: '#ffffff' } },
      { type: 'circle', props: { left: 750, top: 500, radius: 60, fill: '#ffffff' } },
      { type: 'circle', props: { left: 950, top: 500, radius: 60, fill: '#ffffff' } },
      { type: 'text', props: { left: 672, top: 650, text: 'Tag us for a chance to be featured!', fontSize: 28, fontFamily: 'Arial', fill: '#c7d2fe', originX: 'center' } }
    ]
  }
];

export const TEMPLATE_CATEGORIES = Array.from(new Set(TEMPLATES.map(t => t.category)));

// Animation presets for signage
export const ANIMATIONS = {
  fade: {
    name: 'Fade In',
    duration: 1000,
    css: 'opacity: 0; animation: fadeIn 1s forwards;'
  },
  slide: {
    name: 'Slide In',
    duration: 800,
    css: 'transform: translateX(-100%); animation: slideIn 0.8s forwards;'
  },
  zoom: {
    name: 'Zoom In',
    duration: 600,
    css: 'transform: scale(0); animation: zoomIn 0.6s forwards;'
  },
  bounce: {
    name: 'Bounce',
    duration: 1000,
    css: 'animation: bounce 1s ease;'
  }
};
