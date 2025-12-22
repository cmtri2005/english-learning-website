import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import { transformMarkdownImages, transformImageUrl } from '@/services/storage';

interface MarkdownRendererProps {
    content: string;
    blogId?: number;
    className?: string;
}

// Prose styling classes for balanced, readable markdown
const PROSE_CLASSES = [
    'prose prose-lg dark:prose-invert max-w-none w-full',
    // Headings
    'prose-headings:font-semibold prose-headings:text-foreground prose-headings:tracking-tight prose-headings:scroll-m-24',
    'prose-h1:text-6xl prose-h1:mt-0 prose-h1:mb-6',
    'prose-h2:text-5xl prose-h2:mt-10 prose-h2:mb-4',
    'prose-h3:text-4xl prose-h3:mt-8 prose-h3:mb-3',
    'prose-h4:text-3xl prose-h4:mt-6 prose-h4:mb-2',
    'prose-h5:text-2xl prose-h5:mt-5 prose-h5:mb-2',
    'prose-h6:text-xl prose-h6:mt-4 prose-h6:mb-2',
    // Text and paragraphs
    'prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-4 prose-p:text-base',
    'prose-strong:text-foreground prose-strong:font-semibold',
    'prose-em:text-foreground/80 prose-em:italic',
    // Links
    'prose-a:text-primary prose-a:font-medium prose-a:underline-offset-4 hover:prose-a:underline prose-a:transition-colors',
    // Lists
    'prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4 prose-ul:space-y-1.5',
    'prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4 prose-ol:space-y-1.5',
    'prose-li:text-foreground/90 prose-li:leading-relaxed prose-li:marker:text-muted-foreground',
    // Code
    'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:border prose-code:border-border',
    'prose-code:font-mono prose-code:text-foreground',
    'prose-code:before:content-none prose-code:after:content-none',
    'prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-6',
    // Images
    'prose-img:rounded-xl prose-img:shadow-md prose-img:my-8 prose-img:border prose-img:border-border/70 prose-img:max-h-[480px] prose-img:mx-auto',
    // Blockquotes
    'prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:py-2',
    'prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/30 prose-blockquote:rounded-r',
    // Horizontal rules
    'prose-hr:border-border prose-hr:my-10',
    // Tables
    'prose-table:border-collapse prose-table:w-full prose-table:my-6',
    'prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:text-foreground',
    'prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-3 prose-td:text-foreground/90',
    'prose-tr:border-b prose-tr:border-border',
].join(' ');

