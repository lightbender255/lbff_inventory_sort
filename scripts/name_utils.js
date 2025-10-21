function insertTypeBeforeLastHash(baseName, type) {
  // Insert 'type' just before the last # symbol (with a space)
  const hashIndex = baseName.lastIndexOf('#');
  if (hashIndex === -1) return baseName + ` ${type}`;
  return baseName.slice(0, hashIndex) + type + ' ' + baseName.slice(hashIndex);
}

module.exports = {
  insertTypeBeforeLastHash,
};
