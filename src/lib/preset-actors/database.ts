import presetData from './data.json';
import { PresetActor, PresetActorDatabase } from '../tmdb/types';

const database = presetData as PresetActorDatabase;

/**
 * Get all preset actors from all categories flattened into a single list.
 */
export function getAllPresetActors(): PresetActor[] {
  return [
    ...(database.tamil_actors || []),
    ...(database.tamil_actresses || []),
    ...(database.telugu_actors || []),
    ...(database.telugu_actresses || []),
    ...(database.bollywood_actors || []),
    ...(database.bollywood_actresses || []),
    ...(database.hollywood_actors || []),
    ...(database.hollywood_actresses || []),
  ];
}

/**
 * Search preset actors by name (case-insensitive, matches name or aliases).
 *
 * @param query Search query
 * @returns Array of matching actors
 */
export function searchPresetActors(query: string): PresetActor[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();
  const allActors = getAllPresetActors();

  return allActors.filter(actor => {
    // Match against name
    if (actor.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Match against aliases
    return actor.aliases.some(alias =>
      alias.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Find an actor by exact name match (case-insensitive).
 * This is used when user types a preset actor name exactly.
 *
 * CRITICAL: This must match Android's exact matching logic (from HomeViewModel.kt:68)
 *
 * @param query Exact actor name
 * @returns Actor if found, null otherwise
 */
export function findActorByExactName(query: string): PresetActor | null {
  if (!query || query.trim().length === 0) {
    return null;
  }

  const lowerQuery = query.toLowerCase().trim();
  const allActors = getAllPresetActors();

  // CRITICAL: Case-insensitive exact match
  const exactMatch = allActors.find(actor =>
    actor.name.toLowerCase() === lowerQuery
  );

  if (exactMatch) {
    return exactMatch;
  }

  // Also check aliases for exact match
  return allActors.find(actor =>
    actor.aliases.some(alias => alias.toLowerCase() === lowerQuery)
  ) || null;
}

/**
 * Get actor by TMDb ID.
 *
 * @param id TMDb person ID
 * @returns Actor if found, null otherwise
 */
export function getActorById(id: number): PresetActor | null {
  const allActors = getAllPresetActors();
  return allActors.find(actor => actor.id === id) || null;
}
