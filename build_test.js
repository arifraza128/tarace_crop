const fs = require('fs');
const { execSync } = require('child_process');

try {
  const result = execSync('npx vite build', { cwd: 'artifacts/smart-terrace', encoding: 'utf-8' });
  fs.writeFileSync('build_err.txt', 'SUCCESS\n' + result);
} catch (e) {
  fs.writeFileSync('build_err.txt', e.stdout + '\n' + e.stderr);
}
