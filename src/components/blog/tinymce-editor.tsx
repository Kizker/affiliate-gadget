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
            'emoticons',
          ],
          toolbar:
            'undo redo | blocks fontfamily fontsize | ' +
            'bold italic underline strikethrough forecolor backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | link image media table emoticons | codesample code fullscreen | help',
          content_style: `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
            
            body { 
              font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              font-size: 16px;
              line-height: 1.75;
              color: #1a1a2e;
              padding: 24px 32px;
              background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
              max-width: 100%;
            }
            h1 { 
              color: #0f0f23;
              font-size: 2.5em; 
              font-weight: 700; 
              margin-top: 0;
              margin-bottom: 0.5em;
              letter-spacing: -0.02em;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            h2 { 
              color: #1a1a2e; 
              font-size: 2em; /* 32px (8 * 4) */
              font-weight: 600; 
              margin-top: 1.5em;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 0.3em;
            }
            h3 { 
              color: #374151; 
              font-size: 1.5em; /* 24px (8 * 3) */
              font-weight: 600; 
              margin-top: 1.25em;
            }
            p {
              margin-bottom: 1.25em;
            }
            code { 
              background: linear-gradient(135deg, #f3e8ff 0%, #e8f4ff 100%);
              padding: 3px 8px; 
              border-radius: 6px; 
              font-family: 'JetBrains Mono', 'Fira Code', monospace;
              font-size: 0.875em;
              color: #7c3aed;
              border: 1px solid #e9d5ff;
            }
            pre { 
              background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3a 100%);
              color: #cdd6f4; 
              padding: 20px; 
              border-radius: 12px; 
              overflow-x: auto;
              border: 1px solid #45475a;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
            }
            blockquote {
              border-left: 4px solid linear-gradient(180deg, #667eea 0%, #764ba2 100%);
              border-left: 4px solid #667eea;
              padding: 16px 20px;
              margin: 1.5em 0;
              background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
              border-radius: 0 12px 12px 0;
              color: #4b5563;
              font-style: italic;
            }
            a { 
              color: #3b82f6; 
              text-decoration: none;
              border-bottom: 2px solid transparent;
              transition: all 0.2s;
            }
            a:hover {
              border-bottom-color: #3b82f6;
            }
            img { 
              max-width: 100%; 
              height: auto; 
              border-radius: 12px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1.5em 0;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            th {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 16px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 12px 16px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:hover td {
              background: #f8fafc;
            }
            ul, ol {
              padding-left: 1.5em;
              margin-bottom: 1.25em;
            }
            li {
              margin-bottom: 0.5em;
            }
            hr {
              border: none;
              height: 2px;
              background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
              margin: 2em 0;
            }
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
          font_family_formats:
            'Inter=Inter, sans-serif; Arial=arial,helvetica,sans-serif; Georgia=georgia,palatino; Times New Roman=times new roman,times; Courier New=courier new,courier; Comic Sans=comic sans ms',
          font_size_formats:
            '12px 14px 16px 18px 20px 24px 28px 32px 36px 48px 72px',
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
          border-radius: 16px;
          overflow: hidden;
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.05),
            0 10px 25px -5px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }
        .tinymce-wrapper:focus-within {
          box-shadow:
            0 4px 6px -1px rgba(102, 126, 234, 0.15),
            0 10px 25px -5px rgba(102, 126, 234, 0.2);
          border-color: #667eea;
        }
        .tox .tox-editor-header {
          background: linear-gradient(
            135deg,
            #f8f9ff 0%,
            #f0f4ff 50%,
            #f8f9ff 100%
          ) !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 4px 8px !important;
        }
        .tox .tox-menubar {
          background: transparent !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 4px 8px !important;
        }
        .tox .tox-toolbar,
        .tox .tox-toolbar__overflow,
        .tox .tox-toolbar__primary {
          background: transparent !important;
        }
        .tox .tox-toolbar-overlord {
          background: transparent !important;
        }
        .tox .tox-tbtn {
          border-radius: 8px !important;
          margin: 2px !important;
          transition: all 0.2s ease !important;
        }
        .tox .tox-tbtn:hover {
          background: linear-gradient(
            135deg,
            #667eea15 0%,
            #764ba215 100%
          ) !important;
          transform: translateY(-1px);
        }
        .tox .tox-tbtn--enabled,
        .tox .tox-tbtn--enabled:hover {
          background: linear-gradient(
            135deg,
            #667eea 0%,
            #764ba2 100%
          ) !important;
          color: white !important;
        }
        .tox .tox-tbtn--enabled svg {
          fill: white !important;
        }
        .tox .tox-tbtn svg {
          fill: #4b5563 !important;
        }
        .tox .tox-tbtn:hover svg {
          fill: #667eea !important;
        }
        .tox .tox-statusbar {
          background: linear-gradient(
            135deg,
            #f8f9ff 0%,
            #f0f4ff 100%
          ) !important;
          border-top: 1px solid #e5e7eb !important;
          padding: 8px 12px !important;
        }
        .tox .tox-statusbar__text-container {
          color: #6b7280 !important;
        }
        .tox .tox-edit-area__iframe {
          background: #ffffff !important;
        }
        .tox .tox-toolbar__group {
          border-color: #e5e7eb !important;
          padding: 0 4px !important;
        }
        .tox .tox-split-button:hover {
          box-shadow: none !important;
        }
        .tox .tox-mbtn {
          border-radius: 6px !important;
        }
        .tox .tox-mbtn:hover {
          background: linear-gradient(
            135deg,
            #667eea15 0%,
            #764ba215 100%
          ) !important;
        }
        .tox .tox-mbtn--active {
          background: linear-gradient(
            135deg,
            #667eea 0%,
            #764ba2 100%
          ) !important;
          color: white !important;
        }
      `}</style>
    </div>
  )
}
