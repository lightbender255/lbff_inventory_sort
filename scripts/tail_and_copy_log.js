#!/usr/bin/env node
// Real-time ContentLog tail and copy utility
// Usage: node tail_and_copy_log.js <sourceLogPath> <targetLogPath>

const fs = require('fs');
const path = require('path');

if (process.argv.length < 4) {
  console.error('Usage: node tail_and_copy_log.js <sourceLogPath> <targetLogPath>');
  process.exit(1);
}

const sourceLog = process.argv[2];
const targetLog = process.argv[3];

let lastSize = 0;

function copyNewContent() {
  fs.stat(sourceLog, (err, stats) => {
    if (err) return;
    if (stats.size > lastSize) {
      const stream = fs.createReadStream(sourceLog, {
        start: lastSize,
        end: stats.size
      });
      let data = '';
      stream.on('data', chunk => {
        data += chunk;
      });
      stream.on('end', () => {
        fs.appendFile(targetLog, data, err => {
          if (err) console.error('Error writing to target log:', err);
        });
        lastSize = stats.size;
      });
    } else if (stats.size < lastSize) {
      // Log was truncated (rotated or deleted)
      lastSize = 0;
    }
  });
}

// Initial size
fs.stat(sourceLog, (err, stats) => {
  if (!err) lastSize = stats.size;
});

console.log(`Tailing ${sourceLog} and copying new content to ${targetLog}...`);
setInterval(copyNewContent, 1000); // Check every second
