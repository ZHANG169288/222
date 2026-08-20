// ============================================================
//  员工请假调休管理系统  v2.0
//  纯前端 SPA，数据持久化至 localStorage
// ============================================================

// ---------- 工具函数 ----------
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const formatDate = (d) => { const dt = new Date(d); return dt.toISOString().slice(0,10); };
const today = () => formatDate(new Date());
const now = () => { const d = new Date(); return d.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}); };
const uid  = (prefix='LV') => prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();
const daysDiff = (s,e) => Math.ceil((new Date(e) - new Date(s)) / 86400000) + 1;
const showToast = (msg, type='success') => {
    const t = $('#toast'); t.textContent = msg; t.className = `toast show ${type}`;
    setTimeout(()=> t.className = 'toast', 3000);
};
const escapeHtml = (s) => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---------- 数据层 ----------
const DB = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
    remove(key) { localStorage.removeItem(key); }
};

// 初始化种子数据
function seedData() {
    if (DB.get('leave_employees')) return; // 已初始化

    const employees = [
        { id:'E001', name:'张伟',  dept:'总经办', position:'总经理',     hireDate:'2020-01-15', annualLeave:15, leaveBalance:15, compLeave:10, manager:'E001' },
        { id:'E002', name:'李娜',  dept:'销售部', position:'销售总监',   hireDate:'2019-03-10', annualLeave:12, leaveBalance:12, compLeave:5,  manager:'E001' },
        { id:'E003', name:'王强',  dept:'技术部', position:'技术主管',   hireDate:'2021-06-01', annualLeave:10, leaveBalance:10, compLeave:8,  manager:'E001' },
        { id:'E004', name:'赵敏',  dept:'行政部', position:'行政经理',   hireDate:'2020-08-20', annualLeave:12, leaveBalance:12, compLeave:3,  manager:'E001' },
        { id:'E005', name:'刘洋',  dept:'市场部', position:'市场专员',   hireDate:'2022-02-14', annualLeave:8,  leaveBalance:8,  compLeave:2,  manager:'E002' },
        { id:'E006', name:'陈静',  dept:'财务部', position:'财务主管',   hireDate:'2019-11-05', annualLeave:12, leaveBalance:12, compLeave:6,  manager:'E001' },
        { id:'E007', name:'周磊',  dept:'技术部', position:'高级工程师', hireDate:'2021-09-18', annualLeave:10, leaveBalance:10, compLeave:12, manager:'E003' },
        { id:'E008', name:'孙丽',  dept:'人事部', position:'HR专员',     hireDate:'2022-05-22', annualLeave:8,  leaveBalance:8,  compLeave:4,  manager:'E001' },
        { id:'E009', name:'吴鹏',  dept:'销售部', position:'销售经理',   hireDate:'2020-04-30', annualLeave:12, leaveBalance:12, compLeave:7,  manager:'E002' },
        { id:'E010', name:'郑涛',  dept:'技术部', position:'前端工程师', hireDate:'2023-01-08', annualLeave:5,  leaveBalance:5,  compLeave:3,  manager:'E003' },
    ];

    const leaves = [
        { id:uid(), employeeId:'E001', name:'张伟', dept:'总经办', type:'年假', startDate:'2026-07-10', endDate:'2026-07-14', days:5, reason:'家庭旅行，陪同家人出行', status:'已通过', approver:'系统自动', submitTime:'2026-06-28 14:32', urgent:'normal', timeRange:'全天', history:[{time:'2026-06-28 14:33',action:'提交申请'},{time:'2026-06-29 09:15',action:'已通过（系统自动审批）'}] },
        { id:uid(), employeeId:'E003', name:'王强', dept:'技术部', type:'调休', startDate:'2026-08-05', endDate:'2026-08-06', days:2, reason:'上周末加班补偿调休', status:'已通过', approver:'张伟', submitTime:'2026-08-01 10:05', urgent:'normal', timeRange:'全天', history:[{time:'2026-08-01 10:06',action:'提交申请'},{time:'2026-08-01 16:20',action:'已通过（审批人：张伟）'}] },
        { id:uid(), employeeId:'E005', name:'刘洋', dept:'市场部', type:'事假', startDate:'2026-08-12', endDate:'2026-08-12', days:1, reason:'办理个人证件，需前往派出所', status:'审批中', approver:'李娜', submitTime:'2026-08-09 16:42', urgent:'normal', timeRange:'全天', history:[{time:'2026-08-09 16:43',action:'提交申请'}] },
        { id:uid(), employeeId:'E007', name:'周磊', dept:'技术部', type:'病假', startDate:'2026-08-15', endDate:'2026-08-16', days:2, reason:'感冒发烧，医生建议休息两天', status:'待审批', approver:'王强', submitTime:'2026-08-14 08:20', urgent:'urgent', timeRange:'全天', history:[{time:'2026-08-14 08:21',action:'提交申请'}] },
        { id:uid(), employeeId:'E002', name:'李娜', dept:'销售部', type:'年假', startDate:'2026-09-01', endDate:'2026-09-05', days:5, reason:'出国旅游度假', status:'待审批', approver:'张伟', submitTime:'2026-08-18 11:30', urgent:'normal', timeRange:'全天', history:[{time:'2026-08-18 11:31',action:'提交申请'}] },
        { id:uid(), employeeId:'E009', name:'吴鹏', dept:'销售部', type:'调休', startDate:'2026-08-20', endDate:'2026-08-21', days:2, reason:'上月加班调休', status:'待审批', approver:'李娜', submitTime:'2026-08-19 17:00', urgent:'normal', timeRange:'全天', history:[{time:'2026-08-19 17:01',action:'提交申请'}] },
        { id:uid(), employeeId:'E004', name:'赵敏', dept:'行政部', type:'年假', startDate:'2026-06-01', endDate:'2026-06-03', days:3, reason:'回家探亲', status:'已通过', approver:'张伟', submitTime:'2026-05-20 09:00', urgent:'normal', timeRange:'全天', history:[{time:'2026-05-20 09:01',action:'提交申请'},{time:'2026-05-20 14:00',action:'已通过（审批人：张伟）'}] },
        { id:uid(), employeeId:'E006', name:'陈静', dept:'财务部', type:'事假', startDate:'2026-07-22', endDate:'2026-07-22', days:1, reason:'银行办理贷款业务', status:'已驳回', approver:'张伟', submitTime:'2026-07-18 15:20', urgent:'normal', timeRange:'上午', history:[{time:'2026-07-18 15:21',action:'提交申请'},{time:'2026-07-19 10:00',action:'已驳回（理由：月末财务结算期，请调整时间）'}] },
        { id:uid(), employeeId:'E010', name:'郑涛', dept:'技术部', type:'调休', startDate:'2026-08-22', endDate:'2026-08-22', days:1, reason:'项目上线加班调休', status:'待审批', approver:'王强', submitTime:'2026-08-20 09:15', urgent:'normal', timeRange:'全天', history:[{time:'2026-08-20 09:16',action:'提交申请'}] },
        { id:uid(), employeeId:'E008', name:'孙丽', dept:'人事部', type:'年假', startDate:'2026-10-01', endDate:'2026-10-07', days:7, reason:'国庆长假旅行', status:'待审批', approver:'张伟', submitTime:'2026-08-15 14:00', urgent:'normal', timeRange:'全天', history:[{time:'2026-08-15 14:01',action:'提交申请'}] },
    ];

    DB.set('leave_employees', employees);
    DB.set('leave_records', leaves);
    DB.set('leave_currentUser', null);
    DB.set('leave_settings', { company:'腾讯科技有限公司', annualLeave:15, maxDays:15, advanceDays:3, workDays:[1,2,3,4,5] });
}

