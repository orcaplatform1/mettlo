import React from 'react';
import { SvgXml } from 'react-native-svg';

const HOME = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <defs>
    <linearGradient id="g1" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFD84A"/><stop offset="0.42" stop-color="#FF9A2E"/>
      <stop offset="0.72" stop-color="#FF5A3D"/><stop offset="1" stop-color="#FF2F68"/>
    </linearGradient>
  </defs>
  <path d="M3.75 10.75 12 4l8.25 6.75" stroke="url(#g1)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5.25 9.75v8.5A1.75 1.75 0 0 0 7 20h10a1.75 1.75 0 0 0 1.75-1.75v-8.5" stroke="url(#g1)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9.5 20v-4.25A1.75 1.75 0 0 1 11.25 14h1.5a1.75 1.75 0 0 1 1.75 1.75V20" stroke="url(#g1)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const DISCOVER = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <defs>
    <linearGradient id="g2" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFD84A"/><stop offset="0.42" stop-color="#FF9A2E"/>
      <stop offset="0.72" stop-color="#FF5A3D"/><stop offset="1" stop-color="#FF2F68"/>
    </linearGradient>
  </defs>
  <circle cx="12" cy="12" r="8.8" stroke="url(#g2)" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M15.95 8.05 13.55 13.55 8.05 15.95 10.45 10.45 15.95 8.05Z" stroke="url(#g2)" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="12" r="1.25" stroke="url(#g2)" stroke-width="1.35"/>
  <path d="M12 3.2v1.15M12 19.65v1.15M3.2 12h1.15M19.65 12h1.15" stroke="url(#g2)" stroke-width="1.25" stroke-linecap="round"/>
</svg>`;

const PROGRAMS = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <defs>
    <linearGradient id="g3" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFD84A"/><stop offset="0.42" stop-color="#FF9A2E"/>
      <stop offset="0.72" stop-color="#FF5A3D"/><stop offset="1" stop-color="#FF2F68"/>
    </linearGradient>
  </defs>
  <circle cx="12" cy="5.15" r="1.65" stroke="url(#g3)" stroke-width="1.65"/>
  <path d="M12 8.05C10.55 8.05 9.55 9.15 8.75 10.35L6.65 7.85C6.35 7.5 5.8 7.45 5.48 7.77C5.16 8.09 5.2 8.58 5.52 8.94L8.2 12.05C8.78 12.72 9.25 13.55 9.45 14.48L10.35 18.65C10.52 19.42 11.18 19.95 12 19.95C12.82 19.95 13.48 19.42 13.65 18.65L14.55 14.48C14.75 13.55 15.22 12.72 15.8 12.05L18.48 8.94C18.8 8.58 18.84 8.09 18.52 7.77C18.2 7.45 17.65 7.5 17.35 7.85L15.25 10.35C14.45 9.15 13.45 8.05 12 8.05Z" stroke="url(#g3)" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9.05 15.9C7.1 15.65 5.35 14.45 4.55 12.55C6.65 12.35 8.45 13.2 9.45 14.65" stroke="url(#g3)" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14.95 15.9C16.9 15.65 18.65 14.45 19.45 12.55C17.35 12.35 15.55 13.2 14.55 14.65" stroke="url(#g3)" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const MESSAGES = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <defs>
    <linearGradient id="g4" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFD84A"/><stop offset="0.42" stop-color="#FF9A2E"/>
      <stop offset="0.72" stop-color="#FF5A3D"/><stop offset="1" stop-color="#FF2F68"/>
    </linearGradient>
  </defs>
  <rect x="3.5" y="5.5" width="17" height="13" rx="2.25" stroke="url(#g4)" stroke-width="1.7" stroke-linejoin="round"/>
  <path d="M4.15 7.15 10.55 12.2a2.35 2.35 0 0 0 2.9 0l6.4-5.05" stroke="url(#g4)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="m4.25 17.35 5.05-4.05M19.75 17.35l-5.05-4.05" stroke="url(#g4)" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const PROFILE = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <defs>
    <linearGradient id="g5" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFD84A"/><stop offset="0.42" stop-color="#FF9A2E"/>
      <stop offset="0.72" stop-color="#FF5A3D"/><stop offset="1" stop-color="#FF2F68"/>
    </linearGradient>
  </defs>
  <circle cx="12" cy="8" r="3.5" stroke="url(#g5)" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M4.5 20c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5" stroke="url(#g5)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const INACTIVE_COLOR = '#6B7280';

const HOME_INACTIVE = HOME.replace(/url\(#g1\)/g, INACTIVE_COLOR);
const DISCOVER_INACTIVE = DISCOVER.replace(/url\(#g2\)/g, INACTIVE_COLOR);
const PROGRAMS_INACTIVE = PROGRAMS.replace(/url\(#g3\)/g, INACTIVE_COLOR);
const MESSAGES_INACTIVE = MESSAGES.replace(/url\(#g4\)/g, INACTIVE_COLOR);
const PROFILE_INACTIVE = PROFILE.replace(/url\(#g5\)/g, INACTIVE_COLOR);

interface Props { name: 'Home' | 'Explore' | 'Programs' | 'Messages' | 'Profile'; active: boolean; size?: number }

export function NavIcon({ name, active, size = 26 }: Props) {
  const svgs: Record<string, [string, string]> = {
    Home: [HOME, HOME_INACTIVE],
    Explore: [DISCOVER, DISCOVER_INACTIVE],
    Programs: [PROGRAMS, PROGRAMS_INACTIVE],
    Messages: [MESSAGES, MESSAGES_INACTIVE],
    Profile: [PROFILE, PROFILE_INACTIVE],
  };
  const [activeSvg, inactiveSvg] = svgs[name] ?? svgs.Home;
  return <SvgXml xml={active ? activeSvg : inactiveSvg} width={size} height={size} />;
}
