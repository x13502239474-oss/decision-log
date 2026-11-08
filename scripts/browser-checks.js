/* 浏览器内测试片段。由 scripts/e2e-smoke.mjs 按 PHASE 标记分段注入 CDP。
   这里的代码不是 Node 模块，只在页面上下文中执行。 */

/* PHASE_1 */
await waitFor(() => T().includes('致未来的自己'), 20000)
ok('首页标题「致未来的自己」', T().includes('致未来的自己'))
ok('首页副标题', T().includes('有些答案，需要时间来拆封'))
ok('空状态文案', T().includes('这里暂时没有等待拆封的信件'))

clickText('写一封信')
await waitFor(() => document.querySelector('#d-title'))

setVal(document.querySelector('#d-title'), '自动化测试决策：是否换城市')
setVal(document.querySelector('#d-context'), 'MARKER_CONTEXT_001 当时的背景情境')
setVal(document.querySelectorAll('.paper-input')[0], '接受邀请')
await sleep(150)
clickText('下一步')
await waitFor(() => T().includes('你为什么这样选择'))
ok('三步表单：进入第 2 步', T().includes('你为什么这样选择'))

const choiceBtn = byText('button.segment-item', '接受邀请')
if (!choiceBtn) throw new Error('找不到最终选择按钮')
choiceBtn.click()
const reasonBox = Array.from(document.querySelectorAll('textarea')).find((t) =>
  (t.placeholder || '').includes('三个月后的你'),
)
setVal(reasonBox, 'MARKER_REASON_9988 这是封存时的真实理由，不能被提前看到。')
await sleep(150)
clickText('下一步')
await waitFor(() => T().includes('你有多确定'))
ok('三步表单：进入第 3 步', T().includes('你有多确定'))

const conf5 = document.querySelector('button[aria-label="信心 5 分"]')
if (!conf5) throw new Error('找不到信心 5 分按钮')
conf5.click()
const d = new Date()
const todayKey =
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
setVal(document.querySelector('#review-date'), todayKey)
await sleep(150)
clickText('封存这项决策')
await sleep(2700)

const s1 = store()
ok('封存后回到待回访首页', location.hash === '#/' || location.hash === '', location.hash)
ok('数据已同步写入 localStorage', s1.decisions && s1.decisions.length === 1, JSON.stringify(s1.decisions?.length))
ok('回访日期设置为今天', s1.decisions?.[0]?.reviewAt === todayKey, s1.decisions?.[0]?.reviewAt)
ok('信心评分已保存为 5', s1.decisions?.[0]?.confidence === 5)
ok('备选方案已保存', s1.decisions?.[0]?.options?.length === 1)
ok('封存动画结束后首页出现到期信封', T().includes('自动化测试决策'))
return checks

/* PHASE_2 */
// 线上站点经代理加载可能比本地慢，先等 React 真正挂载完成再断言 DOM
await waitFor(() => T().includes('自动化测试决策'), 20000)
ok('刷新后数据仍然存在', store().decisions?.length === 1)
ok('刷新后首页仍显示该决策', T().includes('自动化测试决策'))
ok('首页显示已到期分组', T().includes('已到期'))

const env = document.querySelector('button.envelope')
if (!env) throw new Error('找不到到期信封')
env.click()
await waitFor(() => T().includes('现在，告诉过去的自己发生了什么'))
const blindText = T()
ok('回访第一阶段：盲写页打开', blindText.includes('先不要回头看当初的判断'))
ok('盲写页不显示当时的理由', !blindText.includes('MARKER_REASON_9988'))
ok('盲写页不显示当时的情境', !blindText.includes('MARKER_CONTEXT_001'))
ok('盲写页不显示备选方案', !blindText.includes('接受邀请'))
ok('盲写页不显示信心评分', !blindText.includes('信心 5/5') && !blindText.includes('几乎确信'))
ok('盲写页显示决策日期与回访日期', blindText.includes('决策日期') && blindText.includes('回访日期'))

clickText('记录结果，拆开过去的信')
await sleep(250)
ok('未填写实际结果时被拦截', T().includes('请先写下实际结果'))
ok('拦截后仍停留在盲写阶段', T().includes('先不要回头看当初的判断') && !T().includes('MARKER_REASON_9988'))