const getText = (node: React.ReactNode): string => {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(getText).join('');
    if (React.isValidElement(node)) return getText(node.props.children);
    return '';
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

const extractHeadings = (md: string) => {
    return md
        .split('\n')
        .map((line) => {
            const match = line.match(/^(#{1,6})\s+(.*)/);
            if (!match) return null;
            const level = match[1].length;
            const text = match[2].trim();
            return { level, text, id: slugify(text) };
        })
        .filter(Boolean) as { level: number; text: string; id: string }[];
};

const CodeBlock = ({ className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const isCodeBlock = match && className?.startsWith('language-');
    const language = match?.[1] || 'text';

    if (!isCodeBlock) {
        return (
            <code className={`px-1.5 py-0.5 rounded bg-muted font-mono text-sm ${className || ''}`} {...props}>
                {children}
            </code>
        );
    }

    return (
        <div className="my-6 overflow-hidden rounded-xl border border-border/80 shadow-sm bg-black">
            <div className="flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground bg-black/80">
                <span className="font-semibold text-white">{language}</span>
            </div>
            <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                wrapLongLines
                customStyle={{ margin: 0, borderRadius: 0, background: '#000' }}
                className="!bg-black"
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
    );
};

const HEADING_SIZES: Record<number, string> = {
    1: 'text-4xl mt-0 mb-6',
    2: 'text-3xl mt-8 mb-4',
    3: 'text-2xl mt-6 mb-3',
    4: 'text-xl mt-5 mb-2',
    5: 'text-lg mt-4 mb-2',
    6: 'text-base mt-3 mb-2',
};

const Heading = ({ level, children, className = '', ...props }: any) => {
    const text = getText(children);
    const id = slugify(text);
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    const sizeClass = HEADING_SIZES[level as keyof typeof HEADING_SIZES] || '';

    return (
        <Tag id={id} className={`group scroll-m-24 font-semibold ${sizeClass} ${className}`} {...props}>
            <a href={`#${id}`} className="inline-flex items-center gap-2 no-underline">
                {children}
                <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    #
                </span>
            </a>
        </Tag>
    );
};

// Custom markdown components for enhanced rendering
const markdownComponents: Components = {
    code: CodeBlock,
    h1: (props) => <Heading level={1} {...props} />,
    h2: (props) => <Heading level={2} {...props} />,
    h3: (props) => <Heading level={3} {...props} />,
    h4: (props) => <Heading level={4} {...props} />,
    h5: (props) => <Heading level={5} {...props} />,
    h6: (props) => <Heading level={6} {...props} />,
    ul({ children, className = '', ...props }) {
        return (
            <ul className={`list-disc list-outside pl-6 space-y-2 ${className}`} {...props}>
                {children}
            </ul>
        );
    },
    ol({ children, className = '', ...props }) {
        return (
            <ol className={`list-decimal list-outside pl-6 space-y-2 ${className}`} {...props}>
                {children}
            </ol>
        );
    },
    li({ children, className = '', ...props }) {
        return (
            <li className={`marker:text-muted-foreground text-foreground/90 leading-relaxed ${className}`} {...props}>
                {children}
            </li>
        );
    },
    a({ href, children, ...props }) {
        const isExternal = href?.startsWith('http');
        return (
            <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-primary underline-offset-4 hover:underline"
                {...props}
            >
                {children}
            </a>
        );
    },
    img({ src, alt }) {
        return (
            <img
                src={src}
                alt={alt || ''}
                className="rounded-lg shadow-lg my-8 max-w-full h-auto border border-border"
                loading="lazy"
                onError={(e) => (e.currentTarget.style.display = 'none')}
            />
        );
    },
    table({ children }) {
        return (
            <div className="overflow-x-auto my-6 rounded-lg border border-border shadow-sm">
                <table className="min-w-full border-collapse">{children}</table>
            </div>
        );
    },
    thead({ children }) {
        return <thead className="bg-muted">{children}</thead>;
    },
    tbody({ children }) {
        return <tbody className="divide-y divide-border">{children}</tbody>;
    },
    tr({ children }) {
        return <tr className="hover:bg-muted/50 transition-colors">{children}</tr>;
    },
    th({ children }) {
        return (
            <th className="px-4 py-3 text-left font-semibold border-r border-border last:border-r-0">
                {children}
            </th>
        );
    },
    td({ children }) {
        return (
            <td className="px-4 py-3 text-foreground/90 border-r border-border last:border-r-0">
                {children}
            </td>
        );
    },
    blockquote({ children }) {
        return (
            <blockquote className="border-l-4 border-primary/60 pl-4 py-2 bg-muted/30 rounded-r italic text-muted-foreground">
                {children}
            </blockquote>
        );
    },
    hr() {
        return <hr className="my-8 border-border" />;
    },
};

/**
 * Markdown renderer - chuyển đổi markdown thành HTML đẹp mắt
 * Hỗ trợ: GFM, syntax highlighting, tables, images, code blocks
 */
export function MarkdownRenderer({ content, blogId, className = '' }: MarkdownRendererProps) {
    // Transform markdown content to replace simplified image URLs (bl_1.png) with full URLs
    const transformedContent = React.useMemo(() => {
        if (!content || !blogId) return content;
        return transformMarkdownImages(content, blogId);
    }, [content, blogId]);

    const headings = React.useMemo(() => extractHeadings(transformedContent), [transformedContent]);

    // Create custom components with blogId context (fallback for any images not caught by transform)
    const componentsWithBlogId: Components = React.useMemo(
        () => ({
            ...markdownComponents,
            img({ src, alt }) {
                // Transform simplified image URLs (bl_1.png) to full MinIO URLs (fallback)
                const transformedSrc = src && blogId ? transformImageUrl(src, blogId) : src;
                return (
                    <img
                        src={transformedSrc}
                        alt={alt || ''}
                        className="rounded-lg shadow-lg my-8 max-w-full h-auto border border-border"
                        loading="lazy"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                );
            },
        }),
        [blogId]
    );

    if (!content) {
        return (
            <div className={`text-muted-foreground italic ${className}`}>
                Chưa có nội dung
            </div>
        );
    }

    return (
        <div className={`flex gap-8 w-full ${className}`}>
            <div className={`${PROSE_CLASSES} flex-1 min-w-0 lg:pr-6`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentsWithBlogId}>
                    {transformedContent}
                </ReactMarkdown>
            </div>

            {headings.length > 0 && (
                <aside className="hidden lg:block w-80 shrink-0 border-l border-border/60 pl-4 self-start sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto">
                    <div className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Mục lục</div>
                    <ul className="space-y-2 text-base pr-1">
                        {headings.map(({ id, text, level }) => (
                            <li
                                key={id}
                                className={`leading-snug ${level > 1 ? 'ml-2' : ''} ${level > 2 ? 'ml-4' : ''} ${level > 3 ? 'ml-6' : ''}`}
                            >
                                <a
                                    href={`#${id}`}
                                    className="text-foreground/80 hover:text-primary transition-colors"
                                >
                                    {text}
                                </a>
                            </li>
                        ))}
                    </ul>
                </aside>
            )}
        </div>
    );
}
