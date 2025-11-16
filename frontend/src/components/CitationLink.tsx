interface CitationLinkProps {
  number: number;
  url: string;
}

export function CitationLink({ number, url }: CitationLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center w-5 h-5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
      title={url}
    >
      [{number}]
    </a>
  );
}
