/* Small pure helpers shared across the UI. */

export function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]))
}

/* Safe size formatting: KB for small files, then MB/GB. Guards against
   undefined/NaN (the "admin black screen" bug). Returns "—" for nothing. */
export function formatBytes(bytes){
  if(bytes == null || isNaN(bytes) || bytes <= 0) return '—'
  if(bytes < 1024) return Math.round(bytes) + ' B'
  if(bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if(bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(2) + ' GB'
}

export function mb(bytes){ return ((bytes || 0) / 1048576).toFixed(1) }

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

/* Supports MM-DD, YYYY-MM-DD, MM/DD. Returns {month, day} or null. */
export function parseBirthday(str){
  if(!str) return null
  const s = String(str).trim()
  if(s.includes('-')){
    const parts = s.split('-')
    if(parts.length === 3){ const mo = +parts[1], d = +parts[2]; if(mo && d) return { month:mo, day:d } }
    else if(parts.length === 2){ const mo = +parts[0], d = +parts[1]; if(mo && d) return { month:mo, day:d } }
  }
  if(s.includes('/')){ const p = s.split('/'); const mo = +p[0], d = +p[1]; if(mo && d) return { month:mo, day:d } }
  return null
}

/* Days until next occurrence (0 = today). */
export function daysUntilBirthday(str){
  const b = parseBirthday(str)
  if(!b) return null
  const now = new Date(); now.setHours(0,0,0,0)
  let next = new Date(now.getFullYear(), b.month - 1, b.day)
  if(next < now) next = new Date(now.getFullYear() + 1, b.month - 1, b.day)
  return Math.round((next - now) / 86400000)
}

export function bdayLabel(str){
  const b = parseBirthday(str)
  return b ? `${MONTHS[b.month - 1]} ${b.day}` : (str || '')
}

export function bdayInfo(m){
  const d = daysUntilBirthday(m.birthday)
  if(d === null) return { text:'NO BIRTHDAY SET', isToday:false, days:null }
  if(d === 0) return { text:"🎉 TODAY • HAPPY BIRTHDAY", isToday:true, days:0 }
  if(d <= 7) return { text:`BIRTHDAY IN ${d} DAYS • ${bdayLabel(m.birthday)}`, isToday:false, days:d }
  return { text:`BIRTHDAY • ${bdayLabel(m.birthday)}`, isToday:false, days:d }
}

/* Derive a member id from a name: lowercase, spaces → underscores. */
export function slugId(name){
  return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

const AVATAR_COLORS = ['#6366F1','#06B6D4','#EC4899','#F59E0B','#8B5CF6','#14B8A6','#FF6B8A','#10B981']
export function colorFor(id){
  let h = 0
  for(let i = 0; i < String(id).length; i++) h = (h * 31 + String(id).charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}