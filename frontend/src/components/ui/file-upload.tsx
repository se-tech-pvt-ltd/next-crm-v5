import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Upload, X, File, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  value?: string;
  onChange: (value: string) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  placeholder?: string;
  allowTextInput?: boolean;
}

export function FileUpload({
  value,
  onChange,
  accept = "*/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  label,
  placeholder = "Enter text or upload file",
  allowTextInput = true
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'file'>(value && value.startsWith('http') ? 'file' : 'text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/file', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onChange(result.fileUrl);
        setInputMode('file');
        toast({
          title: "Success",
          description: "File uploaded successfully.",
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    onChange('');
    setInputMode('text');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFileUploaded = value && value.startsWith('http');

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      {allowTextInput && (
        <div className="flex gap-2 mb-2">
          <Button
            type="button"
            variant={inputMode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('text')}
          >
            Text
          </Button>
          <Button
            type="button"
            variant={inputMode === 'file' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('file')}
          >
            File Upload
          </Button>
        </div>
      )}

      {inputMode === 'text' && allowTextInput ? (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <div className="space-y-3">
          {!isFileUploaded ? (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload File
                  </>
                )}
              </Button>
              <span className="text-sm text-gray-500">
                Max {Math.round(maxSize / (1024 * 1024))}MB
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded">
                {value && value.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <Image className="h-4 w-4 text-blue-600" />
                ) : (
                  <File className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">File uploaded</p>
                <p className="text-xs text-gray-500 truncate">{value}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