setVal(document.querySelector('#actual-outcome'), 'MARKER_OUTCOME_7766 项目按期完成，但团队规模没有扩大。')
await sleep(150)
clickText('记录结果，拆开过去的信')
await sleep(350)
const s2 = store()
ok('实际结果在拆封动画前已保存', (s2.decisions?.[0]?.actualOutcome || '').includes('MARKER_OUTCOME_7766'))
ok('拆封动画期间仍未展示理由', !T().includes('MARKER_REASON_9988'))
await sleep(1800)
ok('拆封后展示当时的理由', T().includes('MARKER_REASON_9988'))
ok('对照页展示实际结果', T().includes('MARKER_OUTCOME_7766'))
ok('对照页展示当时的预期/方案', T().includes('接受邀请'))

clickText('继续，写下反思')
await waitFor(() => T().includes('现在，你怎么看当时的判断'))
clickText('完成回访')
await sleep(200)
ok('未选择结果对比时被拦截', T().includes('请选择一个结果对比'))
clickText('符合预期')
const lessonBox = Array.from(document.querySelectorAll('textarea')).find((t) =>
  (t.placeholder || '').includes('如果重新做一次决定'),
)
setVal(lessonBox, 'MARKER_LESSON_4455 下次应先确认团队预算。')
await sleep(150)
clickText('完成回访')
await sleep(400)
const s3 = store()
const r = s3.decisions?.[0] || {}
ok('状态变为 reviewed', r.status === 'reviewed', r.status)
ok('保存结果对比', r.outcomeVsExpectation === 'as-expected')
ok('保存经验教训', (r.lesson || '').includes('MARKER_LESSON_4455'))
ok('保存实际回访日期', !!r.reviewedAt)
ok('原始理由未被修改', (r.reasoning || '').includes('MARKER_REASON_9988'))
ok('完成回访后返回首页', location.hash === '#/' || location.hash === '')
ok('首页显示已回访印章/已归档', T().includes('已 回 访') || T().includes('已拆封的档案'))

const decId = r.id
location.hash = '#/overview'
await waitFor(() => T().includes('这段时间，你记下了什么'))
const cards = Array.from(document.querySelectorAll('.archive-panel .display-title')).map((e) => e.textContent.trim())
ok('统计数字来自真实数据（总数 01 / 已回访 01）', cards.length === 4 && cards[0] === '01' && cards[2] === '01', cards.join(','))
ok('统计显示结果对比区域', T().includes('实际结果 vs 当初预期') && T().includes('符合预期'))

location.hash = '#/decision/' + decId
await waitFor(() => T().includes('双面档案卡'))
ok('详情页正面显示当时视角', T().includes('RECTO / 当时视角') && T().includes('MARKER_REASON_9988'))
clickText('翻到回访视角')
await sleep(900)
ok('档案卡可切换到背面', document.querySelector('.flip-stack')?.classList.contains('is-flipped'))
ok('背面显示实际结果与经验教训', T().includes('MARKER_OUTCOME_7766') && T().includes('MARKER_LESSON_4455'))

location.hash = '#/list'
await waitFor(() => document.querySelector('#search'))
setVal(document.querySelector('#search'), 'MARKER_LESSON_4455')
await sleep(250)
ok('全文搜索可命中经验教训', T().includes('显示 1 / 1 份') && T().includes('自动化测试决策'))
setVal(document.querySelector('#search'), '不存在的关键词ZZZ')
await sleep(250)
ok('搜索无结果时显示空状态', T().includes('没有符合条件的档案'))

location.hash = '#/settings'
await waitFor(() => T().includes('档案室设置与备份'))
clickText('导出 ZIP')
await waitFor(() => T().includes('已生成 ZIP 备份') || T().includes('生成 ZIP 失败'), 12000)
ok('Markdown ZIP 导出成功', T().includes('已生成 ZIP 备份'), T().slice(0, 120))
clickText('导出 JSON')
await sleep(400)
ok('JSON 完整备份导出成功', T().includes('已导出 JSON 完整备份'))
ok('设置页显示存储键名', T().includes('decision-capsule:v1'))
ok('设置页包含清空数据二次确认入口', T().includes('清空全部数据'))
return checks

/* PHASE_3 */
location.hash = '#/'
await waitFor(() => T().includes('致未来的自己'))
ok('首页无横向滚动', document.documentElement.scrollWidth <= innerWidth + 1, 'scrollW=' + document.documentElement.scrollWidth + ' inner=' + innerWidth)
const aside = document.querySelector('aside')
ok('手机端隐藏桌面侧栏', aside && getComputedStyle(aside).display === 'none')
const nav = document.querySelector('.bottom-nav')
ok('手机端显示底部导航', nav && getComputedStyle(nav).display !== 'none' && nav.getBoundingClientRect().width <= innerWidth + 1)
const navItems = Array.from(document.querySelectorAll('.nav-item'))
ok('底部导航 4 项且触控区 >=44px', navItems.length === 4 && navItems.every((e) => e.getBoundingClientRect().height >= 44))

