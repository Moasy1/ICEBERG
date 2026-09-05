/**
 * ICEBERG Daily Planner & Time-Blocking Engine
 * Side-by-side view of Habits, Scratchpad, Task Drawer, and 24h Hourly Time-Block Grid
 */

window.DailyPlannerState = {
  currentDate: new Date().toISOString().split('T')[0],
  planner: null,
  dueTasks: [],
  scratchpadTimer: null
};

// Initialize Daily Planner view
async function initDailyPlanner(targetDate) {
  if (targetDate) {
    window.DailyPlannerState.currentDate = targetDate;
  }
  const dateStr = window.DailyPlannerState.currentDate;
  const dateDisplay = document.getElementById('planner-date-display');
  if (dateDisplay) {
    const d = new Date(dateStr + 'T00:00:00');
    dateDisplay.innerText = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }

  await loadDailyPlannerData(dateStr);
}

// Fetch planner data for date
async function loadDailyPlannerData(dateStr) {
  try {
    const res = await fetch(`/api/iams/planner/today?date=${dateStr}`, {
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    const result = await res.json();
    if (result.success) {
      window.DailyPlannerState.planner = result.data.planner;
      window.DailyPlannerState.dueTasks = result.data.due_tasks || [];
      renderDailyPlannerUI();
    }
  } catch (err) {
    console.error('Failed to load daily planner data:', err);
  }
}

// Change planner date
function changePlannerDate(offsetDays) {
  const cur = new Date(window.DailyPlannerState.currentDate + 'T00:00:00');
  cur.setDate(cur.getDate() + offsetDays);
  const nextDateStr = cur.toISOString().split('T')[0];
  window.DailyPlannerState.currentDate = nextDateStr;
  initDailyPlanner(nextDateStr);
}

// Render complete planner UI
function renderDailyPlannerUI() {
  const p = window.DailyPlannerState.planner;
  if (!p) return;

  // 1. Habits List
  renderHabitsList(p.habits || []);

  // 2. Scratchpad
  const scratchpadEl = document.getElementById('planner-scratchpad');
  if (scratchpadEl && document.activeElement !== scratchpadEl) {
    scratchpadEl.value = p.scratchpad || '';
  }

  // 3. Time Blocks Grid
  renderTimeBlocksGrid(p.time_blocks || []);

  // 4. Due & Backlog Tasks Drawer
  renderPlannerTasksDrawer(window.DailyPlannerState.dueTasks || []);

  // 5. Reflection Notes
  const reflNoteEl = document.getElementById('planner-reflection-note');
  const reflScoreEl = document.getElementById('planner-reflection-score');
  if (reflNoteEl && document.activeElement !== reflNoteEl) {
    reflNoteEl.value = p.reflection_note || '';
  }
  if (reflScoreEl) {
    reflScoreEl.value = p.productivity_score || 5;
  }
}

// Render Habits
function renderHabitsList(habits) {
  const container = document.getElementById('planner-habits-container');
  const countBadge = document.getElementById('planner-habits-progress');
  if (!container) return;

  const completedCount = habits.filter(h => h.completed).length;
  const pct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
  if (countBadge) {
    countBadge.innerText = `${completedCount}/${habits.length} (${pct}%)`;
  }

  if (habits.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-3 text-center">No habits added for today yet.</div>`;
    return;
  }

  container.innerHTML = habits.map(h => `
    <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all ${h.completed ? 'opacity-60' : ''}">
      <div class="flex items-center gap-3">
        <button onclick="toggleHabit('${h.habit_id}')" class="w-5 h-5 rounded-lg border ${h.completed ? 'bg-emerald-500 border-emerald-400 text-slate-950 flex items-center justify-center font-bold text-xs' : 'border-slate-600 hover:border-cyan-400'} transition-all">
          ${h.completed ? '✓' : ''}
        </button>
        <span class="text-xs font-medium ${h.completed ? 'line-through text-slate-500' : 'text-slate-200'}">${escapeHtml(h.title)}</span>
      </div>
      ${h.target_time ? `<span class="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/50">${h.target_time}</span>` : ''}
    </div>
  `).join('');
}

// Toggle habit completion
async function toggleHabit(habitId) {
  try {
    const res = await fetch('/api/iams/planner/habits/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        date: window.DailyPlannerState.currentDate,
        habit_id: habitId
      })
    });
    const result = await res.json();
    if (result.success) {
      window.DailyPlannerState.planner.habits = result.data;
      renderHabitsList(result.data);
    }
  } catch (err) {
    console.error('Failed to toggle habit:', err);
  }
}

