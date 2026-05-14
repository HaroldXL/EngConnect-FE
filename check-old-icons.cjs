const fs = require('fs');
const path = require('path');

function walkSync(dir, exts) {
  const results = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) results.push(...walkSync(full, exts));
    else if (exts.some(e => full.endsWith(e))) results.push(full);
  }
  return results;
}

const oldNames = [
  'ArrowBendDownRightIcon','ArrowCounterClockwise','ArrowSquareOut','ArrowsLeftRight',
  'Bank','BellSlash','BookBookmarkIcon','BookOpen','BookOpenIcon','BookOpenUser',
  'CalendarBlank','CalendarCheck','CalendarDots','CaretDown','CaretLeft','CaretRight','CaretUp',
  'Certificate','ChalkboardSimple','ChalkboardTeacher','ChartLine','ChatCircle',
  'ChatCircleDots','ChatTeardropText','ChevronRight','CircleNotch','ClipboardText',
  'ClockCountdown','ClockCounterClockwise','CloudArrowUp','CreditCard','CurrencyDollar',
  'DotsThree','DownloadSimple','Ear','Envelope','EnvelopeSimple','Exam',
  'EyeOff','FileArrowDown','FileDoc','FileImage','FilePdf','FileText','FileZip',
  'Files','FloppyDisk','Folders','FunnelSimple','GlobeHemisphereWest',
  'GraduationCap','GraduationCapIcon','Handshake','Headset','HelpCircle',
  'HourglassMedium','IdentificationCard','Lightbulb','ListNumbers','Loader','Loader2',
  'LogOut','MagnifyingGlass','MagnifyingGlassIcon','Megaphone','MicrophoneSlash',
  'MonitorArrowUp','MonitorPlay','MoveRight','NoteIcon','NotePencil','PaperPlaneTilt',
  'PencilSimple','Percent','PhoneDisconnect','PresentationChart','Prohibit','Question',
  'Receipt','SealCheck','ShoppingCart','SignOut','Sparkles',
  'SpinnerGap','SquaresFour','Student','Timer','TrendDown','TrendUp',
  'Trophy','UserCircle','UserCircleGear','UsersThree','VideoCamera',
  'VideoCameraSlash','Wallet','Warning','WarningCircle','WifiHigh','WifiSlash',
  'XCircle','Lock','HelpCircle','Briefcase','Video','X','Send','Tag','ShieldCheck',
];

const oldNamesSet = new Set(oldNames);
const files = walkSync('src', ['.jsx', '.tsx']);
const issues = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');

  // Collect all imported names
  const importedNames = new Set();
  const importBlocks = [...content.matchAll(/import\s+(?:[^;'"]*?)from\s*["'][^"']+["']\s*;?/gs)];
  for (const match of importBlocks) {
    const block = match[0];
    const braces = block.match(/\{([^}]+)\}/);
    if (braces) {
      for (const part of braces[1].split(',')) {
        const trimmed = part.trim();
        const asMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
        if (asMatch) { importedNames.add(asMatch[1]); importedNames.add(asMatch[2]); }
        else if (/^\w+$/.test(trimmed)) importedNames.add(trimmed);
      }
    }
  }

  const foundOld = [];
  for (const name of oldNamesSet) {
    if (!importedNames.has(name)) {
      const regex = new RegExp('\\b' + name + '\\b');
      if (regex.test(content)) {
        foundOld.push(name);
      }
    }
  }

  if (foundOld.length > 0) {
    const fp = f.split(path.sep).join('/');
    issues.push(fp + ': ' + foundOld.join(', '));
  }
}

if (issues.length === 0) {
  console.log('All clean!');
} else {
  issues.forEach(function(i) { console.log(i); });
}
