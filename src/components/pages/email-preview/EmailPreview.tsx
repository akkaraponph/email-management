// src/components/pages/email-preview/EmailPreview.tsx
"use client"
import { useState, useEffect } from 'react'
import { PreviewData } from '@/types/email-templates'
import ExportOptionsComponent from '@/components/editor/sections/export/ExportOptionsComponent'
import { getTemplateHeaderFooter, applyHeaderFooterToContent } from '@/services/emailTemplateService'
// Import Ant Design components
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Tooltip,
  Select,
  Spin,
  Radio
} from 'antd'
import type { RadioChangeEvent } from 'antd'
import { 
  MailOutlined, 
  PrinterOutlined, 
  MobileOutlined,
  LaptopOutlined,
  LoadingOutlined
} from '@ant-design/icons'

const { Text } = Typography;
const { Option } = Select;

interface EmailPreviewProps {
  html: string;
  previewData: PreviewData;
  templateId: string;
  templateName?: string;
  availableVariables?: string[];
  onUpdatePreviewData?: (data: PreviewData) => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  html,
  previewData,
  templateId,
  templateName = 'Email Template',
  availableVariables = [],
  onUpdatePreviewData
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showVariablePanel, setShowVariablePanel] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [headerFooterApplied, setHeaderFooterApplied] = useState<boolean>(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load header/footer from database and apply them to the HTML
  useEffect(() => {
    if (isMounted && templateId) {
      applyHeaderFooterToPreview();
    }
  }, [templateId, html, previewData, isMounted]);

  // Apply header/footer to the preview
  const applyHeaderFooterToPreview = async () => {
    setLoading(true);
    
    try {
      // First, replace variables in the provided HTML
      let processedHtml = html;
      
      Object.entries(previewData).forEach(([key, value]) => {
        const regex = new RegExp(`{{\.${key}}}`, 'g');
        processedHtml = processedHtml.replace(regex, String(value || ''));
      });
      
      // Try to apply header/footer from database
      try {
        const htmlWithHeaderFooter = await applyHeaderFooterToContent(templateId, processedHtml, previewData);
        setPreviewHtml(htmlWithHeaderFooter);
        setHeaderFooterApplied(true);
      } catch (error) {
        console.error('Error applying header/footer:', error);
        
        // Fallback to just the processed HTML without header/footer
        setPreviewHtml(processedHtml);
        setHeaderFooterApplied(false);
      }
    } catch (error) {
      console.error('Error processing template:', error);
      setPreviewHtml(html); // Fallback to original HTML
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPreview = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Template Print Preview</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${previewHtml}
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }

  const handleUpdatePreviewData = (key: string, value: string) => {
    if (onUpdatePreviewData) {
      const updatedData = {
        ...previewData,
        [key]: value
      };
      
      onUpdatePreviewData(updatedData);
    }
  }

  if (!isMounted) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      {/* Preview Header with Toolbar */}
      <div className="bg-slate-50/70 border-b border-slate-200/80 px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <Text strong className="text-sm text-slate-800">Email Preview</Text>
            <span className="text-xs text-slate-400 font-mono">({viewMode})</span>
          </div>
          
          <Space size="middle">
            <Radio.Group 
              value={viewMode} 
              onChange={(e: RadioChangeEvent) => setViewMode(e.target.value)}
              size="small"
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="desktop">
                <LaptopOutlined className="mr-1.5" /> Desktop
              </Radio.Button>
              <Radio.Button value="mobile">
                <MobileOutlined className="mr-1.5" /> Mobile
              </Radio.Button>
            </Radio.Group>

            <Tooltip title="Print preview">
              <Button icon={<PrinterOutlined />} size="small" onClick={handlePrintPreview} />
            </Tooltip>
            
            <ExportOptionsComponent
              html={previewHtml}
              rawTemplateHtml={html}
              previewData={previewData}
              templateId={templateId}
              templateName={templateName}
            />
          </Space>
        </div>
      </div>
      
      {/* Main Preview Area */}
      <div className="email-canvas-viewport p-4 md:p-8 flex justify-center">
        <div className={`transition-all duration-300 w-full ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
          <div className="email-paper overflow-hidden">
            {/* Simulated Email Client Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <MailOutlined className="text-indigo-600 text-sm" />
                <span className="text-xs font-semibold text-slate-800">Preview Subject: {templateName}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>To: <code className="text-slate-600">{previewData.email || 'recipient@example.com'}</code></span>
                <span>•</span>
                <span>From: <code className="text-slate-600">hello@yourcompany.com</code></span>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 bg-white min-h-[360px]">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-20 text-slate-400">
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: '#4f46e5' }} spin />} />
                  <Text className="mt-3 text-xs text-slate-500">Rendering preview with mock data...</Text>
                </div>
              ) : (
                <div 
                  className="prose max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Status information about template */}
      {!loading && !headerFooterApplied && (
        <div className="p-3 bg-amber-50/80 text-amber-800 text-xs border-t border-amber-100 flex items-center justify-between">
          <span><strong>Note:</strong> No custom header or footer configured for this template. Using core content body.</span>
        </div>
      )}
    </div>
  )
}

export default EmailPreview