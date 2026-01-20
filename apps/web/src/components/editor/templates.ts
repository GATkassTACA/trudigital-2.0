// Pre-built templates for common signage types

export interface TemplateElement {
  type: 'text' | 'rect' | 'circle';
  props: Record<string, any>;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  elements: TemplateElement[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'sale-banner',
    name: 'Sale Banner',
    category: 'Retail',
    thumbnail: '🏷️',
    elements: [
      {
        type: 'rect',
        props: {
          left: 50,
          top: 50,
          width: 1244,
          height: 668,
          fill: '#ef4444',
          rx: 20,
          ry: 20,
          stroke: '#dc2626',
          strokeWidth: 4
        }
      },
      {
        type: 'text',
        props: {
          left: 672,
          top: 150,
          text: 'SALE',
          fontSize: 180,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#ffffff',
          originX: 'center',
          textAlign: 'center'
        }
      },
      {
        type: 'text',
        props: {
          left: 672,
          top: 380,
          text: 'UP TO 50% OFF',
          fontSize: 72,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#fef08a',
          originX: 'center',
          textAlign: 'center'
        }
      },
      {
        type: 'text',
        props: {
          left: 672,
          top: 520,
          text: 'Limited Time Only',
          fontSize: 36,
          fontFamily: 'Arial',
          fill: '#ffffff',
          originX: 'center',
          textAlign: 'center'
        }
      }
    ]
  },
  {
    id: 'welcome-sign',
    name: 'Welcome Sign',
    category: 'Corporate',
    thumbnail: '👋',
    elements: [
      {
        type: 'rect',
        props: {
          left: 0,
          top: 0,
          width: 1344,
          height: 768,
          fill: '#1e3a5f'
        }
      },
      {
        type: 'rect',
        props: {
          left: 50,
          top: 50,
          width: 1244,
          height: 668,
          fill: 'transparent',
          stroke: '#60a5fa',
          strokeWidth: 3,
          rx: 10,
          ry: 10
        }
      },
      {
        type: 'text',
        props: {
          left: 672,
          top: 250,
          text: 'WELCOME',
          fontSize: 120,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#ffffff',
          originX: 'center',
          textAlign: 'center'
        }
      },
      {
        type: 'text',
        props: {
          left: 672,
          top: 420,
          text: 'Your Company Name',
          fontSize: 48,
          fontFamily: 'Arial',
          fill: '#93c5fd',
          originX: 'center',
          textAlign: 'center'
        }
      }
    ]
  },
  {
    id: 'menu-board',
    name: 'Menu Board',
    category: 'Restaurant',
    thumbnail: '🍽️',
    elements: [
      {
        type: 'rect',
        props: {
          left: 0,
          top: 0,
          width: 1344,
          height: 768,
          fill: '#1c1917'
        }
      },
      {
        type: 'text',
        props: {
          left: 672,
          top: 80,
          text: 'TODAY\'S SPECIALS',
          fontSize: 64,
          fontFamily: 'Georgia',
          fontWeight: 'bold',
          fill: '#fbbf24',
          originX: 'center',
          textAlign: 'center'
        }
      },
      {
        type: 'rect',
        props: {
          left: 100,
          top: 180,
          width: 500,
          height: 200,
          fill: '#292524',
          rx: 10,
          ry: 10
        }
      },
      {
        type: 'text',
        props: {
          left: 120,
          top: 200,
          text: 'Dish Name',
          fontSize: 36,
          fontFamily: 'Georgia',
          fontWeight: 'bold',
          fill: '#ffffff'
        }
      },
      {
        type: 'text',
        props: {
          left: 120,
          top: 260,
          text: 'Description of the dish goes here',
          fontSize: 24,
          fontFamily: 'Arial',
          fill: '#a8a29e'
        }
      },
      {
        type: 'text',
        props: {
          left: 120,
          top: 320,
          text: '$12.99',
          fontSize: 32,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#22c55e'
        }
      },
      {
        type: 'rect',
        props: {
          left: 744,
          top: 180,
          width: 500,
          height: 200,
          fill: '#292524',
          rx: 10,
          ry: 10
        }
      },
      {
        type: 'text',
        props: {
          left: 764,
          top: 200,
          text: 'Dish Name',
          fontSize: 36,
          fontFamily: 'Georgia',
          fontWeight: 'bold',
          fill: '#ffffff'
        }
      },
      {
        type: 'text',
        props: {
          left: 764,
          top: 260,
          text: 'Description of the dish goes here',
          fontSize: 24,
          fontFamily: 'Arial',
          fill: '#a8a29e'
        }
      },
      {
        type: 'text',
        props: {
          left: 764,
          top: 320,
          text: '$14.99',
          fontSize: 32,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#22c55e'
        }
      }
    ]
  },
  {
    id: 'event-announcement',
    name: 'Event Announcement',
    category: 'Events',
    thumbnail: '🎉',
    elements: [
      {
        type: 'rect',
        props: {
          left: 0,
          top: 0,
          width: 1344,
          height: 768,
          fill: '#7c3aed'
        }
      },
      {
        type: 'circle',
        props: {
          left: 100,
          top: 100,
          radius: 80,
          fill: '#a78bfa',
          opacity: 0.5
        }
      },
      {
        type: 'circle',
        props: {
          left: 1100,
          top: 500,
          radius: 120,
          fill: '#c4b5fd',
          opacity: 0.3
        }
      },
      {
        type: 'text',
        props: {
          left: 672,
          top: 180,
          text: 'JOIN US FOR',
          fontSize: 36,
          fontFamily: 'Arial',
          fill: '#e9d5ff',
          originX: 'center',
          textAlign: 'center'
        }
      },
      {
        type: 'text',
        props: {
          left: 672,
          top: 280,
          text: 'EVENT NAME',
          fontSize: 96,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#ffffff',
          originX: 'center',
          textAlign: 'center'
        }
      },
      {
        type: 'text',
        props: {
          left: 672,
          top: 450,
          text: 'Date & Time Here',
          fontSize: 42,
          fontFamily: 'Arial',
          fill: '#fde047',
          originX: 'center',
          textAlign: 'center'
        }
      },
      {
        type: 'text',
        props: {
          left: 672,
          top: 550,
          text: 'Location Details',
          fontSize: 32,
          fontFamily: 'Arial',
          fill: '#e9d5ff',
          originX: 'center',
          textAlign: 'center'
        }
      }
    ]
  },
  {
    id: 'info-display',
    name: 'Info Display',
    category: 'Information',
    thumbnail: 'ℹ️',
    elements: [
      {
        type: 'rect',
        props: {
          left: 0,
          top: 0,
          width: 1344,
          height: 768,
          fill: '#0f172a'
        }
      },
      {
        type: 'rect',
        props: {
          left: 0,
          top: 0,
          width: 1344,
          height: 120,
          fill: '#0ea5e9'
        }
      },
      {
        type: 'text',
        props: {
          left: 50,
          top: 35,
          text: 'INFORMATION',
          fontSize: 48,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#ffffff'
        }
      },
      {
        type: 'text',
        props: {
          left: 80,
          top: 200,
          text: '• First point of information',
          fontSize: 36,
          fontFamily: 'Arial',
          fill: '#ffffff'
        }
      },
      {
        type: 'text',
        props: {
          left: 80,
          top: 280,
          text: '• Second point of information',
          fontSize: 36,
          fontFamily: 'Arial',
          fill: '#ffffff'
        }
      },
      {
        type: 'text',
        props: {
          left: 80,
          top: 360,
          text: '• Third point of information',
          fontSize: 36,
          fontFamily: 'Arial',
          fill: '#ffffff'
        }
      }
    ]
  },
  {
    id: 'now-playing',
    name: 'Now Playing',
    category: 'Entertainment',
    thumbnail: '🎵',
    elements: [
      {
        type: 'rect',
        props: {
          left: 0,
          top: 0,
          width: 1344,
          height: 768,
          fill: '#18181b'
        }
      },
      {
        type: 'rect',
        props: {
          left: 80,
          top: 150,
          width: 450,
          height: 450,
          fill: '#3f3f46',
          rx: 20,
          ry: 20
        }
      },
      {
        type: 'text',
        props: {
          left: 600,
          top: 180,
          text: 'NOW PLAYING',
          fontSize: 28,
          fontFamily: 'Arial',
          fill: '#22c55e'
        }
      },
      {
        type: 'text',
        props: {
          left: 600,
          top: 260,
          text: 'Song Title',
          fontSize: 56,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#ffffff'
        }
      },
      {
        type: 'text',
        props: {
          left: 600,
          top: 350,
          text: 'Artist Name',
          fontSize: 36,
          fontFamily: 'Arial',
          fill: '#a1a1aa'
        }
      },
      {
        type: 'rect',
        props: {
          left: 600,
          top: 450,
          width: 650,
          height: 8,
          fill: '#3f3f46',
          rx: 4,
          ry: 4
        }
      },
      {
        type: 'rect',
        props: {
          left: 600,
          top: 450,
          width: 250,
          height: 8,
          fill: '#22c55e',
          rx: 4,
          ry: 4
        }
      }
    ]
  }
];

export const TEMPLATE_CATEGORIES = Array.from(new Set(TEMPLATES.map(t => t.category)));
