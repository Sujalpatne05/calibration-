import { spawn } from 'node:child_process'

const normalizeDatabaseUrl = () => {
  const rawUrl = process.env.DATABASE_URL

  if (!rawUrl) {
    console.error('DATABASE_URL is missing. Set it in Render environment variables.')
    process.exit(1)
  }

  const normalizedUrl = rawUrl.trim().replace(/^["']|["']$/g, '')
  process.env.DATABASE_URL = normalizedUrl

  if (!/^postgres(ql)?:\/\//.test(normalizedUrl)) {
    console.error(
      'DATABASE_URL must start with postgresql:// or postgres://. In Render, paste the database URL without quotes.'
    )
    process.exit(1)
  }
}

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      shell: true,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
      }
    })
  })

normalizeDatabaseUrl()

try {
  await run('npx', ['prisma', 'generate'])
  await run('npx', ['prisma', 'migrate', 'deploy'])
  await run('node', ['seed.js'])
  await run('node', ['src/server.js'])
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