// ---------- 全局状态 ----------
let currentUser = DB.get('leave_currentUser', null);
let currentRole = 'employee';

// ---------- 登录 ----------
function doLogin() {
    const username = $('#loginUsername').value.trim();
    const password = $('#loginPassword').value.trim();
    const role     = $('#loginRole').value;

    if (!username || !password) { showToast('请输入用户名和密码', 'error'); return; }

    // 简单验证（演示用）
    if (password !== '123456') { showToast('密码错误，演示密码为 123456', 'error'); return; }

    const employees = DB.get('leave_employees', []);
    let user = employees.find(e => e.name === username) || employees[0];

    currentUser = { ...user, role, loginName: username };
    currentRole = role;
    DB.set('leave_currentUser', currentUser);

    // 切换页面
    $('#loginPage').classList.remove('active');
    $('#mainPage').classList.add('active');

    // 根据角色显示导航
    if (role === 'admin') {
        $('#navApprove').style.display = 'flex';
        $('#navEmployees').style.display = 'flex';
    } else if (role === 'manager') {
        $('#navApprove').style.display = 'flex';
        $('#navEmployees').style.display = 'none';
    } else {
        $('#navApprove').style.display = 'none';
        $('#navEmployees').style.display = 'none';
    }

    initApp();
    showToast(`欢迎回来，${currentUser.name}！`, 'success');
}

function doLogout() {
    currentUser = null;
    currentRole = 'employee';
    DB.set('leave_currentUser', null);
    $('#mainPage').classList.remove('active');
    $('#loginPage').classList.add('active');
    // 重置导航
    $$('.nav-item').forEach(n => n.classList.remove('active'));
    $('.nav-item[data-page="dashboard"]').classList.add('active');
    $$('.content-page').forEach(p => p.classList.remove('active'));
    $('#page-dashboard').classList.add('active');
}

// ---------- 导航 ----------
$$('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        $$('.content-page').forEach(p => p.classList.remove('active'));
        $(`#page-${page}`).classList.add('active');
        // 页面特定刷新
        if (page === 'dashboard')   loadDashboard();
        if (page === 'myLeaves')   loadMyLeaves();
        if (page === 'approve')    loadApproveList();
        if (page === 'statistics') loadStatistics();
        if (page === 'employees')  loadEmployees();
        if (page === 'apply')      initApplyForm();
    });
});

