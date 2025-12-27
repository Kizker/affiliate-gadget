'use client'

import { Editor } from '@tinymce/tinymce-react'
import { useRef } from 'react'

interface TinyMCEEditorProps {
  value: string
  onChange: (content: string) => void
  height?: number
}

export default function TinyMCEEditor({
  value,
  onChange,
  height = 600,
}: TinyMCEEditorProps) {
  const editorRef = useRef<{ getContent: () => string } | null>(null)

  return (
    <div className="tinymce-wrapper">
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || 'no-api-key'}
        onInit={(evt, editor) => (editorRef.current = editor)}
        value={value}
        onEditorChange={onChange}
        init={{
          height,
          menubar: true,
          plugins: [
            'advlist',
            'autolink',
            'lists',
            'link',
            'image',
            'charmap',
            'preview',
            'anchor',
            'searchreplace',
            'visualblocks',
            'code',
            'fullscreen',
            'insertdatetime',
            'media',
            'table',
            'code',
            'help',
            'wordcount',
            'codesample',
          ],
          toolbar:
            'undo redo | blocks | ' +
            'bold italic forecolor backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | link image media | codesample | code | help',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
              font-size: 16px;
              line-height: 1.6;
              color: #1F2937;
              padding: 20px;
            }
            h1 { color: #111827; font-size: 2.5em; font-weight: 700; margin-top: 0; }
            h2 { color: #1F2937; font-size: 2em; font-weight: 600; margin-top: 1.5em; }
            h3 { color: #374151; font-size: 1.5em; font-weight: 600; margin-top: 1.25em; }
            code { 
              background: #F3F4F6; 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-family: 'Courier New', monospace;
              font-size: 0.9em;
            }
            pre { 
              background: #1F2937; 
              color: #F9FAFB; 
              padding: 16px; 
              border-radius: 8px; 
              overflow-x: auto;
            }
            blockquote {
              border-left: 4px solid #3B82F6;
              padding-left: 16px;
              margin-left: 0;
              color: #6B7280;
              font-style: italic;
            }
            a { color: #3B82F6; text-decoration: underline; }
            img { max-width: 100%; height: auto; border-radius: 8px; }
          `,
          skin: 'oxide',
          content_css: 'default',
          branding: false,
          promotion: false,
          resize: true,
          statusbar: true,
          elementpath: false,
          image_advtab: true,
          image_caption: true,
          image_title: true,
          automatic_uploads: true,
          file_picker_types: 'image',
          /* Enable automatic uploads of images represented by blob or data URIs*/
          images_upload_handler: async (blobInfo) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                resolve(reader.result as string)
              }
              reader.onerror = reject
              reader.readAsDataURL(blobInfo.blob())
            })
          },
        }}
      />
      <style jsx global>{`
        .tinymce-wrapper {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        .tox .tox-editor-header {
          background: linear-gradient(to right, #f9fafb, #ffffff) !important;
          border-bottom: 2px solid #e5e7eb !important;
        }
        .tox .tox-toolbar,
        .tox .tox-toolbar__overflow,
        .tox .tox-toolbar__primary {
          background: transparent !important;
        }
        .tox .tox-tbtn {
          border-radius: 6px !important;
          margin: 2px !important;
        }
        .tox .tox-tbtn:hover {
          background: #eff6ff !important;
        }
        .tox .tox-tbtn--enabled,
        .tox .tox-tbtn--enabled:hover {
          background: #dbeafe !important;
        }
        .tox .tox-statusbar {
          background: #f9fafb !important;
          border-top: 1px solid #e5e7eb !important;
        }
      `}</style>
    </div>
  )
}