// Add new habit
async function addNewHabit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('new-habit-title');
  const timeInput = document.getElementById('new-habit-time');
  if (!input || !input.value.trim()) return;

  try {
    const res = await fetch('/api/iams/planner/habits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        date: window.DailyPlannerState.currentDate,
        title: input.value.trim(),
        target_time: timeInput ? timeInput.value : null
      })
    });
    const result = await res.json();
    if (result.success) {
      window.DailyPlannerState.planner.habits = result.data;
      renderHabitsList(result.data);
      input.value = '';
    }
  } catch (err) {
    console.error('Failed to add habit:', err);
  }
}

// Debounced Scratchpad autosave
function handleScratchpadInput(val) {
  const statusBadge = document.getElementById('scratchpad-save-status');
  if (statusBadge) {
    statusBadge.innerText = 'Saving...';
    statusBadge.className = 'text-[10px] text-amber-400 font-mono';
  }

  clearTimeout(window.DailyPlannerState.scratchpadTimer);
  window.DailyPlannerState.scratchpadTimer = setTimeout(async () => {
    try {
      await fetch('/api/iams/planner/scratchpad', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-admin': 'true',
          'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
        },
        body: JSON.stringify({
          date: window.DailyPlannerState.currentDate,
          scratchpad: val
        })
      });
      if (statusBadge) {
        statusBadge.innerText = 'All changes saved';
        statusBadge.className = 'text-[10px] text-emerald-400 font-mono';
      }
    } catch (e) {
      if (statusBadge) {
        statusBadge.innerText = 'Failed to save';
        statusBadge.className = 'text-[10px] text-rose-400 font-mono';
      }
    }
  }, 600);
}