location.hash = '#/new'
await waitFor(() => document.querySelector('#d-title'))
const controls = Array.from(document.querySelectorAll('input, textarea, select'))
ok('表单控件均不超出屏幕', controls.every((e) => { const r = e.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1 }), 'count=' + controls.length)
ok('输入框字号 >=16px 防 iOS 缩放', controls.filter((e) => e.tagName !== 'SELECT').every((e) => parseFloat(getComputedStyle(e).fontSize) >= 15.9))
ok('主要按钮触控区 >=44px', Array.from(document.querySelectorAll('button.btn')).every((e) => e.getBoundingClientRect().height >= 44))
ok('新建页无横向滚动', document.documentElement.scrollWidth <= innerWidth + 1, 'scrollW=' + document.documentElement.scrollWidth)

const decId = store().decisions[0].id
location.hash = '#/decision/' + decId
await waitFor(() => T().includes('双面档案卡'))
clickText('翻到回访视角')
await sleep(850)
const back = document.querySelector('.flip-face--back')
const front = document.querySelector('.flip-face--front')
ok('手机端翻转后背面正常显示', back.classList.contains('is-shown') && getComputedStyle(back).display !== 'none')
ok('手机端正面已隐藏（不叠加点击）', getComputedStyle(front).display === 'none')
ok('翻转后背面内容未被裁切', back.getBoundingClientRect().height > 180 && back.scrollHeight <= back.getBoundingClientRect().height + 3, 'h=' + Math.round(back.getBoundingClientRect().height) + ' sh=' + back.scrollHeight)

location.hash = '#/settings'
await waitFor(() => T().includes('档案室设置与备份'))
ok('设置页无横向滚动', document.documentElement.scrollWidth <= innerWidth + 1, 'scrollW=' + document.documentElement.scrollWidth)

const lightBtn = byText('button.segment-item', '浅色')
if (!lightBtn) throw new Error('找不到浅色模式按钮')
lightBtn.click()
await sleep(150)
ok('可切换浅色模式', document.documentElement.dataset.theme === 'light')
const darkBtn = byText('button.segment-item', '深色')
darkBtn.click()
await sleep(150)
ok('可切回深色模式', document.documentElement.dataset.theme === 'dark')

const before = store().decisions.length
const backup = {
  app: 'decision-capsule', version: 1, exportedAt: new Date().toISOString(),
  decisions: [{ ...store().decisions[0], id: 'imported-uuid-' + innerWidth, title: '导入测试决策' }],
}
const fileInput = document.querySelector('input[type=file]')
const dt = new DataTransfer()
dt.items.add(new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' }))
fileInput.files = dt.files
fileInput.dispatchEvent(new Event('change', { bubbles: true }))
await waitFor(() => T().includes('识别到'))
ok('导入前显示结构校验预览', T().includes('识别到') && T().includes('确认导入'))
clickText('确认导入')
await waitFor(() => store().decisions.length === before + 1)
ok('合并导入新增 1 条且保留原数据', store().decisions.length === before + 1 && store().decisions.some((d) => d.title.includes('自动化测试决策')))

const dt2 = new DataTransfer()
dt2.items.add(new File(['{"bad":1}'], 'bad.json', { type: 'application/json' }))
fileInput.files = dt2.files
fileInput.dispatchEvent(new Event('change', { bubbles: true }))
await waitFor(() => T().includes('备份结构不正确'))
ok('非法备份结构被拒绝', T().includes('备份结构不正确'))
ok('非法导入未改动现有数据', store().decisions.length === before + 1)

clickText('清空数据')
await waitFor(() => document.querySelector('#confirm-text'))
const dlg = document.querySelector('[role=dialog]')
ok('确认弹窗不超出屏幕', dlg && dlg.getBoundingClientRect().left >= -1 && dlg.getBoundingClientRect().right <= innerWidth + 1)
ok('清空数据要求输入确认文本', !!document.querySelector('#confirm-text'))
setVal(document.querySelector('#confirm-text'), '随便写点别的')
await sleep(120)
const clearBtn = byText('button', '我已了解，清空数据')
ok('确认文本不匹配时按钮禁用', clearBtn && clearBtn.disabled === true)
clickText('取消')
await sleep(150)
ok('取消后数据未被清空', store().decisions.length === before + 1)
return checks
