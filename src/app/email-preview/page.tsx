"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Typography, 
  Button, 
  Space, 
  Layout, 
  Card, 
  Select, 
  Spin, 
  Alert, 
  Divider, 
  Tabs, 
  Form, 
  Input, 
  Tooltip, 
  Badge, 
  Collapse, 
  Row, 
  Col,
  Dropdown,
  message,
  FloatButton,
  Radio,
  Tag,
  Slider,
  Result
} from 'antd'
import { 
  ArrowLeftOutlined, 
  PrinterOutlined, 
  DownloadOutlined, 
  MobileOutlined, 
  LaptopOutlined,
  SettingOutlined,
  ExpandOutlined,
  CompressOutlined,
  CodeOutlined,
  CopyOutlined,
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined as MobileFilled,
  InfoCircleOutlined,
  MailOutlined,
  ToolOutlined,
  EyeOutlined,
  EditOutlined,
  UserOutlined
} from '@ant-design/icons'
import EmailPreview from '@/components/pages/email-preview/EmailPreview'
import type { TabsProps, MenuProps } from 'antd'
import LoaderComponent  from '@/components/LoaderComponent'

const { Title, Text, Paragraph } = Typography
const { Header, Content, Sider } = Layout
const { Option } = Select
const { Panel } = Collapse
const { TabPane } = Tabs

