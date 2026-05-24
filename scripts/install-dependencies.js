const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = join(__dirname, '..');
const apps = ['backend', 'frontend'];

function install(appDir) {
  const command = existsSync(join(root, appDir, 'package-lock.json')) ? 'ci' : 'install';
  const result = spawnSync('npm', [command], {
    cwd: join(root, appDir),
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

for (const app of apps) {
  console.log(`${app}: installing dependencies`);
  install(app);
}
