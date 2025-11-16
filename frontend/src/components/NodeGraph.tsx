import { ProcessNode } from './ProcessNode';
import { ArrowDown, GitBranch } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Node {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  wittyRemark: string;
  details?: string;
  children?: Node[];
}

interface NodeGraphProps {
  nodes: Node[];
}

function NodeConnector({ type = 'single' }: { type?: 'single' | 'branch' }) {
  if (type === 'branch') {
    return (
      <div className="flex items-center gap-2 my-2 ml-1.5">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 rounded-full">
          <GitBranch className="w-4 h-4 text-purple-600" />
          <span className="text-xs text-purple-700">Parallel Execution</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex justify-start ml-1.5 my-2">
      <div className="flex flex-col items-center">
        <div className="w-0.5 h-4 bg-gradient-to-b from-blue-400 to-blue-500"></div>
        <ArrowDown className="w-4 h-4 text-blue-500 animate-bounce" style={{ animationDuration: '2s' }} />
        <div className="w-0.5 h-4 bg-gradient-to-b from-blue-500 to-blue-400"></div>
      </div>
    </div>
  );
}

function renderNode(node: Node, level = 0) {
  const hasChildren = node.children && node.children.length > 0;
  const hasBranch = node.children && node.children.length > 1;
  
  return (
    <div key={node.id} style={{ marginLeft: level > 0 ? '40px' : '0' }} className="animate-fadeIn">
      <ProcessNode
        id={node.id}
        label={node.label}
        status={node.status}
        wittyRemark={node.wittyRemark}
        details={node.details}
      />
      
      {hasChildren && (
        <>
          {hasBranch && <NodeConnector type="branch" />}
          {node.children!.map((child, index) => (
            <div key={child.id}>
              {index > 0 || !hasBranch ? <NodeConnector /> : null}
              {renderNode(child, level + 1)}
            </div>
          ))}
        </>
      )}
      {hasChildren && !hasBranch && <NodeConnector />}
    </div>
  );
}

export function NodeGraph({ nodes }: NodeGraphProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && contentRef.current) {
      scrollRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [nodes]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mb-6 pb-4 border-b-2 border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <h2 className="text-base text-gray-800">Processing Pipeline</h2>
        </div>
        <div className="text-xs text-gray-500">Real-time node execution visualization</div>
      </div>
      
      <div ref={contentRef} className="space-y-1 relative">
        {/* Vertical guide line */}
        <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-blue-200 to-transparent opacity-30"></div>
        
        {nodes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-400">Waiting for assessment to begin...</p>
          </div>
        ) : (
          nodes.map(node => renderNode(node))
        )}
      </div>
    </div>
  );
}