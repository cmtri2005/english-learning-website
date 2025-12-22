import { useState } from 'react';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
    Bold,
    Italic,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Link,
    Image,
    Code,
    Quote,
    Eye,
    Edit3
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '@/shared/lib/utils';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minHeight?: string;
    blogId?: number; // For image URL generation
}

/**
 * Markdown editor with live preview and formatting toolbar
 */
export function MarkdownEditor({
    value,
    onChange,
    placeholder = 'Viết nội dung bài viết của bạn bằng Markdown...',
    disabled = false,
    minHeight = '400px',
    blogId,
}: MarkdownEditorProps) {
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    // Insert text at cursor or wrap selection
    const insertFormatting = (prefix: string, suffix: string = '', placeholder?: string) => {
        const textarea = document.querySelector('#markdown-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const textToInsert = selectedText || placeholder || '';

        const before = value.substring(0, start);
        const after = value.substring(end);
        const newText = `${before}${prefix}${textToInsert}${suffix}${after}`;

        onChange(newText);

        // Restore cursor position
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + prefix.length + textToInsert.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const toolbarButtons = [
        {
            icon: Bold,
            label: 'Bold',
            action: () => insertFormatting('**', '**', 'bold text'),
            shortcut: 'Ctrl+B'
        },
        {
            icon: Italic,
            label: 'Italic',
            action: () => insertFormatting('*', '*', 'italic text'),
            shortcut: 'Ctrl+I'
        },
        { type: 'separator' },
        {
            icon: Heading2,
            label: 'Heading 2',
            action: () => insertFormatting('\n## ', '\n', 'Heading 2'),
        },
        {
            icon: Heading3,
            label: 'Heading 3',
            action: () => insertFormatting('\n### ', '\n', 'Heading 3'),
        },
        { type: 'separator' },
        {
            icon: List,
            label: 'Bullet List',
            action: () => insertFormatting('\n- ', '', 'List item'),
        },
        {
            icon: ListOrdered,
            label: 'Numbered List',
            action: () => insertFormatting('\n1. ', '', 'List item'),
        },
        { type: 'separator' },
        {
            icon: Link,
            label: 'Link',
            action: () => insertFormatting('[', '](url)', 'link text'),
        },
        {
            icon: Image,
            label: 'Image',
            action: () => {
                insertFormatting('![', '](bl_1.png)', 'alt text');
            },
        },
        { type: 'separator' },
        {
            icon: Code,
            label: 'Code',
            action: () => insertFormatting('`', '`', 'code'),
        },
        {
            icon: Quote,
            label: 'Quote',
            action: () => insertFormatting('\n> ', '', 'Quote text'),
        },
    ];

    return (
        <div className="space-y-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {toolbarButtons.map((btn, idx) => {
                            if (btn.type === 'separator') {
                                return (
                                    <div
                                        key={`sep-${idx}`}
                                        className="w-px h-6 bg-border mx-1"
                                    />
                                );
                            }
                            const Icon = btn.icon!;
                            return (
                                <Button
                                    key={btn.label}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={btn.action}
                                    disabled={disabled || activeTab === 'preview'}
                                    title={btn.label}
                                >
                                    <Icon className="h-4 w-4" />
                                </Button>
                            );
                        })}
                    </div>

                    {/* Tab Switcher */}
                    <TabsList className="h-8">
                        <TabsTrigger value="edit" className="text-xs px-3 h-7">
                            <Edit3 className="h-3 w-3 mr-1" />
                            Soạn thảo
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="text-xs px-3 h-7">
                            <Eye className="h-3 w-3 mr-1" />
                            Xem trước
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="edit" className="mt-2">
                    <Textarea
                        id="markdown-editor"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={cn(
                            "font-mono text-sm resize-none",
                            "focus-visible:ring-1 focus-visible:ring-primary"
                        )}
                        style={{ minHeight }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        Hỗ trợ Markdown: **bold**, *italic*, # headings, - lists, [links](url), ![images](url), `code`
                    </p>
                </TabsContent>

                <TabsContent value="preview" className="mt-2">
                    <Card>
                        <CardContent
                            className="p-6 overflow-auto"
                            style={{ minHeight }}
                        >
                            <MarkdownRenderer content={value} blogId={blogId} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
