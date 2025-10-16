import React from 'react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ComponentType, type SVGProps } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/services/uploads';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  // When provided, images in HTML will be fetched from this API base (also used for uploads)
  assetBaseApiUrl?: string;
  uploadBaseApiUrl?: string;
  // Optional action buttons to display in the toolbar
  actions?: React.ReactNode;
}

const HTML_IMAGE_REGEX = /<img\b[^>]*>/i;

export const isHtmlContentEmpty = (html: string): boolean => {
  if (!html) return true;
  if (HTML_IMAGE_REGEX.test(html)) return false;
  const textContent = html
    .replace(/&nbsp;/gi, ' ')
    .replace(/<br\s*\/?>(?=\s|$)/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<p[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return textContent.length === 0;
};

type ToolbarButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
};

const ToolbarButton = ({ onClick, disabled, active, icon: Icon, label }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'inline-flex h-8 w-8 items-center justify-center rounded text-gray-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
      active ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-100',
      disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent'
    )}
    aria-label={label}
    title={label}
  >
    <Icon className="h-4 w-4" />
  </button>
);

const EMPTY_DOCUMENT = '<p></p>';

const sanitizeForEditor = (html?: string) => {
  const sanitized = html ? DOMPurify.sanitize(html, { ADD_ATTR: ['data-attachment-id'] }) : '';
  if (!sanitized || isHtmlContentEmpty(sanitized)) {
    return EMPTY_DOCUMENT;
  }
  return sanitized;
};

const absolutizeUrl = (url: string, baseApiUrl?: string) => {
  if (!baseApiUrl) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const base = baseApiUrl.replace(/\/$/, '');
  const baseDomain = base.replace(/\/api\/?$/, '');
  // Map /api/uploads/... -> https://domain/uploads/...
  if (url.startsWith('/api/uploads')) return `${baseDomain}${url.replace(/^\/api/, '')}`;
  // Keep other api paths if necessary
  if (url.startsWith('/api/')) return `${baseDomain}${url}`;
  // If url already points to uploads, use base domain
  if (url.startsWith('/uploads')) return `${baseDomain}${url}`;
  if (url.startsWith('/')) return `${base}${url}`;
  return `${base}/${url}`;
};

const rewriteImageSrcs = (html: string, baseApiUrl?: string) => {
  if (!baseApiUrl || !html) return html;
  try {
    const container = document.createElement('div');
    container.innerHTML = html;
    const imgs = Array.from(container.querySelectorAll('img'));
    for (const img of imgs) {
      const src = img.getAttribute('src');
      if (!src) continue;
      const abs = absolutizeUrl(src, baseApiUrl);
      img.setAttribute('src', abs);
    }
    return container.innerHTML;
  } catch {
    return html;
  }
};

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Write your content...',
  disabled = false,
  className,
  assetBaseApiUrl,
  uploadBaseApiUrl,
  actions,
}: RichTextEditorProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Extend Image to carry attachment metadata
  const ImageWithMeta = Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        'data-attachment-id': {
          default: null,
          renderHTML: (attributes: any) => {
            if (!attributes['data-attachment-id']) return {};
            return { 'data-attachment-id': attributes['data-attachment-id'] };
          },
          parseHTML: (element: HTMLElement) => element.getAttribute('data-attachment-id'),
        },
      } as any;
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      Link.configure({ openOnClick: false, linkOnPaste: true, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
      ImageWithMeta.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: rewriteImageSrcs(sanitizeForEditor(value), assetBaseApiUrl),
    editable: !disabled,
    onUpdate: ({ editor: current }) => {
      const sanitized = DOMPurify.sanitize(current.getHTML(), { ADD_ATTR: ['data-attachment-id'] });
      if (isHtmlContentEmpty(sanitized)) {
        onChange('');
        return;
      }
      const rewritten = rewriteImageSrcs(sanitized, assetBaseApiUrl);
      onChange(rewritten);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[180px] focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const sanitized = rewriteImageSrcs(sanitizeForEditor(value), assetBaseApiUrl);
    if (sanitized !== editor.getHTML()) {
      editor.commands.setContent(sanitized, false);
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const requestImageUpload = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleImageSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !editor) return;

    setIsUploading(true);
    try {
      const response = await uploadFile(file, { baseApiUrl: uploadBaseApiUrl || assetBaseApiUrl });
      if (!response.fileUrl) {
        throw new Error('Upload did not return a file URL');
      }
      const url = DOMPurify.sanitize(response.fileUrl);
      const finalUrl = absolutizeUrl(url, assetBaseApiUrl || uploadBaseApiUrl);
      const attachmentId = response.attachmentId || '';
      editor.chain().focus().setImage({ src: finalUrl, alt: file.name, 'data-attachment-id': attachmentId } as any).run();
      toast({ title: 'Image uploaded', description: 'Image added to the content.' });
    } catch (error: any) {
      const message = error?.message || 'Failed to upload image';
      toast({ title: 'Upload failed', description: message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLinkToggle = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter link URL', previousUrl || '');
    if (url === null) return;

    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }

    let sanitized = DOMPurify.sanitize(url.trim());
    if (!/^https?:\/\//i.test(sanitized)) {
      sanitized = `https://${sanitized}`;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: sanitized, target: '_blank', rel: 'noopener noreferrer' }).run();
  };

  return (
    <div className={cn('rounded-md border bg-white', className, disabled && 'opacity-60')}> 
      <div className="flex flex-wrap items-center gap-2 border-b bg-gray-50 px-2 py-1">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={disabled || !editor}
          active={editor?.isActive('bold')}
          icon={Bold}
          label="Bold"
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={disabled || !editor}
          active={editor?.isActive('italic')}
          icon={Italic}
          label="Italic"
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          disabled={disabled || !editor}
          active={editor?.isActive('underline')}
          icon={UnderlineIcon}
          label="Underline"
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={disabled || !editor}
          active={editor?.isActive('strike')}
          icon={Strikethrough}
          label="Strikethrough"
        />
        <div className="mx-1 h-6 w-px bg-gray-200" aria-hidden="true" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={disabled || !editor}
          active={editor?.isActive('bulletList')}
          icon={List}
          label="Bullet list"
        />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={disabled || !editor}
          active={editor?.isActive('orderedList')}
          icon={ListOrdered}
          label="Numbered list"
        />
        <div className="mx-1 h-6 w-px bg-gray-200" aria-hidden="true" />
        <ToolbarButton
          onClick={handleLinkToggle}
          disabled={disabled || !editor}
          active={editor?.isActive('link')}
          icon={LinkIcon}
          label="Link"
        />
        <button
          type="button"
          onClick={requestImageUpload}
          disabled={disabled || !editor || isUploading}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded text-gray-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            'hover:bg-gray-100',
            (disabled || isUploading || !editor) && 'cursor-not-allowed opacity-50 hover:bg-transparent'
          )}
          aria-label="Insert image"
          title="Insert image"
        >
          {isUploading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelection}
          className="hidden"
        />
      </div>
      <div className="max-h-[340px] overflow-y-auto px-2 py-1">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