// ---------- 初始化应用 ----------
function initApp() {
    // 用户信息
    $('#userAvatar').textContent = currentUser.name.charAt(0);
    $('#userName').textContent   = currentUser.name;
    $('#userRole').textContent   = {admin:'管理员', manager:'部门主管', employee:'普通员工'}[currentRole];
    $('#currentDate').textContent = new Date().toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric',weekday:'long'});

    // 默认加载工作台
    loadDashboard();
    initApplyForm();
}

// ---------- 工作台 ----------
function loadDashboard() {
    const records = DB.get('leave_records', []);
    const employees = DB.get('leave_employees', []);

    // 统计
    const total   = records.length;
    const pending = records.filter(r => r.status === '待审批' || r.status === '审批中').length;
    const approved= records.filter(r => r.status === '已通过').length;
    const rejected= records.filter(r => r.status === '已驳回').length;

    $('#statTotalLeaves').textContent = total;
    $('#statPending').textContent     = pending;
    $('#statApproved').textContent    = approved;
    $('#statRejected').textContent    = rejected;

    // 审批角标
    const myPending = records.filter(r => (r.status==='待审批'||r.status==='审批中') && canApprove(r)).length;
    const badge = $('#approveBadge');
    badge.textContent = myPending;
    badge.style.display = myPending > 0 ? 'inline' : 'none';

    // 最近动态时间线
    const timeline = $('#recentTimeline');
    const recent = [...records].sort((a,b) => b.submitTime.localeCompare(a.submitTime)).slice(0, 6);
    if (recent.length === 0) {
        timeline.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>暂无记录</p></div>';
    } else {
        timeline.innerHTML = recent.map(r => `
            <div class="timeline-item ${r.status==='已通过'?'approved':r.status==='已驳回'?'rejected':''}">
                <div class="timeline-time">${r.submitTime} · ${r.name}（${r.dept}）</div>
                <div class="timeline-content">
                    <strong>${r.type}</strong> ${r.startDate} ~ ${r.endDate}（${r.days}天）
                    <span class="status-badge ${getStatusClass(r.status)}">${r.status}</span>
                </div>
            </div>
        `).join('');
    }

    // 图表
    renderLeaveTypeChart(records);
    renderMonthlyChart(records);
}

function getStatusClass(s) {
    return { '待审批':'pending', '审批中':'approving', '已通过':'approved', '已驳回':'rejected', '已取消':'cancelled' }[s] || 'pending';
}

// ---------- 图表：请假类型分布（饼图） ----------
function renderLeaveTypeChart(records) {
    const canvas = $('#leaveTypeChart');
    const ctx = canvas.getContext('2d');
    const types = {};
    records.forEach(r => { if (r.status !== '已驳回' && r.status !== '已取消') types[r.type] = (types[r.type]||0) + r.days; });
    const labels = Object.keys(types);
    const data   = Object.values(types);
    const colors = ['#4F6EF7','#22C55E','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899','#F97316'];

    drawPieChart(ctx, canvas, labels, data, colors);
}

// ---------- 图表：月度趋势（柱状图） ----------
function renderMonthlyChart(records) {
    const canvas = $('#monthlyChart');
    const ctx = canvas.getContext('2d');
    const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const counts = new Array(12).fill(0);
    const approved = new Array(12).fill(0);
    records.forEach(r => {
        const m = new Date(r.startDate).getMonth();
        counts[m]++;
        if (r.status === '已通过') approved[m]++;
    });

    drawBarChart(ctx, canvas, months, [{label:'总申请',data:counts,color:'#4F6EF7'},{label:'已通过',data:approved,color:'#22C55E'}]);
}

