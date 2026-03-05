import type { Theme } from '@/types/deck'

export const THEMES: Theme[] = [
  { id: 'minimal',  name: 'Minimal',  bgColor: '#FFFFFF', textColor: '#444444', headlineColor: '#0A0A0A', accentColor: '#0047E0', fontFamily: 'DM Sans', borderRadius: '8px' },
  { id: 'academic', name: 'Academic', bgColor: '#FAFAF7', textColor: '#444444', headlineColor: '#1A1A3E', accentColor: '#2E4057', fontFamily: 'Georgia, serif', borderRadius: '4px' },
  { id: 'bold',     name: 'Bold',     bgColor: '#0047E0', textColor: '#FFFFFF', headlineColor: '#FFFFFF', accentColor: '#009E91', fontFamily: 'DM Sans', borderRadius: '0px' },
  { id: 'soft',     name: 'Soft',     bgColor: '#F8F4FF', textColor: '#444444', headlineColor: '#2D1B69', accentColor: '#6B46C1', fontFamily: 'DM Sans', borderRadius: '16px' },
  { id: 'dark',     name: 'Dark',     bgColor: '#0A0A0A', textColor: '#CCCCCC', headlineColor: '#FFFFFF', accentColor: '#009E91', fontFamily: 'DM Sans', borderRadius: '8px' },
]
