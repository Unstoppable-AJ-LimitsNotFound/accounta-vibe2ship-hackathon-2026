import fs from 'fs';
import path from 'path';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string; // 'emerald', 'sky', 'indigo', 'amber', 'orange', 'purple', 'rose', 'red'
  createdAt: string;
}

export interface Completion {
  id: string; // habitId_date
  habitId: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'skipped';
}

export interface DatabaseState {
  habits: Habit[];
  completions: Completion[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function getLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getOffsetDateString(baseDateStr: string, offset: number): string {
  const date = new Date(baseDateStr + 'T12:00:00');
  date.setDate(date.getDate() + offset);
  return getLocalDateString(date);
}

// Generate beautiful dynamic completions for seed habits
function generateSeeds(): DatabaseState {
  return {
    habits: [],
    completions: [],
  };
}

export function readDatabase(): DatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      const seeds = generateSeeds();
      fs.writeFileSync(DATA_FILE, JSON.stringify(seeds, null, 2), 'utf8');
      return seeds;
    }

    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data) as DatabaseState;
  } catch (error) {
    console.error('Error reading local JSON database:', error);
    return { habits: [], completions: [] };
  }
}

export function writeDatabase(state: DatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing local JSON database:', error);
  }
}
