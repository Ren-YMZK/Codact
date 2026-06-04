'use client'

import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1e1e1e] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin" />
    </div>
  ),
})

interface CodeEditorProps {
  value: string
  language: string
  onChange: (value: string) => void
}

export default function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={value}
      onChange={(val) => onChange(val ?? '')}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        tabSize: 4,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  )
}
