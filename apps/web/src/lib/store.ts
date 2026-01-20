import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId: string;
  organizationName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'trudigital-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Generation state
interface GenerationState {
  isGenerating: boolean;
  currentPrompt: string;
  generatedImages: any[];
  setGenerating: (isGenerating: boolean) => void;
  setPrompt: (prompt: string) => void;
  setImages: (images: any[]) => void;
  addImage: (image: any) => void;
  clearImages: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  isGenerating: false,
  currentPrompt: '',
  generatedImages: [],
  setGenerating: (isGenerating) => set({ isGenerating }),
  setPrompt: (currentPrompt) => set({ currentPrompt }),
  setImages: (generatedImages) => set({ generatedImages }),
  addImage: (image) => set((state) => ({ generatedImages: [...state.generatedImages, image] })),
  clearImages: () => set({ generatedImages: [] }),
}));
