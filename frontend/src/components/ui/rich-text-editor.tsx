import React from 'react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ComponentType, type SVGProps } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';
import DOMPurify from 'dompurify';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, X, Save, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

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
  onCancel?: () => void;
  onCreate?: () => void;
  canCreate?: boolean;
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
  onCancel,
  onCreate,
  canCreate = false,
}: RichTextEditorProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Extend Image to carry attachment metadata and sizing with drag-and-drop support
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
        width: {
          default: null,
          renderHTML: (attributes: any) => {
            if (!attributes.width) return {};
            return { style: `width: ${attributes.width}` };
          },
          parseHTML: (element: HTMLElement) => {
            const style = element.getAttribute('style') || '';
            const match = style.match(/width:\s*(\d+(?:px|%|em)?)/);
            return match ? match[1] : null;
          },
        },
        float: {
          default: null,
          renderHTML: (attributes: any) => {
            if (!attributes.float) return {};
            return { style: `float: ${attributes.float}; margin: 8px;` };
          },
          parseHTML: (element: HTMLElement) => {
            const style = element.getAttribute('style') || '';
            const match = style.match(/float:\s*(left|right|none)?/);
            return match ? match[1] : null;
          },
        },
      } as any;
    },
    addNodeView() {
      return {
        selectable: true,
        draggable: true,
      };
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
        class: 'prose prose-sm max-w-none h-full min-h-[305px] focus:outline-none',
      },
      handleDOMEvents: {
        dragover: (view, event) => {
          if (!event.dataTransfer) return false;
          event.dataTransfer.dropEffect = 'move';
          event.preventDefault();
          return true;
        },
        drop: (view, event) => {
          if (!event.dataTransfer) return false;
          event.preventDefault();
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (!pos) return false;
          view.dispatch(view.state.tr.insertText('', pos.pos, pos.pos));
          return true;
        },
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

  const handleImageResize = () => {
    if (!editor) return;
    const currentAttrs = editor.getAttributes('image');
    const currentWidth = currentAttrs.width || '100%';
    const width = window.prompt('Enter image width (e.g., 300px, 50%):', currentWidth);
    if (width === null) return;
    if (width.trim()) {
      editor.chain().focus().updateAttributes('image', { width: width.trim() }).run();
    }
  };

  const handleImageAlign = (alignment: 'left' | 'center' | 'right') => {
    if (!editor) return;
    const floatValue = alignment === 'center' ? 'none' : alignment === 'left' ? 'left' : 'right';
    editor.chain().focus().updateAttributes('image', { float: floatValue }).run();
  };

  return (
    <>
      <style>{`
        .ProseMirror img {
          cursor: grab;
          transition: opacity 0.2s ease;
        }
        .ProseMirror img:hover {
          opacity: 0.8;
        }
        .ProseMirror img:active {
          cursor: grabbing;
        }
      `}</style>
      <div className={cn('rounded-md border bg-white flex flex-col overflow-hidden', className, disabled && 'opacity-60')}>
      <div className="flex items-center gap-2 border-b bg-gray-50 px-2 py-1 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2">
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
        <div className="mx-1 h-6 w-px bg-gray-200" aria-hidden="true" />
        <ToolbarButton
          onClick={handleImageResize}
          disabled={disabled || !editor || !editor.isActive('image')}
          icon={() => (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-5.04-6.71l-2.75 3.54h2.86v2h-4v-4h2v1.13l1.96-2.36 2.05 1.61 2.79-3.54h-2.74v-2h4v4h-2v-1.13l-1.96 2.36z" />
            </svg>
          )}
          label="Resize image"
        />
        <ToolbarButton
          onClick={() => handleImageAlign('left')}
          disabled={disabled || !editor || !editor.isActive('image')}
          active={editor?.getAttributes('image').float === 'left'}
          icon={AlignLeft}
          label="Align left"
        />
        <ToolbarButton
          onClick={() => handleImageAlign('center')}
          disabled={disabled || !editor || !editor.isActive('image')}
          active={editor?.getAttributes('image').float === 'none' || !editor?.getAttributes('image').float}
          icon={AlignCenter}
          label="Align center"
        />
        <ToolbarButton
          onClick={() => handleImageAlign('right')}
          disabled={disabled || !editor || !editor.isActive('image')}
          active={editor?.getAttributes('image').float === 'right'}
          icon={AlignRight}
          label="Align right"
        />
        </div>
        {(onCancel || onCreate) && (
          <div className="ml-auto flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={disabled}
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded text-gray-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  'hover:bg-gray-100',
                  disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent'
                )}
                aria-label="Cancel"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                disabled={disabled || !canCreate}
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded text-gray-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  canCreate ? 'hover:bg-gray-100' : '',
                  (disabled || !canCreate) && 'cursor-not-allowed opacity-50 hover:bg-transparent'
                )}
                aria-label="Save"
                title="Save"
              >
                <Save className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto px-2 py-1">
        <EditorContent editor={editor} />
      </div>
    </div>
    </>
  );
};

export default RichTextEditor;
