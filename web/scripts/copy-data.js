#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '../../data');
const dest = join(__dirname, '../public/data');

if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  for (const f of readdirSync(src)) {
    if (f.endsWith('.json')) {
      copyFileSync(join(src, f), join(dest, f));
    }
  }
  console.log('League data copied to public/data/');
} else {
  console.warn('No data folder found. Run: python3 ingest.py <LEAGUE_ID>');
}
