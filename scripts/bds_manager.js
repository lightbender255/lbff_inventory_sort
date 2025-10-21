#!/usr/bin/env node
const net = require('net')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const argv = process.argv.slice(2)
const mode = argv[0] || 'help'

function parseArgs (args) {
  const out = {}
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a.startsWith('--')) {
      const k = a.replace(/^--/, '')
      const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true
      out[k] = v
    }
  }
  return out
}

const opts = parseArgs(argv.slice(1))
const PORT = parseInt(opts.port || process.env.BDS_MANAGER_PORT || '30303', 10)
const DEFAULT_BDS_ROOT = opts.bdsRoot || process.env.COPY_BDS_ROOT || 'C:/game/game_servers/bedrock-server-1.21'
const BDS_EXE = path.join(DEFAULT_BDS_ROOT, 'bedrock_server.exe')

if (mode === 'serve') {
  // Manager server: spawn bedrock_server and listen for commands over TCP
  let child = null

  function startServer () {
    if (!fs.existsSync(BDS_EXE)) {
      console.error('bedrock_server.exe not found at', BDS_EXE)
      process.exit(1)
    }
    if (child) {
      console.log('bedrock_server already running (pid', child.pid, ')')
      return
    }
    console.log('Starting bedrock_server from', BDS_EXE)
    child = spawn(BDS_EXE, [], {
      cwd: DEFAULT_BDS_ROOT,
      stdio: ['pipe', 'inherit', 'inherit']
    })
    child.on('exit', (code, sig) => {
      console.log('bedrock_server exited', code, sig)
      child = null
    })
    console.log('bedrock_server started, pid', child.pid)
  }

  function stopServer () {
    return new Promise((resolve, reject) => {
      if (!child) return resolve({ stopped: false, reason: 'not-running' })
      try {
        console.log('Sending stop to server stdin...')
        child.stdin.write('stop\n')
        // wait up to 10s for exit
        let waited = 0
        const iv = setInterval(() => {
          if (!child) { clearInterval(iv); return resolve({ stopped: true }) }
          waited += 1
          if (waited >= 10) {
            clearInterval(iv)
            try { child.kill('SIGTERM') } catch (e) {}
            resolve({ stopped: true, forced: true })
          }
        }, 1000)
      } catch (e) { resolve({ stopped: false, error: e.message }) }
    })
  }

  const server = net.createServer((sock) => {
    sock.setEncoding('utf8')
    let buffer = ''
    sock.on('data', async (data) => {
      buffer += data
      if (!buffer.endsWith('\n')) return
      try {
        const msg = JSON.parse(buffer.trim())
        buffer = ''
        if (msg.cmd === 'status') {
          sock.write(JSON.stringify({ running: !!child }) + '\n')
        } else if (msg.cmd === 'stop') {
          const res = await stopServer()
          sock.write(JSON.stringify({ stopped: true, result: res }) + '\n')
        } else if (msg.cmd === 'start') {
          startServer()
          sock.write(JSON.stringify({ started: true }) + '\n')
        } else if (msg.cmd === 'restart') {
          await stopServer()
          startServer()
          sock.write(JSON.stringify({ restarted: true }) + '\n')
        } else if (msg.cmd === 'send') {
          const line = msg.line || ''
          if (child && child.stdin) { child.stdin.write(line + '\n'); sock.write(JSON.stringify({ sent: true }) + '\n') } else { sock.write(JSON.stringify({ sent: false, reason: 'not-running' }) + '\n') }
        } else {
          sock.write(JSON.stringify({ error: 'unknown-cmd' }) + '\n')
        }
      } catch (err) {
        sock.write(JSON.stringify({ error: err.message }) + '\n')
      }
    })
  })

  server.listen(PORT, '127.0.0.1', () => {
    console.log('BDS manager listening on port', PORT)
    // start server automatically
    startServer()
  })
} else if (mode === 'cmd') {
  // Client: send a command to manager
  const cmd = opts.cmd || 'status'
  const net = require('net')
  const client = new net.Socket()
  client.setEncoding('utf8')
  client.connect(PORT, '127.0.0.1', () => {
    client.write(JSON.stringify({ cmd, line: opts.line || '' }) + '\n')
  })
  client.on('data', (data) => { process.stdout.write(data); client.end() })
  client.on('error', (err) => { console.error('Manager connection failed:', err.message); process.exit(2) })
} else {
  console.log('Usage: bds_manager.js serve|cmd [--bdsRoot <path>] [--port <port>]')
}
