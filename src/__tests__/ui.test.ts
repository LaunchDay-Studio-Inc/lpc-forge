import { describe, it, expect } from 'vitest';
import { listThemes, UI_THEMES } from '../ui/generator.js';
import { listProps, PROP_GENERATORS } from '../ui/props.js';
import { listIcons, iconCount } from '../ui/icons.js';

describe('UI Themes', () => {
  it('should have at least 5 themes', () => {
    expect(listThemes().length).toBeGreaterThanOrEqual(5);
  });

  it('every theme should have required color fields', () => {
    for (const [name, theme] of Object.entries(UI_THEMES)) {
      expect(theme.bgColor, `${name} missing bgColor`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.borderColor, `${name} missing borderColor`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.accentColor, `${name} missing accentColor`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.textColor, `${name} missing textColor`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.borderWidth, `${name} borderWidth`).toBeGreaterThan(0);
    }
  });

  it('should include medieval theme', () => {
    expect(UI_THEMES.medieval).toBeDefined();
  });
});

describe('Props', () => {
  it('should have at least 6 props', () => {
    expect(listProps().length).toBeGreaterThanOrEqual(6);
  });

  it('every prop should have required fields', () => {
    for (const prop of listProps()) {
      expect(prop.name).toBeTruthy();
      expect(prop.category).toBeTruthy();
      expect(prop.width).toBeGreaterThan(0);
      expect(prop.height).toBeGreaterThan(0);
    }
  });

  it('should have generators for all listed props', () => {
    expect(Object.keys(PROP_GENERATORS).length).toBe(listProps().length);
  });
});

describe('Icons', () => {
  it('should have at least 18 icons', () => {
    expect(iconCount()).toBeGreaterThanOrEqual(18);
  });

  it('every icon should have required fields', () => {
    for (const icon of listIcons()) {
      expect(icon.name).toBeTruthy();
      expect(icon.category).toBeTruthy();
      expect(icon.description).toBeTruthy();
    }
  });

  it('should cover essential categories', () => {
    const categories = new Set(listIcons().map(i => i.category));
    expect(categories).toContain('weapon');
    expect(categories).toContain('armor');
    expect(categories).toContain('potion');
    expect(categories).toContain('key');
    expect(categories).toContain('gem');
  });
});
