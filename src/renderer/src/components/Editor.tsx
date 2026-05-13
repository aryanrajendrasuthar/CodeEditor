import React, { useRef, useEffect, useCallback } from 'react';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import type { Tab, EditorSettings } from '../types';
import { monokaiTheme, githubDarkTheme, catppuccinTheme } from '../themes';

interface EditorProps {
  tab: Tab;
  settings: EditorSettings;
  onContentChange: (tabId: string, content: string) => void;
  onCursorChange: (tabId: string, line: number, column: number) => void;
}

export const Editor: React.FC<EditorProps> = ({
  tab, settings, onContentChange, onCursorChange
}) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const tabIdRef = useRef(tab.id);
  tabIdRef.current = tab.id;

  // Register custom themes once Monaco is loaded
  useEffect(() => {
    if (!monaco) return;
    monaco.editor.defineTheme('monokai', monokaiTheme as any);
    monaco.editor.defineTheme('github-dark', githubDarkTheme as any);
    monaco.editor.defineTheme('catppuccin', catppuccinTheme as any);
  }, [monaco]);

  // Switch theme when settings change
  useEffect(() => {
    if (!monaco) return;
    monaco.editor.setTheme(settings.theme);
  }, [monaco, settings.theme]);

  const handleEditorMount = useCallback((editor: any, monacoInstance: any) => {
    editorRef.current = editor;

    // Register custom themes
    monacoInstance.editor.defineTheme('monokai', monokaiTheme as any);
    monacoInstance.editor.defineTheme('github-dark', githubDarkTheme as any);
    monacoInstance.editor.defineTheme('catppuccin', catppuccinTheme as any);
    monacoInstance.editor.setTheme(settings.theme);

    // Cursor position listener
    editor.onDidChangeCursorPosition((e: any) => {
      const { lineNumber, column } = e.position;
      onCursorChange(tabIdRef.current, lineNumber, column);
    });

    // TypeScript / JavaScript IntelliSense settings
    monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monacoInstance.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monacoInstance.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monacoInstance.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    });

    monacoInstance.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });

    // JSON schema validation
    monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false
    });

    // Focus the editor
    editor.focus();
  }, [settings.theme, onCursorChange]);

  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onContentChange(tabIdRef.current, value);
    }
  }, [onContentChange]);

  return (
    <MonacoEditor
      key={tab.id}
      height="100%"
      language={tab.language}
      value={tab.content}
      theme={settings.theme}
      onChange={handleChange}
      onMount={handleEditorMount}
      options={{
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        fontLigatures: true,
        lineNumbers: 'on',
        minimap: { enabled: settings.minimap },
        scrollBeyondLastLine: false,
        wordWrap: settings.wordWrap as any,
        tabSize: settings.tabSize,
        insertSpaces: true,
        autoIndent: 'full',
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        quickSuggestions: { other: true, comments: false, strings: false },
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        renderLineHighlight: 'line',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        mouseWheelZoom: true,
        contextmenu: true,
        copyWithSyntaxHighlighting: true,
        padding: { top: 8, bottom: 8 },
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
          alwaysConsumeMouseWheel: false
        },
        renderValidationDecorations: 'on',
        stickyScroll: { enabled: true },
        inlineSuggest: { enabled: true }
      }}
    />
  );
};
