import { describe, test, expect } from 'vitest'
const path = require('path')

const { insertTypeBeforeLastHash } = require(path.join(__dirname, '..', 'scripts', 'name_utils.js'))

describe('insertTypeBeforeLastHash', () => {
  test('inserts before last # when multiple # present', () => {
    const base = '# LBFF Inventory Sorter #'
    const res = insertTypeBeforeLastHash(base, 'Resource Pack')
    expect(res).toBe('# LBFF Inventory Sorter Resource Pack #')
  })

  test('inserts Resource Pack when no # present', () => {
    const base = 'LBFF Inventory Sorter'
    const res = insertTypeBeforeLastHash(base, 'Resource Pack')
    expect(res).toBe('LBFF Inventory Sorter Resource Pack')
  })

  test('inserts before last # when multiple hashes in name', () => {
    const base = '# A # B #'
    const res = insertTypeBeforeLastHash(base, 'Behavior Pack')
    expect(res).toBe('# A # B Behavior Pack #')
  })

  test('handles unicode and trailing spaces', () => {
    const base = '# LBFƒß Inventory   #'
    const res = insertTypeBeforeLastHash(base, 'Resource Pack')
    expect(res).toBe('# LBFƒß Inventory   Resource Pack #')
  })
})
