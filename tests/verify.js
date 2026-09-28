const { spawn } = require('child_process');
const http = require('http');

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function runTest() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  console.log('Launching headless Edge for comprehensive verification...');
  const edgeProcess = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:4000'
  ], { stdio: 'ignore' });

  // Wait 2s for Edge to start
  await new Promise(r => setTimeout(r, 2000));

  try {
    const targets = await getJson('http://127.0.0.1:9222/json/list');
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('No valid CDP page target found');
    }

    console.log('Connected to CDP target:', pageTarget.title || pageTarget.url);
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let msgId = 1;
    const callbacks = new Map();
    const consoleLogs = [];
    const consoleErrors = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id)(data);
        callbacks.delete(data.id);
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        const type = data.params.type;
        const text = data.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
        consoleLogs.push({ type, text });
        if (type === 'error') {
          consoleErrors.push(text);
        }
      }
      if (data.method === 'Runtime.exceptionThrown') {
        const text = data.params.exceptionDetails.text + ' ' + (data.params.exceptionDetails.exception?.description || '');
        consoleErrors.push(text);
      }
    };

    function sendCmd(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise((resolve) => ws.onopen = resolve);

    await sendCmd('Runtime.enable');
    await sendCmd('Page.enable');

    // Wait a brief moment for page boot() to run
    await new Promise(r => setTimeout(r, 1500));

    // Evaluate tests
    const evalRes = await sendCmd('Runtime.evaluate', {
      expression: `
        (async () => {
          const results = {
            modules: {},
            stations: {},
            roles: {},
            title: document.title,
            initialStation: APP.station
          };

          // Log in first as admin so APP.user is populated and rShell mounts
          await doLogin('admin@station.gov.in', 'Admin@2026');

          const modules = [
            'dashboard', 'hq', 'energy', 'inventory', 'equipment',
            'environment', 'personnel', 'twin', 'connectivity',
            'alerts', 'emergency', 'simulation', 'analytics',
            'reports', 'logbook', 'settings'
          ];

          for (const m of modules) {
            try {
              go(m);
              const container = document.getElementById('pg-' + m);
              results.modules[m] = {
                status: 'OK',
                hasContent: container ? container.innerHTML.length > 50 : false,
                contentLength: container ? container.innerHTML.length : 0
              };
            } catch (err) {
              results.modules[m] = { status: 'ERROR', error: err.message };
            }
          }

          // Test station switching
          for (const stn of ['maitri', 'bharati']) {
            try {
              switchStation(stn);
              results.stations[stn] = { status: 'OK', activeStation: APP.station };
            } catch (err) {
              results.stations[stn] = { status: 'ERROR', error: err.message };
            }
          }

          // Test role login for all 5 demo users
          for (const u of DEMO_USERS) {
            try {
              await doLogin(u.email, u.pw);
              results.roles[u.role] = {
                status: 'OK',
                userName: APP.user ? APP.user.name : null,
                userRole: APP.user ? APP.user.role : null
              };
            } catch (err) {
              results.roles[u.role] = { status: 'ERROR', error: err.message };
            }
          }

          // Restore to admin & maitri dashboard
          await doLogin('admin@station.gov.in', 'Admin@2026');
          switchStation('maitri');
          go('dashboard');

          return results;
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    const val = evalRes?.result?.result?.value ?? evalRes?.result?.value ?? evalRes;
    console.log('--- TEST RESULTS ---');
    console.log(JSON.stringify(val, null, 2));

    console.log('--- CONSOLE ERRORS COUNT ---', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Console Errors:', consoleErrors);
    } else {
      console.log('✅ ZERO CONSOLE ERRORS DETECTED!');
    }

    ws.close();
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    edgeProcess.kill();
    console.log('Test browser process stopped.');
  }
}

runTest();
