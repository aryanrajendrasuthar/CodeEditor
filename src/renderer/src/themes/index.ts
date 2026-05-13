import type * as Monaco from 'monaco-editor';

export const THEMES: Record<string, { label: string; monacoTheme: string; isCustom?: boolean }> = {
  'vs-dark': { label: 'VS Dark', monacoTheme: 'vs-dark' },
  'vs': { label: 'VS Light', monacoTheme: 'vs' },
  'hc-black': { label: 'High Contrast', monacoTheme: 'hc-black' },
  'monokai': { label: 'Monokai', monacoTheme: 'monokai', isCustom: true },
  'github-dark': { label: 'GitHub Dark', monacoTheme: 'github-dark', isCustom: true },
  'catppuccin': { label: 'Catppuccin Mocha', monacoTheme: 'catppuccin', isCustom: true }
};

export const monokaiTheme: Monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'F92672' },
    { token: 'string', foreground: 'E6DB74' },
    { token: 'number', foreground: 'AE81FF' },
    { token: 'type', foreground: '66D9EF', fontStyle: 'italic' },
    { token: 'class', foreground: 'A6E22E' },
    { token: 'function', foreground: 'A6E22E' },
    { token: 'variable', foreground: 'F8F8F2' },
    { token: 'operator', foreground: 'F92672' },
    { token: 'delimiter', foreground: 'F8F8F2' },
    { token: 'tag', foreground: 'F92672' },
    { token: 'attribute.name', foreground: 'A6E22E' },
    { token: 'attribute.value', foreground: 'E6DB74' }
  ],
  colors: {
    'editor.background': '#272822',
    'editor.foreground': '#F8F8F2',
    'editor.lineHighlightBackground': '#3E3D32',
    'editor.selectionBackground': '#49483E',
    'editorCursor.foreground': '#F8F8F0',
    'editorWhitespace.foreground': '#3B3A32',
    'editorLineNumber.foreground': '#90908A',
    'editorLineNumber.activeForeground': '#F8F8F2',
    'editor.findMatchBackground': '#FFE792',
    'editor.findMatchHighlightBackground': '#FFE79280'
  }
};

export const githubDarkTheme: Monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'FF7B72' },
    { token: 'string', foreground: 'A5D6FF' },
    { token: 'number', foreground: '79C0FF' },
    { token: 'type', foreground: 'FFA657' },
    { token: 'class', foreground: 'FFA657' },
    { token: 'function', foreground: 'D2A8FF' },
    { token: 'variable', foreground: 'E6EDF3' },
    { token: 'operator', foreground: 'FF7B72' },
    { token: 'tag', foreground: '7EE787' },
    { token: 'attribute.name', foreground: '79C0FF' },
    { token: 'attribute.value', foreground: 'A5D6FF' }
  ],
  colors: {
    'editor.background': '#0D1117',
    'editor.foreground': '#E6EDF3',
    'editor.lineHighlightBackground': '#161B22',
    'editor.selectionBackground': '#264F78',
    'editorCursor.foreground': '#58A6FF',
    'editorLineNumber.foreground': '#6E7681',
    'editorLineNumber.activeForeground': '#E6EDF3',
    'editor.findMatchBackground': '#F2CC60',
    'editor.findMatchHighlightBackground': '#F2CC6040'
  }
};

export const catppuccinTheme: Monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6C7086', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'CBA6F7' },
    { token: 'string', foreground: 'A6E3A1' },
    { token: 'number', foreground: 'FAB387' },
    { token: 'type', foreground: '89B4FA' },
    { token: 'class', foreground: 'F9E2AF' },
    { token: 'function', foreground: '89DCEB' },
    { token: 'variable', foreground: 'CDD6F4' },
    { token: 'operator', foreground: 'F38BA8' }
  ],
  colors: {
    'editor.background': '#1E1E2E',
    'editor.foreground': '#CDD6F4',
    'editor.lineHighlightBackground': '#313244',
    'editor.selectionBackground': '#45475A',
    'editorCursor.foreground': '#F5C2E7',
    'editorLineNumber.foreground': '#6C7086',
    'editorLineNumber.activeForeground': '#CDD6F4',
    'editor.findMatchBackground': '#F9E2AF',
    'editor.findMatchHighlightBackground': '#F9E2AF40'
  }
};

export function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    py: 'python',
    java: 'java',
    c: 'c', h: 'c',
    cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    html: 'html', htm: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml', yml: 'yaml',
    md: 'markdown', mdx: 'markdown',
    sh: 'shell', bash: 'shell', zsh: 'shell',
    sql: 'sql',
    dockerfile: 'dockerfile',
    toml: 'toml',
    graphql: 'graphql',
    vue: 'vue'
  };
  return map[ext] || 'plaintext';
}

export function getFileIcon(name: string, isDir: boolean): string {
  if (isDir) return '📁';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const icons: Record<string, string> = {
    ts: '🔷', tsx: '⚛️', js: '🟨', jsx: '⚛️',
    py: '🐍', java: '☕', c: '🔵', cpp: '🔵', cs: '🟣',
    go: '🐹', rs: '🦀', rb: '💎', php: '🐘', swift: '🍎',
    kt: '🎯', html: '🌐', css: '🎨', scss: '🎨', less: '🎨',
    json: '📋', xml: '📋', yaml: '📋', yml: '📋',
    md: '📝', mdx: '📝', sh: '⚡', bash: '⚡',
    sql: '🗄️', dockerfile: '🐳',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️',
    pdf: '📄', zip: '📦', tar: '📦', gz: '📦'
  };
  return icons[ext] || '📄';
}