// Render 24-Hour Time Blocks Grid (from 08:00 to 22:00 default display, scalable to 24h)
function renderTimeBlocksGrid(blocks) {
  const container = document.getElementById('planner-timegrid-slots');
  if (!container) return;

  const hours = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  container.innerHTML = hours.map(hour => {
    // Find blocks that fall in this hour
    const matchingBlocks = blocks.filter(b => b.start_time && b.start_time.startsWith(hour.substring(0, 2)));

    return `
      <div class="flex items-start gap-4 border-b border-slate-800/60 py-2.5 group hover:bg-slate-900/30 transition-colors"
           ondragover="handleTimeSlotDragOver(event)"
           ondrop="handleTimeSlotDrop(event, '${hour}')">
        <div class="w-14 shrink-0 text-right text-xs font-mono font-semibold text-slate-500 pt-1">${hour}</div>
        <div class="flex-1 min-h-[36px] flex flex-wrap gap-2 items-center">
          ${matchingBlocks.map(b => `
            <div class="relative group/card flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all transform hover:-translate-y-0.5"
                 style="background-color: ${b.color ? b.color + '15' : '#06b6d415'}; border-color: ${b.color || '#06b6d4'}; color: #fff;">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" style="background-color: ${b.color || '#06b6d4'};"></span>
                <span>${escapeHtml(b.title)}</span>
                <span class="text-[10px] text-slate-400 font-mono">(${b.duration_minutes}m)</span>
              </div>
              <button onclick="removeTimeBlock('${b.block_id}')" class="opacity-0 group-hover/card:opacity-100 ml-3 text-slate-400 hover:text-rose-400 transition-opacity">
                ✕
              </button>
            </div>
          `).join('')}
          <button onclick="openScheduleSlotModal('${hour}')" class="opacity-0 group-hover:opacity-100 text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-slate-700 hover:border-cyan-500 transition-all">
            + Schedule Block
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Drag & Drop handlers for Time-blocking
function handleTaskDragStart(event, taskId, taskTitle) {
  event.dataTransfer.setData('text/plain', JSON.stringify({ taskId, taskTitle }));
  event.dataTransfer.effectAllowed = 'copy';
}

function handleTimeSlotDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
}

async function handleTimeSlotDrop(event, slotHour) {
  event.preventDefault();
  const rawData = event.dataTransfer.getData('text/plain');
  if (!rawData) return;

  try {
    const data = JSON.parse(rawData);
    await scheduleTimeBlock({
      title: data.taskTitle,
      task_id: data.taskId,
      start_time: slotHour,
      duration_minutes: 60,
      color: '#06b6d4'
    });
  } catch (e) {
    console.error('Invalid task drag data', e);
  }
}

// Schedule Time Block API call
async function scheduleTimeBlock(blockData) {
  try {
    const res = await fetch('/api/iams/planner/time-blocks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        date: window.DailyPlannerState.currentDate,
        ...blockData
      })
    });
    const result = await res.json();
    if (result.success) {
      window.DailyPlannerState.planner.time_blocks = result.data;
      renderTimeBlocksGrid(result.data);
    }
  } catch (err) {
    console.error('Failed to schedule block:', err);
  }
}

// Remove Time Block
async function removeTimeBlock(blockId) {
  try {
    const res = await fetch(`/api/iams/planner/time-blocks/${blockId}?date=${window.DailyPlannerState.currentDate}`, {
      method: 'DELETE',
      headers: {
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      }
    });
    const result = await res.json();
    if (result.success) {
      window.DailyPlannerState.planner.time_blocks = result.data;
      renderTimeBlocksGrid(result.data);
    }
  } catch (err) {
    console.error('Failed to remove block:', err);
  }
}

// Render Tasks Drawer
function renderPlannerTasksDrawer(tasks) {
  const container = document.getElementById('planner-tasks-drawer');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-4 text-center">No pending tasks for today. Drag or add a task to plan!</div>`;
    return;
  }

  container.innerHTML = tasks.map(t => `
    <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 cursor-grab transition-all group"
         draggable="true"
         ondragstart="handleTaskDragStart(event, '${t.task_id}', '${escapeHtml(t.title)}')">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">${escapeHtml(t.title)}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded font-mono ${t.priority === 'HIGH' || t.priority === 'URGENT' ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50' : 'bg-slate-800 text-slate-400'}">${t.priority}</span>
      </div>
      <div class="flex items-center justify-between text-[10px] text-slate-400">
        <span>${t.status}</span>
        <span class="text-cyan-400 font-mono">Drag to grid ➔</span>
      </div>
    </div>
  `).join('');
}

// Save Daily Retrospective Reflection
async function saveDailyReflection() {
  const note = document.getElementById('planner-reflection-note')?.value || '';
  const score = parseInt(document.getElementById('planner-reflection-score')?.value || '5', 10);

  try {
    const res = await fetch('/api/iams/planner/reflection', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-admin': 'true',
        'Authorization': `Bearer ${(sessionStorage.getItem('iceberg_jwt') || localStorage.getItem('token') || localStorage.getItem('iceberg_jwt') || '')}`
      },
      body: JSON.stringify({
        date: window.DailyPlannerState.currentDate,
        reflection_note: note,
        productivity_score: score
      })
    });
    const result = await res.json();
    if (result.success) {
      alert('Daily retrospective journal saved!');
    }
  } catch (err) {
    console.error('Failed to save reflection:', err);
  }
}

// Helper escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.initDailyPlanner = initDailyPlanner;
window.changePlannerDate = changePlannerDate;
window.toggleHabit = toggleHabit;
window.addNewHabit = addNewHabit;
window.handleScratchpadInput = handleScratchpadInput;
window.handleTaskDragStart = handleTaskDragStart;
window.handleTimeSlotDragOver = handleTimeSlotDragOver;
window.handleTimeSlotDrop = handleTimeSlotDrop;
window.scheduleTimeBlock = scheduleTimeBlock;
window.removeTimeBlock = removeTimeBlock;
window.saveDailyReflection = saveDailyReflection;