export default function EmailPreviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [templateId, setTemplateId] = useState<string>('')
  const [templateName, setTemplateName] = useState<string>('Template Preview')
  const [templateHtml, setTemplateHtml] = useState<string>('')
  const [previewData, setPreviewData] = useState<Record<string, any>>({})
  const [availableVariables, setAvailableVariables] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [siderCollapsed, setSiderCollapsed] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('test-data')
  const [zoomLevel, setZoomLevel] = useState<number>(100)

  // Load preview data from localStorage on component mount
  useEffect(() => {
    const storedTemplateId = localStorage.getItem('preview-template-id')
    const storedHtml = localStorage.getItem('preview-template-html')
    const storedData = localStorage.getItem('preview-template-data')
    const storedName = localStorage.getItem('preview-template-name')
    
    if (storedTemplateId && storedHtml) {
      setTemplateId(storedTemplateId)
      setTemplateHtml(storedHtml)
      if (storedName) {
        setTemplateName(storedName)
      }
      
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)
          setPreviewData(parsedData)
          setAvailableVariables(Object.keys(parsedData))
        } catch (error) {
          console.error('Error parsing preview data', error)
          setPreviewData({})
          setAvailableVariables([])
        }
      }
    } else {
      // No preview data found, redirect back to editor after a delay
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
    
    setLoading(false)
  }, [router])

  // Handle print preview
  const handlePrintPreview = () => {
    message.info('Preparing print view...')
    setTimeout(() => {
      window.print()
    }, 300)
  }

  // Handle export HTML
  const handleExportHtml = () => {
    // Create email-client-friendly HTML
    const emailSafeHTML = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${templateName || 'Email Template'}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; min-width: 100%; font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  ${templateHtml}
</body>
</html>
    `;
    
    // Download as HTML file
    const blob = new Blob([emailSafeHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}-${templateId.substring(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    message.success('Email template exported successfully');
  }

  // Handle export source code
  const handleExportSource = () => {
    // Download as HTML file
    const blob = new Blob([templateHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}-source.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    message.success('Source code exported successfully');
  }

  // Handle copy HTML to clipboard
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(templateHtml)
      .then(() => {
        message.success('HTML copied to clipboard');
      })
      .catch(() => {
        message.error('Failed to copy HTML');
      });
  }

  // Handle update preview data
  const handleUpdatePreviewData = (updatedData: Record<string, any>) => {
    setPreviewData(updatedData)
    localStorage.setItem('preview-template-data', JSON.stringify(updatedData))
  }

  // Navigate back to the editor
  const handleBackToEditor = () => {
    router.push('/')
  }

  // Handle zoom in/out
  const handleZoom = (newZoom: number) => {
    setZoomLevel(Math.max(50, Math.min(150, newZoom)))
  }

  // Define items for the view mode dropdown
  const viewModeItems: MenuProps['items'] = [
    {
      key: 'desktop',
      label: 'Desktop View',
      icon: <DesktopOutlined />,
      onClick: () => setViewMode('desktop'),
    },
    {
      key: 'tablet',
      label: 'Tablet View',
      icon: <TabletOutlined />,
      onClick: () => setViewMode('tablet'),
    },
    {
      key: 'mobile',
      label: 'Mobile View',
      icon: <MobileFilled />,
      onClick: () => setViewMode('mobile'),
    },
  ];

  // Define items for the export dropdown
  const exportItems: MenuProps['items'] = [
    {
      key: 'html',
      label: 'Export HTML',
      icon: <DownloadOutlined />,
      onClick: handleExportHtml,
    },
    {
      key: 'source',
      label: 'Export Source Code',
      icon: <CodeOutlined />,
      onClick: handleExportSource,
    },
    {
      key: 'copy',
      label: 'Copy HTML to Clipboard',
      icon: <CopyOutlined />,
      onClick: handleCopyHtml,
    },
    {
      key: 'print',
      label: 'Print Preview',
      icon: <PrinterOutlined />,
      onClick: handlePrintPreview,
    },
  ];

  // Define tabs for the sidebar
  const sidebarTabs: TabsProps['items'] = [
    {
      key: 'test-data',
      label: <span><UserOutlined /> Test Data</span>,
      children: (
        <div className="variable-editor h-full flex flex-col p-1">
          <Paragraph type="secondary" className="mb-3 text-xs">
            Modify test data values to see how your email will look with different content.
          </Paragraph>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-0">
            {availableVariables.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No variables found in this template.
              </div>
            ) : (
              availableVariables.map((key) => (
                <div key={key} className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60">
                  <div className="text-xs font-semibold text-slate-700 capitalize mb-1">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <Input
                    value={previewData[key] || ''}
                    onChange={(e) => handleUpdatePreviewData({
                      ...previewData,
                      [key]: e.target.value
                    })}
                    placeholder={`Enter value for ${key}`}
                    size="small"
                    className="bg-white"
                    allowClear
                  />
                </div>
              ))
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-slate-200/80 shrink-0">
            <Paragraph type="secondary" className="text-[11px] !mb-0 leading-tight">
              <InfoCircleOutlined className="mr-1 text-indigo-500" /> Changes apply live and persist locally in browser.
            </Paragraph>
          </div>
        </div>
      ),
    },
    {
      key: 'template-info',
      label: <span><InfoCircleOutlined /> Template Info</span>,
      children: (
        <div className="template-info">
          <Collapse 
            defaultActiveKey={['basic']} 
            bordered={false} 
            className="bg-transparent"
            items={[
              {
                key: 'basic',
                label: 'Basic Information',
                className: 'site-collapse-custom-panel',
                children: (
                  <>
                    <div className="mb-3">
                      <Text type="secondary" className="block text-xs">Template ID</Text>
                      <Text strong className="word-break-all">{templateId}</Text>
                    </div>
                    <div className="mb-3">
                      <Text type="secondary" className="block text-xs">Template Name</Text>
                      <Text>{templateName}</Text>
                    </div>
                    <div>
                      <Text type="secondary" className="block text-xs">Variables</Text>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {availableVariables.map(variable => (
                          <Tag key={variable} color="blue">
                            {`{{${variable}}}`}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </>
                ),
              },
              {
                key: 'preview',
                label: 'Preview Settings',
                className: 'site-collapse-custom-panel',
                children: (
                  <>
                    <div className="mb-3">
                      <Text type="secondary" className="block mb-1">Device Preview</Text>
                      <Radio.Group 
                        value={viewMode} 
                        onChange={(e) => setViewMode(e.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                        size="small"
                        className="w-full"
                      >
                        <Radio.Button value="desktop" style={{ width: '33.33%', textAlign: 'center' }}>
                          <DesktopOutlined /> Desktop
                        </Radio.Button>
                        <Radio.Button value="tablet" style={{ width: '33.33%', textAlign: 'center' }}>
                          <TabletOutlined /> Tablet
                        </Radio.Button>
                        <Radio.Button value="mobile" style={{ width: '33.33%', textAlign: 'center' }}>
                          <MobileFilled /> Mobile
                        </Radio.Button>
                      </Radio.Group>
                    </div>
                    <div>
                      <Text type="secondary" className="block mb-1">Zoom Level: {zoomLevel}%</Text>
                      <div className="flex items-center">
                        <Button 
                          icon={<CompressOutlined />} 
                          onClick={() => handleZoom(zoomLevel - 10)}
                          disabled={zoomLevel <= 50}
                          size="small"
                        />
                        <Slider 
                          min={50} 
                          max={150} 
                          value={zoomLevel} 
                          onChange={handleZoom} 
                          className="mx-2 flex-grow"
                        />
                        <Button 
                          icon={<ExpandOutlined />} 
                          onClick={() => handleZoom(zoomLevel + 10)}
                          disabled={zoomLevel >= 150}
                          size="small"
                        />
                      </div>
                    </div>
                  </>
                ),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  if (loading) {
    // return (
    //   <div className="flex flex-col justify-center items-center h-screen">
    //     <Spin size="large" />
    //     <div className="mt-4 text-lg">Loading preview...</div>
    //   </div>
    // )
	return <LoaderComponent />;
}

  if (!templateHtml) {
    return (
      <div className="p-8 flex justify-center items-center h-screen">
        <Card className="max-w-lg w-full shadow-lg">
          <Result
            status="warning"
            title="No template to preview"
            subTitle="There's no template data available for preview. Please go back to the editor and try again."
            extra={
              <Button 
                onClick={handleBackToEditor} 
                type="primary" 
                icon={<ArrowLeftOutlined />}
                size="large"
              >
                Back to Editor
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <Layout className="h-screen flex flex-col overflow-hidden bg-slate-100/70">
      {/* Unified Studio Preview Bar */}
      <Header 
        className="studio-topbar px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md shrink-0 z-40"
        style={{
          height: 'auto',
          lineHeight: 'normal',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.95)',
        }}
      >
        {/* Left: Navigation & Template Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToEditor}
            className="font-medium shrink-0 shadow-2xs"
          >
            Back to Studio
          </Button>
          <div className="hidden md:flex items-center gap-2.5 border-l border-slate-200 pl-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <MailOutlined />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 text-sm leading-snug truncate">
                {templateName}
              </div>
              <div className="text-slate-400 text-xs leading-none">
                Full Viewport Preview
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: Device Switcher, Zoom, Print, Export & Sider Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 print:hidden">
          {/* Responsive View Switcher */}
          <Radio.Group 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="small"
            className="shrink-0"
          >
            <Radio.Button value="desktop">
              <DesktopOutlined className="mr-1" />
              <span className="hidden sm:inline">Desktop</span>
            </Radio.Button>
            <Radio.Button value="tablet">
              <TabletOutlined className="mr-1" />
              <span className="hidden sm:inline">Tablet</span>
            </Radio.Button>
            <Radio.Button value="mobile">
              <MobileFilled className="mr-1" />
              <span className="hidden sm:inline">Mobile</span>
            </Radio.Button>
          </Radio.Group>

          {/* Quick Zoom Controller */}
          <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200/80 rounded-md px-1 py-0.5">
            <Button 
              type="text"
              size="small"
              icon={<CompressOutlined />}
              onClick={() => handleZoom(zoomLevel - 10)}
              disabled={zoomLevel <= 60}
              className="text-slate-500"
            />
            <span className="text-xs font-mono text-slate-600 px-1.5 min-w-[42px] text-center select-none">
              {zoomLevel}%
            </span>
            <Button 
              type="text"
              size="small"
              icon={<ExpandOutlined />}
              onClick={() => handleZoom(zoomLevel + 10)}
              disabled={zoomLevel >= 140}
              className="text-slate-500"
            />
          </div>

          <Divider type="vertical" className="hidden sm:block h-5 my-0" />

          {/* Print Button */}
          <Button 
            size="small" 
            icon={<PrinterOutlined />} 
            onClick={handlePrintPreview}
            className="hidden sm:inline-flex items-center"
          >
            Print
          </Button>

          {/* Export Dropdown */}
          <Dropdown menu={{ items: exportItems }} placement="bottomRight">
            <Button type="primary" size="small" icon={<DownloadOutlined />} className="shadow-xs font-medium">
              Export
            </Button>
          </Dropdown>
          
          {/* Sider Toggle */}
          <Tooltip title={siderCollapsed ? "Show Options" : "Hide Options"}>
            <Button
              type={siderCollapsed ? "default" : "text"}
              size="small"
              icon={siderCollapsed ? <SettingOutlined /> : <CompressOutlined />}
              onClick={() => setSiderCollapsed(!siderCollapsed)}
              className="text-slate-600"
            />
          </Tooltip>
        </div>
      </Header>

      {/* Main Workspace Layout (Full Viewport) */}
      <Layout className="flex-1 flex flex-row min-h-0 overflow-hidden">
        {/* Email Canvas Viewport (Scalable & Full Scroll) */}
        <Content className="email-canvas-viewport flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
          <div 
            className="w-full flex justify-center transition-all duration-300 pb-12"
            style={{
              transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
              transformOrigin: 'top center',
            }}
          >
            <EmailPreview 
              html={templateHtml}
              previewData={previewData}
              templateId={templateId}
              templateName={templateName}
              availableVariables={availableVariables}
              onUpdatePreviewData={handleUpdatePreviewData}
              showToolbar={false}
              viewMode={viewMode}
            />
          </div>
        </Content>

        {/* Right Options Sidebar (Full Height Scrollable) */}
        <Sider
          width={340}
          theme="light"
          collapsible
          collapsed={siderCollapsed}
          onCollapse={setSiderCollapsed}
          collapsedWidth={0}
          trigger={null}
          className="print:hidden border-l border-slate-200/80 bg-white h-full flex flex-col overflow-hidden"
        >
          <div className="h-full flex flex-col overflow-hidden p-2">
            <Tabs
              defaultActiveKey="test-data"
              activeKey={activeTab}
              onChange={setActiveTab}
              items={sidebarTabs}
              tabBarStyle={{ padding: '0 8px', marginBottom: 8 }}
              className="h-full flex flex-col [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:overflow-hidden [&_.ant-tabs-content]:h-full [&_.ant-tabs-tabpane]:h-full [&_.ant-tabs-tabpane]:flex [&_.ant-tabs-tabpane]:flex-col"
            />
          </div>
        </Sider>
      </Layout>
      
      <FloatButton.Group
        trigger="hover"
        className="print:hidden sm:hidden"
        icon={<ToolOutlined />}
        tooltip="Tools"
      >
        <FloatButton
          icon={<PrinterOutlined />}
          tooltip="Print"
          onClick={handlePrintPreview}
        />
        <FloatButton
          icon={viewMode === 'desktop' ? <MobileFilled /> : <DesktopOutlined />}
          tooltip={viewMode === 'desktop' ? 'Mobile View' : 'Desktop View'}
          onClick={() => setViewMode(viewMode === 'desktop' ? 'mobile' : 'desktop')}
        />
        <FloatButton
          icon={siderCollapsed ? <EditOutlined /> : <EyeOutlined />}
          tooltip={siderCollapsed ? 'Show Editor' : 'Hide Editor'}
          onClick={() => setSiderCollapsed(!siderCollapsed)}
        />
      </FloatButton.Group>
    </Layout>
  )
}