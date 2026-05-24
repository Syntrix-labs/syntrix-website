const { copyFileSync, existsSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = join(__dirname, '..');
const minimumNodeMajor = 20;
const currentNodeMajor = Number(process.versions.node.split('.')[0]);
const currentInstallTarget = {
  platform: process.platform,
  arch: process.arch
};

if (currentNodeMajor < minimumNodeMajor) {
  console.error(`Node.js ${minimumNodeMajor}+ is required. You are using ${process.version}.`);
  process.exit(1);
}

function ensureEnvFile(examplePath, targetPath) {
  if (existsSync(targetPath)) {
    console.log(`Keeping existing ${targetPath.replace(`${root}/`, '')}`);
    return;
  }

  copyFileSync(examplePath, targetPath);
  console.log(`Created ${targetPath.replace(`${root}/`, '')}`);
}

function expectedNextSwcPackage() {
  const swcPackages = {
    'darwin-arm64': '@next/swc-darwin-arm64',
    'darwin-x64': '@next/swc-darwin-x64',
    'win32-x64': '@next/swc-win32-x64-msvc',
    'win32-arm64': '@next/swc-win32-arm64-msvc'
  };

  return swcPackages[`${process.platform}-${process.arch}`];
}

function hasExpectedNativePackages(appDir) {
  if (appDir !== 'frontend') {
    return true;
  }

  const nextSwcPackage = expectedNextSwcPackage();

  if (!nextSwcPackage) {
    return true;
  }

  return existsSync(join(root, appDir, 'node_modules', ...nextSwcPackage.split('/')));
}

function readInstallMarker(markerPath) {
  if (!existsSync(markerPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(markerPath, 'utf8'));
  } catch {
    return null;
  }
}

function writeInstallMarker(markerPath) {
  writeFileSync(markerPath, `${JSON.stringify(currentInstallTarget, null, 2)}\n`);
}

function runNpmCi(appDir, reason) {
  console.log(`${appDir}: ${reason}`);
  console.log(`${appDir}: installing dependencies with npm ci`);
  const result = spawnSync('npm', ['ci'], {
    cwd: join(root, appDir),
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  writeInstallMarker(join(root, appDir, 'node_modules', '.syntrix-platform.json'));
}

function installIfNeeded(appDir) {
  const nodeModules = join(root, appDir, 'node_modules');
  const markerPath = join(nodeModules, '.syntrix-platform.json');

  if (existsSync(nodeModules)) {
    const marker = readInstallMarker(markerPath);

    if (
      marker &&
      marker.platform === currentInstallTarget.platform &&
      marker.arch === currentInstallTarget.arch &&
      hasExpectedNativePackages(appDir)
    ) {
      console.log(`${appDir}: dependencies already installed for ${process.platform}/${process.arch}`);
      return;
    }

    if (!marker && hasExpectedNativePackages(appDir)) {
      writeInstallMarker(markerPath);
      console.log(`${appDir}: dependencies already installed for ${process.platform}/${process.arch}`);
      return;
    }

    runNpmCi(appDir, `dependencies need to be refreshed for ${process.platform}/${process.arch}`);
    return;
  }

  runNpmCi(appDir, 'dependencies are missing');
}

ensureEnvFile(join(root, 'backend', '.env.example'), join(root, 'backend', '.env'));
ensureEnvFile(join(root, 'frontend', '.env.example'), join(root, 'frontend', '.env.local'));
installIfNeeded('backend');
installIfNeeded('frontend');

console.log('Setup complete.');
