
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Song } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format time from seconds to MM:SS
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create URL from an object
export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

// Get a random item from an array
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Save/load from localStorage with proper error handling
export function saveToLocalStorage<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
    return false;
  }
}

export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Failed to get from localStorage: ${key}`, error);
    return defaultValue;
  }
}

// Format date in a friendly way
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
}

// Filter songs by search term
export function filterSongs(songs: Song[], searchTerm: string): Song[] {
  if (!searchTerm) return songs;
  
  const term = searchTerm.toLowerCase();
  return songs.filter(song => 
    song.title.toLowerCase().includes(term) || 
    song.artist.toLowerCase().includes(term)
  );
}

// Sort songs by different criteria
export type SortCriteria = 'title' | 'artist' | 'duration' | 'addedAt';

export function sortSongs(songs: Song[], criteria: SortCriteria, ascending = true): Song[] {
  const sortedSongs = [...songs];
  const direction = ascending ? 1 : -1;
  
  return sortedSongs.sort((a, b) => {
    switch (criteria) {
      case 'title':
        return direction * a.title.localeCompare(b.title);
      case 'artist':
        return direction * a.artist.localeCompare(b.artist);
      case 'duration':
        return direction * (a.duration - b.duration);
      case 'addedAt':
        return direction * ((a.addedAt || 0) - (b.addedAt || 0));
      default:
        return 0;
    }
  });
}

// Get a shareable link (just a demo implementation)
export function getShareableLink(roomId: string): string {
  return `${window.location.origin}?room=${roomId}`;
}
