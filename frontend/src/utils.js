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

/* Relative time from a ms timestamp: JUST NOW / 5M AGO / 3H AGO / 2D AGO. */
export function timeAgo(ms){
  if(!ms) return ''
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if(s < 60) return 'JUST NOW'
  const m = Math.floor(s / 60)
  if(m < 60) return `${m}M AGO`
  const h = Math.floor(m / 60)
  if(h < 24) return `${h}H AGO`
  const d = Math.floor(h / 24)
  return `${d}D AGO`
}

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

/* ------------------------------------------------------------------------ */
/* Minimal dependency-free ZIP (STORE method, no compression). Photos/videos  */
/* are already compressed so STORE is lossless and fast. Used by the admin's  */
/* "DOWNLOAD ALBUM AS ZIP".                                                   */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++){
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c >>> 0
  }
  return t
})()

function crc32(buf){
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

/* files: [{ name: string, data: Uint8Array }] -> Blob (application/zip) */
export function zipStore(files){
  const enc = new TextEncoder()
  const localChunks = []
  const central = []
  let offset = 0
  const dosTime = 0
  const dosDate = 0x21 // 1980-01-01 (valid minimum DOS date)

  for (const f of files){
    const nameBytes = enc.encode(f.name)
    const data = f.data
    const size = data.length
    const crc = crc32(data)

    const local = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)   // local file header signature
    lv.setUint16(4, 20, true)           // version needed
    lv.setUint16(6, 0, true)            // flags
    lv.setUint16(8, 0, true)            // method: 0 = STORE
    lv.setUint16(10, dosTime, true)
    lv.setUint16(12, dosDate, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, size, true)        // compressed size
    lv.setUint32(22, size, true)        // uncompressed size
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true)           // extra length
    local.set(nameBytes, 30)
    localChunks.push(local, data)

    const cd = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(cd.buffer)
    cv.setUint32(0, 0x02014b50, true)   // central directory signature
    cv.setUint16(4, 20, true)           // version made by
    cv.setUint16(6, 20, true)           // version needed
    cv.setUint16(8, 0, true)            // flags
    cv.setUint16(10, 0, true)           // method
    cv.setUint16(12, dosTime, true)
    cv.setUint16(14, dosDate, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, size, true)
    cv.setUint32(24, size, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true)           // extra length
    cv.setUint16(32, 0, true)           // comment length
    cv.setUint16(34, 0, true)           // disk number start
    cv.setUint16(36, 0, true)           // internal attrs
    cv.setUint32(38, 0, true)           // external attrs
    cv.setUint32(42, offset, true)      // local header offset
    cd.set(nameBytes, 46)
    central.push(cd)

    offset += local.length + size
  }

  const centralSize = central.reduce((s, c) => s + c.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)     // end of central directory signature
  ev.setUint16(4, 0, true)              // disk number
  ev.setUint16(6, 0, true)              // disk with cd
  ev.setUint16(8, files.length, true)   // entries on this disk
  ev.setUint16(10, files.length, true)  // total entries
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)        // cd offset
  ev.setUint16(20, 0, true)             // comment length

  return new Blob([...localChunks, ...central, end], { type: 'application/zip' })
}