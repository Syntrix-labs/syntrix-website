const { createServer } = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
const { join } = require('node:path');
const { existsSync, readFileSync, unlinkSync } = require('node:fs');

const root = join(__dirname, '..');
const nextLockFile = join(root, 'frontend', '.next', 'dev', 'lock');
const children = [];

function runSetup() {
  const result = spawnSync('npm', ['run', 'setup'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function findPort(startPort) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No open port found starting at ${startPort}`);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function stopExistingNextDevServer() {
  if (!existsSync(nextLockFile)) {
    return;
  }

  let lock;

  try {
    lock = JSON.parse(readFileSync(nextLockFile, 'utf8'));
  } catch {
    return;
  }

  if (!lock.pid) {
    return;
  }

  if (!isProcessRunning(lock.pid)) {
    unlinkSync(nextLockFile);
    return;
  }

  console.log(`Stopping existing frontend dev server at ${lock.appUrl || `port ${lock.port}`} (PID ${lock.pid})`);
  process.kill(lock.pid, 'SIGTERM');

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await sleep(250);

    if (!isProcessRunning(lock.pid)) {
      return;
    }
  }

  throw new Error(`Frontend dev server PID ${lock.pid} did not stop. Stop it manually, then run npm run dev again.`);
}

function startProcess(label, command, args, options) {
  const child = spawn(command, args, {
    cwd: root,
    env: options.env,
    shell: process.platform === 'win32',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  children.push(child);

  const prefix = `[${label}] `;
  child.stdout.on('data', (chunk) => {
    process.stdout.write(prefix + chunk.toString().replace(/\n$/, '').replace(/\n/g, `\n${prefix}`) + '\n');
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(prefix + chunk.toString().replace(/\n$/, '').replace(/\n/g, `\n${prefix}`) + '\n');
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`${prefix}stopped by ${signal}`);
      return;
    }

    if (code !== 0) {
      console.log(`${prefix}exited with code ${code}`);
    }
  });

  return child;
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

(async () => {
  runSetup();
  await stopExistingNextDevServer();

  const frontendPort = await findPort(3000);
  const backendPort = await findPort(5000);
  const frontendUrl = `http://localhost:${frontendPort}`;
  const backendUrl = `http://localhost:${backendPort}`;
  const clientUrls = [
    frontendUrl,
    `http://127.0.0.1:${frontendPort}`,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002'
  ].join(',');

  console.log(`Frontend: ${frontendUrl}`);
  console.log(`Backend:  ${backendUrl}`);
  console.log('Press Ctrl+C to stop both apps.');

  startProcess('backend', 'npm', ['--prefix', 'backend', 'run', 'dev'], {
    env: {
      ...process.env,
      PORT: String(backendPort),
      CLIENT_URL: clientUrls
    }
  });

  startProcess('frontend', 'npm', ['--prefix', 'frontend', 'run', 'dev', '--', '-p', String(frontendPort)], {
    env: {
      ...process.env,
      BACKEND_URL: backendUrl
    }
  });
})().catch((error) => {
  console.error(error.message);
  shutdown();
  process.exit(1);
});
