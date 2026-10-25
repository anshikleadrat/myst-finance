import { describe, expect, it } from 'vitest'
import { isLocale, localizePath, unlocalizePath } from './config'
import { en } from './en'
import { hi } from './hi'

function keyPaths(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix]
  return Object.entries(value).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key))
}

describe('locale paths', () => {
  it('leaves English unprefixed and prefixes Hindi', () => {
    expect(localizePath('/', 'en')).toBe('/')
    expect(localizePath('/', 'hi')).toBe('/hi')
    expect(localizePath('/lenders/moneytap', 'hi')).toBe('/hi/lenders/moneytap')
  })

  it('strips locale prefixes', () => {
    expect(unlocalizePath('/hi')).toBe('/')
    expect(unlocalizePath('/hi/blog/x')).toBe('/blog/x')
    expect(unlocalizePath('/history')).toBe('/history')
  })

  it('validates locales', () => {
    expect(isLocale('hi')).toBe(true)
    expect(isLocale('fr')).toBe(false)
  })
})

describe('translations', () => {
  it('Hindi has exactly the same keys as English (including array lengths)', () => {
    expect(keyPaths(hi).sort()).toEqual(keyPaths(en).sort())
  })

  it('has no empty Hindi strings', () => {
    const empty = keyPaths(hi).filter((path) => {
      const value = path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], hi)
      return typeof value === 'string' && value.trim() === ''
    })
    expect(empty).toEqual([])
  })
})
