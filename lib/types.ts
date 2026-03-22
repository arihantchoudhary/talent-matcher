export interface ScoredCandidate {
  id: string;
  rank: number;
  name: string;
  score: number;
  reasoning: string;
  highlights: string[];
  gaps: string[];
  rawFields: Record<string, string>;
  photoUrl?: string;
  linkedinUrl?: string;
}
