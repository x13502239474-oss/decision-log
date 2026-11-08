/**
 * 备用上传通道：git push 不可用（代理 / token scope 限制）时，
 * 通过 GitHub Git Data API 把当前 git 索引里的全部文件写成一次提交。
 *
 * 依赖 gh CLI 已通过 GH_TOKEN 环境变量获得凭证。
 * 用法：GH_REPO=owner/repo node scripts/upload-via-api.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const repo = process.env.GH_REPO || 'x13502239474-oss/decision-log'
const branch = process.env.GH_BRANCH || 'main'
const sourceDir = process.env.GH_DIR || null
const message = process.env.GH_COMMIT_MESSAGE || 'feat: 个人决策日志 Decision Capsule'
const bodyFile = join(tmpdir(), 'dc-upload-body.json')

function walk(dir, base = '') {
  const result = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const rel = base ? `${base}/${name}` : name
    if (statSync(full).isDirectory()) result.push(...walk(full, rel))
    else result.push(rel)
  }
  return result
}

function api(method, path, body) {
  const args = ['api', '-X', method, `repos/${repo}/${path}`, '-H', 'Accept: application/vnd.github+json']
  if (body !== undefined) {
    writeFileSync(bodyFile, JSON.stringify(body))
    args.push('--input', bodyFile)
  }
  let lastError
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const out = execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
      return out.trim() ? JSON.parse(out) : null
    } catch (err) {
      lastError = err
      if (attempt < 4) {
        const msg = String(err.stderr || err.message || '')
        if (/Bad Gateway|502|timeout|ECONN|ETIMEDOUT|TLS/i.test(msg)) {
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500 * attempt)
          continue
        }
      }
      throw err
    }
  }
  throw lastError
}

const files = sourceDir
  ? walk(sourceDir)
  : execFileSync('git', ['ls-files'], { encoding: 'utf8' })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)

console.log(`通过 API 上传 ${files.length} 个文件 → ${repo} / ${branch}`)
const tree = []
for (let i = 0; i < files.length; i += 1) {
  const path = files[i]
  const content = readFileSync(sourceDir ? join(sourceDir, path) : path)
  const blob = api('POST', 'git/blobs', { content: content.toString('base64'), encoding: 'base64' })
  tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha })
  if ((i + 1) % 10 === 0 || i + 1 === files.length) console.log(`  ${i + 1}/${files.length}`)
}

const newTree = api('POST', 'git/trees', { tree })
let parent = null
try {
  parent = api('GET', `git/refs/heads/${branch}`).object.sha
} catch {
  parent = null
}
const commit = api('POST', 'git/commits', {
  message,
  tree: newTree.sha,
  parents: parent ? [parent] : [],
})
if (parent) {
  const updated = api('PATCH', `git/refs/heads/${branch}`, { sha: commit.sha, force: true })
  console.log(`完成：commit ${commit.sha} → ${branch} ${updated.object.sha}`)
} else {
  const created = api('POST', 'git/refs', { ref: `refs/heads/${branch}`, sha: commit.sha })
  console.log(`完成：新建分支 ${branch} → ${created.object.sha}`)
}
