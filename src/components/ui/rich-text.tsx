import React from 'react'

const INLINE_PATTERN =
  /(\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(INLINE_PATTERN).map((part, i) => {
    if (!part) return null
    const key = `${keyPrefix}-${i}`
    if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
      return (
        <strong key={key} className="font-bold">
          <em>{part.slice(3, -3)}</em>
        </strong>
      )
    }
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length > 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length > 4)
    ) {
      return (
        <strong key={key} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return <del key={key}>{part.slice(2, -2)}</del>
    }
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length > 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length > 2)
    ) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={key}
          className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] dark:bg-slate-800"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    if (link) {
      return (
        <a
          key={key}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-semibold text-blue-600 underline hover:text-blue-700"
        >
          {link[1]}
        </a>
      )
    }
    return <React.Fragment key={key}>{part}</React.Fragment>
  })
}

interface RichTextProps {
  text: string
  className?: string
}

export function RichText({ text, className = '' }: RichTextProps) {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushList = () => {
    if (!list) return
    const Tag = list.ordered ? 'ol' : 'ul'
    const k = `list-${blocks.length}`
    blocks.push(
      <Tag
        key={k}
        className={`my-1 space-y-0.5 pl-5 ${list.ordered ? 'list-decimal' : 'list-disc'}`}
      >
        {list.items.map((item, i) => (
          <li key={i}>{renderInline(item, `${k}-${i}`)}</li>
        ))}
      </Tag>
    )
    list = null
  }

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd()
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/)
    const heading = line.match(/^\s*(#{1,3})\s+(.*)$/)

    if (bullet || numbered) {
      const ordered = !!numbered && !bullet
      if (!list || list.ordered !== ordered) {
        flushList()
        list = { ordered, items: [] }
      }
      list.items.push((bullet || numbered)![1])
      return
    }
    flushList()

    if (heading) {
      blocks.push(
        <p
          key={`h-${idx}`}
          className="mt-1 font-bold text-slate-900 dark:text-white"
        >
          {renderInline(heading[2], `h-${idx}`)}
        </p>
      )
    } else if (!line.trim()) {
      blocks.push(<div key={`sp-${idx}`} className="h-2" />)
    } else {
      blocks.push(<p key={`p-${idx}`}>{renderInline(line, `p-${idx}`)}</p>)
    }
  })
  flushList()

  return <div className={className}>{blocks}</div>
}