// ---------- 图表：部门排行（横向柱状图） ----------
function renderDeptChart(records) {
    const canvas = $('#deptChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const depts = {};
    records.forEach(r => { if (r.status==='已通过') depts[r.dept] = (depts[r.dept]||0) + r.days; });
    const sorted = Object.entries(depts).sort((a,b) => b[1]-a[1]);
    const labels = sorted.map(s => s[0]);
    const data   = sorted.map(s => s[1]);

    drawHorizontalBar(ctx, canvas, labels, data, '#4F6EF7');
}

// ---------- Canvas 绘图函数 ----------
function drawPieChart(ctx, canvas, labels, data, colors) {
    const W = canvas.width = 400, H = canvas.height = 300;
    ctx.clearRect(0,0,W,H);
    if (data.length === 0) { ctx.fillStyle='#94A3B8'; ctx.font='14px sans-serif'; ctx.fillText('暂无数据', W/2-28, H/2); return; }
    const total = data.reduce((s,v)=>s+v,0);
    let startAngle = -Math.PI/2;
    const cx = W/2 - 40, cy = H/2, r = 80;

    data.forEach((v,i) => {
        const angle = (v/total) * Math.PI * 2;
        ctx.beginPath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.moveTo(cx,cy);
        ctx.arc(cx, cy, r, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fill();
        startAngle += angle;
    });

    // 图例
    const legendX = W - 100;
    labels.forEach((l,i) => {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(legendX, 30 + i*28, 14, 14);
        ctx.fillStyle = '#334155';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${l} (${data[i]}天)`, legendX + 20, 42 + i*28);
    });
}

function drawBarChart(ctx, canvas, labels, datasets) {
    const W = canvas.width = 400, H = canvas.height = 300;
    ctx.clearRect(0,0,W,H);
    const pad = { top:30, right:20, bottom:50, left:40 };
    const cw = W - pad.left - pad.right;
    const ch = H - pad.top - pad.bottom;
    const max = Math.max(...datasets.flatMap(d=>d.data), 1);
    const bw = cw / labels.length * 0.3;

    // 坐标轴
    ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 1;
    for (let i=0; i<=5; i++) {
        const y = pad.top + ch - (i/5)*ch;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W-pad.right, y); ctx.stroke();
        ctx.fillStyle='#94A3B8'; ctx.font='11px sans-serif';
        ctx.fillText(Math.round(max*i/5), 8, y+4);
    }

    datasets.forEach((ds, di) => {
        ds.data.forEach((v, i) => {
            const x = pad.left + (i+0.5)*cw/labels.length + (di-0.5)*bw;
            const h = (v/max)*ch;
            ctx.fillStyle = ds.color;
            ctx.fillRect(x, pad.top+ch-h, bw, h);
            if (v>0) { ctx.fillStyle='#334155'; ctx.font='11px sans-serif'; ctx.fillText(v, x+bw/2-4, pad.top+ch-h-5); }
        });
    });

    // X轴标签
    ctx.fillStyle='#64748B'; ctx.font='11px sans-serif'; ctx.textAlign='center';
    labels.forEach((l,i) => ctx.fillText(l, pad.left+(i+0.5)*cw/labels.length, H-pad.bottom+18));
    ctx.textAlign='left';

    // 图例
    let lx = pad.left;
    datasets.forEach((ds,i) => {
        ctx.fillStyle = ds.color;
        ctx.fillRect(lx, 10, 12, 12);
        ctx.fillStyle='#334155'; ctx.font='11px sans-serif';
        ctx.fillText(ds.label, lx+16, 20);
        lx += 80;
    });
}

function drawHorizontalBar(ctx, canvas, labels, data, color) {
    const W = canvas.width = 400, H = canvas.height = 300;
    ctx.clearRect(0,0,W,H);
    if (data.length===0) { ctx.fillStyle='#94A3B8'; ctx.font='14px sans-serif'; ctx.fillText('暂无数据', W/2-28, H/2); return; }
    const pad = { top:20, right:50, bottom:20, left:80 };
    const cw = W-pad.left-pad.right, ch = H-pad.top-pad.bottom;
    const max = Math.max(...data,1);
    const bh = ch/labels.length * 0.6;

    labels.forEach((l,i) => {
        const v = data[i];
        const h = (v/max)*cw;
        const y = pad.top + i*ch/labels.length + (ch/labels.length-bh)/2;
        ctx.fillStyle = color;
        ctx.fillRect(pad.left, y, h, bh);
        ctx.fillStyle='#334155'; ctx.font='12px sans-serif';
        ctx.fillText(l, 8, y+bh/2+4);
        ctx.fillText(v+'天', pad.left+h+6, y+bh/2+4);
    });
}

// ---------- 申请请假 ----------
function initApplyForm() {
    if (!currentUser) return;
    $('#formApplicant').value  = currentUser.name;
    $('#formDepartment').value = currentUser.dept || '';

    // 审批人下拉
    const employees = DB.get('leave_employees', []);
    const approvers = employees.filter(e => e.id !== currentUser.id);
    $('#formApprover').innerHTML = `<option value="">系统自动分配</option>` +
        approvers.map(e => `<option value="${e.id}">${e.name}（${e.position}）</option>`).join('');

    // 日期默认
    const t = today();
    $('#formStartDate').value = t;
    $('#formEndDate').value   = t;

    // 假期余额
    renderBalanceCards();
}

function renderBalanceCards() {
    if (!currentUser) return;
    const u = DB.get('leave_employees',[]).find(e => e.id === currentUser.id) || currentUser;
    $('#balanceCards').innerHTML = `
        <div class="balance-card"><div class="bc-type">🏖️ 年假余额</div><div class="bc-days">${u.leaveBalance||0}</div><div class="bc-label">天</div></div>
        <div class="balance-card"><div class="bc-type">🔄 调休余额</div><div class="bc-days">${u.compLeave||0}</div><div class="bc-label">天</div></div>
        <div class="bc-type" style="display:none"></div>
        <div class="balance-card" style="background:linear-gradient(135deg,#ECFDF5,#fff);border-color:rgba(34,197,94,.15)"><div class="bc-type">📅 本月已请</div><div class="bc-days" style="color:#22C55E">${getMyMonthLeaves()}</div><div class="bc-label">天</div></div>
        <div class="balance-card" style="background:linear-gradient(135deg,#FFFBEB,#fff);border-color:rgba(245,158,11,.15)"><div class="bc-type">⏳ 待审批</div><div class="bc-days" style="color:#F59E0B">${getMyPendingLeaves()}</div><div class="bc-label">条</div></div>
    `;
}

function getMyMonthLeaves() {
    const records = DB.get('leave_records', []);
    const m = new Date().getMonth(), y = new Date().getFullYear();
    return records.filter(r => r.employeeId===currentUser.id && r.status==='已通过' && new Date(r.startDate).getMonth()===m && new Date(r.startDate).getFullYear()===y).reduce((s,r)=>s+r.days,0);
}
function getMyPendingLeaves() {
    return DB.get('leave_records',[]).filter(r => r.employeeId===currentUser.id && (r.status==='待审批'||r.status==='审批中')).length;
}

// 日期自动计算天数
$('#formStartDate').addEventListener('change', calcDays);
$('#formEndDate').addEventListener('change', calcDays);
function calcDays() {
    const s = $('#formStartDate').value, e = $('#formEndDate').value;
    if (s && e) {
        const d = daysDiff(s,e);
        if (d > 0) $('#formDays').value = d + ' 天';
        else { $('#formDays').value = ''; showToast('结束日期需晚于开始日期', 'error'); }
    }
}

// 提交申请
$('#leaveForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = $('#formLeaveType').value;
    const s = $('#formStartDate').value, ed = $('#formEndDate').value;
    const reason = $('#formReason').value.trim();
    const urgent = $('#formUrgency').value;
    const timeRange = $('#formTimeRange').value;
    const approverId = $('#formApprover').value;

    if (!type) { showToast('请选择请假类型', 'error'); return; }
    if (!s || !ed) { showToast('请选择起止日期', 'error'); return; }
    if (daysDiff(s,ed) <= 0) { showToast('日期范围无效', 'error'); return; }
    if (!reason) { showToast('请填写请假事由', 'error'); return; }

    // 检查余额
    const emp = DB.get('leave_employees',[]).find(e => e.id === currentUser.id);
    if (type === '年假' && emp && daysDiff(s,ed) > (emp.leaveBalance||0)) {
        showToast(`年假余额不足！当前剩余 ${emp.leaveBalance||0} 天`, 'error'); return;
    }
    if (type === '调休' && emp && daysDiff(s,ed) > (emp.compLeave||0)) {
        showToast(`调休余额不足！当前剩余 ${emp.compLeave||0} 天`, 'error'); return;
    }

    // 确定审批人
    let approverName = '系统自动';
    if (approverId) {
        const a = DB.get('leave_employees',[]).find(e => e.id === approverId);
        approverName = a ? a.name : '系统自动';
    } else if (emp && emp.manager) {
        const m = DB.get('leave_employees',[]).find(e => e.id === emp.manager);
        approverName = m ? m.name : '系统自动';
    }

    const record = {
        id: uid(),
        employeeId: currentUser.id,
        name: currentUser.name,
        dept: currentUser.dept || '',
        type, startDate: s, endDate: ed,
        days: daysDiff(s,ed),
        reason, urgent, timeRange,
        status: '待审批',
        approver: approverName,
        submitTime: now(),
        history: [{ time: now(), action: '提交申请' }]
    };

    const records = DB.get('leave_records', []);
    records.push(record);
    DB.set('leave_records', records);

    // 扣减余额
    if (emp) {
        if (type === '年假') emp.leaveBalance = Math.max(0, (emp.leaveBalance||0) - record.days);
        if (type === '调休') emp.compLeave = Math.max(0, (emp.compLeave||0) - record.days);
        const emps = DB.get('leave_employees',[]);
        const idx = emps.findIndex(e => e.id === emp.id);
        if (idx >= 0) { emps[idx] = emp; DB.set('leave_employees', emps); }
    }

    showToast('申请提交成功！', 'success');
    resetForm();
    renderBalanceCards();

    // 自动跳转到我的申请
    setTimeout(() => { $('.nav-item[data-page="myLeaves"]').click(); }, 800);
});

function resetForm() {
    $('#leaveForm').reset();
    initApplyForm();
}

// ---------- 我的申请 ----------
function loadMyLeaves() {
    const filter = $('#filterStatus').value;
    const records = DB.get('leave_records', [])
        .filter(r => r.employeeId === currentUser.id)
        .filter(r => !filter || r.status === filter)
        .sort((a,b) => b.submitTime.localeCompare(a.submitTime));

    const tbody = $('#myLeavesBody');
    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-file-alt"></i><p>暂无申请记录</p></div></td></tr>`;
        return;
    }

    tbody.innerHTML = records.map(r => `
        <tr>
            <td><strong>${r.id}</strong></td>
            <td>${r.type}</td>
            <td>${r.startDate}</td>
            <td>${r.endDate}</td>
            <td>${r.days}天</td>
            <td><span class="status-badge ${getStatusClass(r.status)}">${r.status}</span></td>
            <td>${r.submitTime}</td>
            <td class="actions">
                <button class="btn btn-sm btn-outline" onclick="showDetail('${r.id}')"><i class="fas fa-eye"></i> 详情</button>
                ${r.status==='待审批' ? `<button class="btn btn-sm btn-danger" onclick="cancelLeave('${r.id}')"><i class="fas fa-times"></i> 取消</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function cancelLeave(id) {
    if (!confirm('确认取消该申请吗？')) return;
    const records = DB.get('leave_records', []);
    const idx = records.findIndex(r => r.id === id);
    if (idx >= 0) {
        const r = records[idx];
        // 恢复余额
        const emps = DB.get('leave_employees',[]);
        const empIdx = emps.findIndex(e => e.id === r.employeeId);
        if (empIdx >= 0) {
            if (r.type === '年假') emps[empIdx].leaveBalance = (emps[empIdx].leaveBalance||0) + r.days;
            if (r.type === '调休') emps[empIdx].compLeave = (emps[empIdx].compLeave||0) + r.days;
            DB.set('leave_employees', emps);
        }
        records[idx].status = '已取消';
        records[idx].history.push({ time: now(), action: '申请人取消' });
        DB.set('leave_records', records);
        showToast('申请已取消', 'info');
        loadMyLeaves();
        renderBalanceCards();
    }
}

// ---------- 审批中心 ----------
function canApprove(record) {
    if (currentRole === 'admin') return true;
    if (currentRole === 'manager') {
        // 主管可以审批本部门或自己下属的
        const emps = DB.get('leave_employees',[]);
        const emp = emps.find(e => e.id === record.employeeId);
        return emp && (emp.dept === currentUser.dept || emp.manager === currentUser.id);
    }
    return false;
}

function loadApproveList() {
    const filter = $('#approveFilter').value;
    let records = DB.get('leave_records', []);

    if (filter === 'pending') {
        records = records.filter(r => (r.status==='待审批'||r.status==='审批中') && canApprove(r));
    } else if (filter === 'approved') {
        records = records.filter(r => r.status==='已通过' && canApprove(r));
    } else if (filter === 'rejected') {
        records = records.filter(r => r.status==='已驳回' && canApprove(r));
    } else {
        records = records.filter(r => canApprove(r));
    }

    records.sort((a,b) => b.submitTime.localeCompare(a.submitTime));
    const container = $('#approveList');

    if (records.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-check-double"></i><p>暂无待审批的申请 🎉</p></div>';
        return;
    }

    container.innerHTML = records.map(r => `
        <div class="approve-item">
            <div class="ai-avatar">${r.name.charAt(0)}</div>
            <div class="ai-content">
                <div class="ai-header">
                    <span class="ai-name">${r.name}</span>
                    <span class="ai-dept">${r.dept}</span>
                    <span class="status-badge ${getStatusClass(r.status)}">${r.status}</span>
                    ${r.urgent==='urgent' ? '<span class="status-badge rejected">紧急</span>' : ''}
                </div>
                <div class="ai-desc"><strong>${r.type}</strong> · ${r.startDate} ~ ${r.endDate}（${r.days}天）· ${escapeHtml(r.reason)}</div>
                <div class="ai-meta">
                    <span><i class="fas fa-calendar-plus"></i> ${r.submitTime}</span>
                    <span><i class="fas fa-user-tie"></i> 审批人: ${r.approver}</span>
                </div>
            </div>
            <div class="ai-actions">
                <button class="btn btn-sm btn-outline" onclick="showDetail('${r.id}')"><i class="fas fa-eye"></i></button>
                ${r.status==='待审批'||r.status==='审批中' ? `
                    <button class="btn btn-sm btn-success" onclick="approveLeave('${r.id}',true)"><i class="fas fa-check"></i> 通过</button>
                    <button class="btn btn-sm btn-danger" onclick="approveLeave('${r.id}',false)"><i class="fas fa-times"></i> 驳回</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function approveLeave(id, isApprove) {
    const action = isApprove ? '通过' : '驳回';
    const reason = isApprove ? '' : prompt(`请输入驳回理由：`);
    if (!isApprove && !reason) { showToast('请填写驳回理由', 'warning'); return; }

    const records = DB.get('leave_records', []);
    const idx = records.findIndex(r => r.id === id);
    if (idx >= 0) {
        records[idx].status = isApprove ? '已通过' : '已驳回';
        records[idx].history.push({
            time: now(),
            action: isApprove ? `已通过（审批人：${currentUser.name}）` : `已驳回（审批人：${currentUser.name}，理由：${reason}）`
        });
        DB.set('leave_records', records);
        showToast(`申请已${action}`, isApprove ? 'success' : 'info');
        loadApproveList();
        loadDashboard();
    }
}

// ---------- 详情弹窗 ----------
function showDetail(id) {
    const records = DB.get('leave_records', []);
    const r = records.find(rec => rec.id === id);
    if (!r) return;

    const flowHtml = `
        <div class="approval-flow">
            <div class="flow-step done"><div class="fs-icon"><i class="fas fa-check"></i></div><div class="fs-label">提交申请</div></div>
            <div class="flow-arrow">→</div>
            <div class="flow-step ${r.status==='待审批'?'pending':r.status==='已驳回'?'done':r.status==='已取消'?'pending':'done'}"><div class="fs-icon">${r.status==='已驳回'?'<i class="fas fa-times"></i>':r.status==='已取消'?'<i class="fas fa-ban"></i>':'<i class="fas fa-user-tie"></i>'}</div><div class="fs-label">${r.approver}</div></div>
            <div class="flow-arrow">→</div>
            <div class="flow-step ${r.status==='已通过'?'done':r.status==='已驳回'?'done':'pending'}"><div class="fs-icon">${r.status==='已通过'?'<i class="fas fa-check"></i>':r.status==='已驳回'?'<i class="fas fa-times"></i>':'?'}</div><div class="fs-label">${r.status}</div></div>
        </div>
    `;

    const historyHtml = r.history.map(h => `
        <div style="padding:6px 0;border-bottom:1px solid #F1F5F9;font-size:13px;">
            <span style="color:#94A3B8;font-size:12px;">${h.time}</span> — ${escapeHtml(h.action)}
        </div>
    `).join('');

    $('#detailBody').innerHTML = `
        ${flowHtml}
        <div class="detail-grid">
            <div class="detail-item"><div class="di-label">申请单号</div><div class="di-value">${r.id}</div></div>
            <div class="detail-item"><div class="di-label">请假类型</div><div class="di-value">${r.type}</div></div>
            <div class="detail-item"><div class="di-label">申请人</div><div class="di-value">${r.name}（${r.dept}）</div></div>
            <div class="detail-item"><div class="di-label">请假天数</div><div class="di-value">${r.days} 天（${r.timeRange}）</div></div>
            <div class="detail-item"><div class="di-label">开始日期</div><div class="di-value">${r.startDate}</div></div>
            <div class="detail-item"><div class="di-label">结束日期</div><div class="di-value">${r.endDate}</div></div>
            <div class="detail-item"><div class="di-label">紧急程度</div><div class="di-value">${r.urgent==='urgent'?'<span style="color:#EF4444">紧急</span>':'普通'}</div></div>
            <div class="detail-item"><div class="di-label">审批人</div><div class="di-value">${r.approver}</div></div>
            <div class="detail-item" style="grid-column:1/-1"><div class="di-label">请假事由</div><div class="di-value">${escapeHtml(r.reason)}</div></div>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E2E8F0;">
            <div style="font-weight:600;margin-bottom:8px;font-size:13px;color:#64748B;">审批记录</div>
            ${historyHtml}
        </div>
    `;

    // 底部按钮
    const footer = $('#detailFooter');
    if (r.status === '待审批' || r.status === '审批中') {
        if (canApprove(r)) {
            footer.innerHTML = `
                <button class="btn btn-outline" onclick="closeModal('detailModal')">关闭</button>
                <button class="btn btn-danger" onclick="closeModal('detailModal');approveLeave('${r.id}',false)"><i class="fas fa-times"></i> 驳回</button>
                <button class="btn btn-success" onclick="closeModal('detailModal');approveLeave('${r.id}',true)"><i class="fas fa-check"></i> 通过</button>
            `;
        } else {
            footer.innerHTML = `<button class="btn btn-outline" onclick="closeModal('detailModal')">关闭</button>`;
        }
    } else {
        footer.innerHTML = `<button class="btn btn-outline" onclick="closeModal('detailModal')">关闭</button>`;
    }

    $('#detailModal').classList.add('active');
}

function closeModal(id) { $('#'+id).classList.remove('active'); }

// 点击遮罩关闭
$$('.modal').forEach(m => { m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('active'); }); });

// ---------- 数据统计 ----------
function loadStatistics() {
    const records = DB.get('leave_records', []);
    const employees = DB.get('leave_employees', []);
    const month = new Date().getMonth(), year = new Date().getFullYear();

    const thisMonth = records.filter(r => r.status==='已通过' && new Date(r.startDate).getMonth()===month && new Date(r.startDate).getFullYear()===year).reduce((s,r)=>s+r.days,0);
    const totalEmp = employees.length;
    const avgDays = totalEmp > 0 ? (records.filter(r=>r.status==='已通过').reduce((s,r)=>s+r.days,0) / totalEmp).toFixed(1) : 0;
    const totalSubmitted = records.filter(r=>r.status!=='已取消').length;
    const approvedCount = records.filter(r=>r.status==='已通过').length;
    const approveRate = totalSubmitted > 0 ? Math.round(approvedCount/totalSubmitted*100) : 0;

    $('#statTotalEmployees').textContent = totalEmp;
    $('#statThisMonth').textContent = thisMonth;
    $('#statAvgDays').textContent = avgDays;
    $('#statApproveRate').textContent = approveRate + '%';

    // 部门图表
    renderDeptChart(records);

    // 员工明细表
    const empStats = employees.map(emp => {
        const empRecords = records.filter(r => r.employeeId === emp.id && r.status === '已通过');
        const typeStats = { '年假':0, '调休':0, '事假':0, '病假':0 };
        empRecords.forEach(r => { if (typeStats[r.type]!=null) typeStats[r.type]+=r.days; });
        const total = Object.values(typeStats).reduce((s,v)=>s+v,0);
        return { emp, typeStats, total };
    }).sort((a,b) => b.total - a.total);

    $('#empStatBody').innerHTML = empStats.map(es => `
        <tr>
            <td><strong>${es.emp.name}</strong></td>
            <td>${es.emp.dept}</td>
            <td>${es.typeStats['年假']}</td>
            <td>${es.typeStats['调休']}</td>
            <td>${es.typeStats['事假']}</td>
            <td>${es.typeStats['病假']}</td>
            <td><strong>${es.total}</strong></td>
        </tr>
    `).join('');
}

// ---------- 员工管理 ----------
function loadEmployees() {
    const emps = DB.get('leave_employees', []);
    $('#employeesBody').innerHTML = emps.map(e => `
        <tr>
            <td>${e.id}</td>
            <td><strong>${e.name}</strong></td>
            <td>${e.dept}</td>
            <td>${e.position}</td>
            <td>${e.hireDate}</td>
            <td>${e.leaveBalance||0} 天</td>
            <td>${e.compLeave||0} 天</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="editEmployee('${e.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${e.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function showAddEmployee() { $('#addEmpModal').classList.add('active'); }

function addEmployee() {
    const name = $('#empName').value.trim();
    const dept = $('#empDept').value;
    const pos  = $('#empPosition').value.trim();
    const hire = $('#empHireDate').value;
    if (!name) { showToast('请输入姓名', 'error'); return; }

    const emps = DB.get('leave_employees', []);
    const id = 'E' + String(emps.length+1).padStart(3,'0');
    emps.push({ id, name, dept, position:pos||'员工', hireDate:hire||today(), annualLeave:12, leaveBalance:12, compLeave:5, manager:'E001' });
    DB.set('leave_employees', emps);

    showToast(`员工 ${name} 添加成功`, 'success');
    closeModal('addEmpModal');
    loadEmployees();
    // 清空表单
    $('#empName').value=''; $('#empPosition').value=''; $('#empHireDate').value='';
}

function deleteEmployee(id) {
    if (!confirm('确认删除该员工？')) return;
    let emps = DB.get('leave_employees', []);
    emps = emps.filter(e => e.id !== id);
    DB.set('leave_employees', emps);
    showToast('员工已删除', 'info');
    loadEmployees();
}

function editEmployee(id) { showToast('编辑功能演示版暂未开放', 'warning'); }

// ---------- 数据管理 ----------
function exportData() {
    const data = {
        employees: DB.get('leave_employees',[]),
        records: DB.get('leave_records',[]),
        settings: DB.get('leave_settings',{}),
        exportTime: now()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `请假数据备份_${formatDate(new Date())}.json`;
    a.click();
    showToast('数据导出成功', 'success');
}

function exportExcel() {
    const records = DB.get('leave_records', []);
    const emps = DB.get('leave_employees', []);
    let csv = '\uFEFF申请单号,姓名,部门,类型,开始日期,结束日期,天数,事由,状态,审批人,提交时间\n';
    records.forEach(r => {
        csv += `${r.id},${r.name},${r.dept},${r.type},${r.startDate},${r.endDate},${r.days},"${r.reason}",${r.status},${r.approver},${r.submitTime}\n`;
    });
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `请假记录_${formatDate(new Date())}.csv`;
    a.click();
    showToast('Excel报表导出成功', 'success');
}

function clearAllData() {
    if (!confirm('⚠️ 确认清空所有数据？此操作不可恢复！')) return;
    if (!confirm('再次确认：真的要删除全部数据吗？')) return;
    localStorage.removeItem('leave_employees');
    localStorage.removeItem('leave_records');
    localStorage.removeItem('leave_currentUser');
    localStorage.removeItem('leave_settings');
    showToast('数据已清空，即将重新初始化...', 'info');
    setTimeout(() => { location.reload(); }, 1500);
}

// ---------- 键盘快捷键 ----------
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.modal').forEach(m => m.classList.remove('active'));
});

// ---------- 启动 ----------
seedData();

// 如果已登录则直接进入
if (currentUser) {
    $('#loginPage').classList.remove('active');
    $('#mainPage').classList.add('active');
    if (currentRole === 'admin') { $('#navApprove').style.display='flex'; $('#navEmployees').style.display='flex'; }
    else if (currentRole === 'manager') { $('#navApprove').style.display='flex'; }
    initApp();
}
