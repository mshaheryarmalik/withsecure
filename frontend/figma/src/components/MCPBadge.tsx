export function MCPBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm text-gray-600">MCP Connected</span>
    </div>
  );
}
