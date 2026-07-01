import React from 'react';
import EditorModule from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';

// react-simple-code-editor has a double-default export issue in ESM bundlers
const Editor = (EditorModule as unknown as { default: typeof EditorModule }).default ?? EditorModule;

interface TerminalEditorProps {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
}

const TerminalEditor: React.FC<TerminalEditorProps> = ({ code, onChange, readOnly = false }) => {
  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden border border-[#00ff41]/20 shadow-[0_0_15px_rgba(0,255,65,0.1)]">
      {/* Terminal Chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border-b border-[#00ff41]/10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="ml-3 text-xs text-gray-500 font-mono tracking-wider">
          IAM Policy Editor
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
          <span className="text-[10px] text-[#00ff41]/60 font-mono">LIVE</span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-auto bg-[#0a0a0f]">
        <Editor
          value={code}
          onValueChange={onChange}
          highlight={(c) => Prism.highlight(c, Prism.languages.json, 'json')}
          padding={16}
          readOnly={readOnly}
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
            fontSize: 14,
            lineHeight: '1.6',
            minHeight: '100%',
          }}
          className="terminal-editor-area"
          textareaClassName="outline-none"
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-t border-[#00ff41]/10 text-[10px] text-gray-600 font-mono">
        <span>JSON</span>
        <span>{code.split('\n').length} lines</span>
        <span>{readOnly ? '🔒 Read Only' : '✏️ Editable'}</span>
      </div>
    </div>
  );
};

export default TerminalEditor;
