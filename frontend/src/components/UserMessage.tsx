interface UserMessageProps {
  text: string;
}

export function UserMessage({ text }: UserMessageProps) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[70%] px-4 py-3 bg-[#EFF6FF] text-gray-800 rounded-2xl rounded-tr-sm">
        {text}
      </div>
    </div>
  );
}
