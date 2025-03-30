import React from 'react';
import { Code, Copy, Save } from 'lucide-react';

interface ScriptEditorProps {
  code: string;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ code }) => {
  return (
    <div className="border-r border-gray-700 flex flex-col h-full">
      <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <Code size={16} className="mr-2 text-blue-400" />
          <span className="font-medium">Code Editor</span>
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-1 hover:bg-gray-700 rounded">
            <Copy size={16} />
          </button>
          <button className="p-1 hover:bg-gray-700 rounded">
            <Save size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-gray-850 font-mono">
        <pre className="text-sm whitespace-pre-wrap">
          <span className="text-gray-400">' Create a SIZERANGE variable</span>
          <br />
          <span className="text-blue-400">If</span> ([SQUAREFEET] &lt; 1500) <span className="text-blue-400">Then</span>
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">Return</span> <span className="text-green-400">"Small"</span>
          <br />
          <span className="text-blue-400">ElseIf</span> ([SQUAREFEET] &gt;= 1500 <span className="text-blue-400">And</span> [SQUAREFEET] &lt; 2500) <span className="text-blue-400">Then</span>
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">Return</span> <span className="text-green-400">"Medium"</span>
          <br />
          <span className="text-blue-400">ElseIf</span> ([SQUAREFEET] &gt;= 2500 <span className="text-blue-400">And</span> [SQUAREFEET] &lt; 3500) <span className="text-blue-400">Then</span>
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">Return</span> <span className="text-green-400">"Large"</span>
          <br />
          <span className="text-blue-400">Else</span>
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">Return</span> <span className="text-green-400">"Very Large"</span>
          <br />
          <span className="text-blue-400">End If</span>
        </pre>
      </div>
    </div>
  );
};

export default ScriptEditor;
