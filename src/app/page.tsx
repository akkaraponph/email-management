"use client"
import { useState } from 'react'
import EmailTemplateManager from '@/components/editor/EmailTemplateManager'
import { ConfigProvider, App } from "antd"
import { EmailTemplateWithRelations } from '@/services/emailTemplateService'

export default function EditorPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateWithRelations | null>(null)
  const [currentHtml, setCurrentHtml] = useState<string>('')
  
  const handleSelectTemplate = (template: EmailTemplateWithRelations, html: string) => {
    setSelectedTemplate(template)
    setCurrentHtml(html)
  }
  
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          colorInfo: '#4f46e5',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorText: '#0f172a',
          colorTextSecondary: '#64748b',
          colorBorder: '#e2e8f0',
          colorBorderSecondary: '#f1f5f9',
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f8fafc',
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,
          fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 14,
        },
        components: {
          Button: {
            controlHeight: 38,
            controlHeightSM: 30,
            controlHeightLG: 44,
            borderRadius: 8,
            fontWeight: 500,
            paddingInline: 14,
          },
          Card: {
            borderRadiusLG: 12,
            headerHeight: 48,
          },
          Tabs: {
            titleFontSize: 14,
            horizontalItemPadding: '10px 16px',
            inkBarColor: '#4f46e5',
            itemSelectedColor: '#4f46e5',
            itemHoverColor: '#6366f1',
          },
          Input: {
            controlHeight: 38,
            borderRadius: 8,
          },
          Select: {
            controlHeight: 38,
            borderRadius: 8,
          },
          Modal: {
            borderRadiusLG: 16,
          },
        }
      }}
    >
      <App>
        <main className="email-workspace text-slate-900">
          <EmailTemplateManager 
            onSelectTemplate={handleSelectTemplate}
          />
        </main>
      </App>
    </ConfigProvider>
  )
}

