"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getAllTemplates, 
  createTemplate,
  updateTemplate,
  deleteTemplate,
  updatePreviewData,
  templateToSimpleFormat,
  getPreviewDataObject,
  EmailTemplateWithRelations,
  addVariable,
  deleteVariable,
  TemplateVariable,
  updateVariable
} from '@/services/emailTemplateService'
import EmailTemplateEditor from '@/components/editor/EmailTemplateEditor'
import AddVariableComponent from '@/components/editor/variables/AddVariableComponent'
// Import Ant Design components
import { 
  Typography, 
  Select, 
  Input, 
  Button, 
  Space, 
  Card, 
  Alert, 
  Tag, 
  Divider,
  Layout,
  Popconfirm,
  Modal,
  message,
  Spin,
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  EyeOutlined, 
  SaveOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  MailOutlined
} from '@ant-design/icons'
import { Header } from 'antd/es/layout/layout'
import ExportOptionsComponent from '@/components/editor/sections/export/ExportOptionsComponent';
import { 
  exportRawTemplate, 
  exportTemplateWithData, 
  exportVariableSchema 
} from '@/services/exportService';
import LoaderComponent from '../LoaderComponent'

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Content } = Layout;

interface EmailTemplateManagerProps {
  onSelectTemplate?: (template: EmailTemplateWithRelations, html: string) => void;
}

const EmailTemplateManager: React.FC<EmailTemplateManagerProps> = ({ 
  onSelectTemplate 
}) => {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateWithRelations | null>(null)
  const [templateList, setTemplateList] = useState<EmailTemplateWithRelations[]>([])
  const [newTemplateName, setNewTemplateName] = useState<string>('')
  const [newTemplateDesc, setNewTemplateDesc] = useState<string>('')
  const [newTemplateModalOpen, setNewTemplateModalOpen] = useState<boolean>(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)
  const [currentHtml, setCurrentHtml] = useState<string>('')
  const [previewData, setPreviewData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [saveLoading, setSaveLoading] = useState<boolean>(false)
  const [createLoading, setCreateLoading] = useState<boolean>(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState<boolean>(false)
  const [forceEditorKey, setForceEditorKey] = useState<string>('editor-1') // Used to force re-render
  
  // Load templates from API
  useEffect(() => {
    loadTemplates();
  }, [])
  
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templates = await getAllTemplates();
      setTemplateList(templates);
      
      // Select first template if none selected
      if (templates.length > 0 && !selectedTemplate) {
        const firstTemplate = templates[0];
        setSelectedTemplate(firstTemplate);
        setCurrentHtml(firstTemplate.defaultContent);
        setPreviewData(getPreviewDataObject(firstTemplate));
        setHasUnsavedChanges(false);
        
        if (onSelectTemplate) {
          onSelectTemplate(firstTemplate, firstTemplate.defaultContent);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading templates:', error);
      message.error('Failed to load templates');
      setLoading(false);
    }
  };
  
  // Handle HTML changes
  const handleHtmlChange = (html: string) => {
    setCurrentHtml(html);
    setHasUnsavedChanges(true);
    
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate, html);
    }
  }
  
  // Save current template
  const saveCurrentTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      setSaveLoading(true);
      
      // Update the template content
      await updateTemplate(selectedTemplate.id, {
        defaultContent: currentHtml
      });
      
      // Update the preview data if it has changed
      await updatePreviewData(selectedTemplate.id, previewData);
      
      setHasUnsavedChanges(false);
      message.success('Template saved successfully');
      setSaveLoading(false);
    } catch (error) {
      console.error('Error saving template:', error);
      message.error('Failed to save template');
      setSaveLoading(false);
    }
  };
  
  // Create a new template
  const createNewTemplate = async () => {
    if (!newTemplateName.trim()) return;
    
    try {
      setCreateLoading(true);
      
      const newTemplate = await createTemplate({
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim(),
        defaultContent: '<h2>Welcome to our service</h2><p>Hi {{.firstName}},</p><p>We are thrilled to welcome you! Explore your new account today.</p>',
        variables: [
          { 
            key: 'firstName', 
            name: 'First Name', 
            type: 'TEXT', 
            required: false 
          },
          { 
            key: 'lastName', 
            name: 'Last Name', 
            type: 'TEXT', 
            required: false 
          },
          { 
            key: 'email', 
            name: 'Email', 
            type: 'EMAIL', 
            required: true 
          }
        ],
        previewData: {
          firstName: 'Alex',
          lastName: 'Morgan',
          email: 'alex.morgan@example.com'
        }
      });
      
      // Add to template list and select it
      setTemplateList(prev => [...prev, newTemplate]);
      setSelectedTemplate(newTemplate);
      setCurrentHtml(newTemplate.defaultContent);
      setPreviewData(getPreviewDataObject(newTemplate));
      setNewTemplateName('');
      setNewTemplateDesc('');
      setNewTemplateModalOpen(false);
      setHasUnsavedChanges(false);
      
      // Force re-render of editor
      setForceEditorKey(`editor-${Date.now()}`);
      
      if (onSelectTemplate) {
        onSelectTemplate(newTemplate, newTemplate.defaultContent);
      }
      
      message.success(`Template "${newTemplate.name}" created successfully`);
      setCreateLoading(false);
    } catch (error) {
      console.error('Error creating template:', error);
      message.error('Failed to create template');
      setCreateLoading(false);
    }
  };
  
  // Handle template selection change
  const handleTemplateChange = async (templateId: string) => {
    const selected = templateList.find(t => t.id === templateId);
    
    if (selected) {
      setSelectedTemplate(selected);
      setCurrentHtml(selected.defaultContent);
      setPreviewData(getPreviewDataObject(selected));
      
      // Force editor re-render with new content by changing the key
      setForceEditorKey(`editor-${Date.now()}`);
      
      if (onSelectTemplate) {
        onSelectTemplate(selected, selected.defaultContent);
      }
    }
  };
  
  // Delete the current template
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      await deleteTemplate(selectedTemplate.id);
      
      // Remove from list and select another template
      const updatedList = templateList.filter(t => t.id !== selectedTemplate.id);
      setTemplateList(updatedList);
      
      if (updatedList.length > 0) {
        const firstTemplate = updatedList[0];
        setSelectedTemplate(firstTemplate);
        setCurrentHtml(firstTemplate.defaultContent);
        setPreviewData(getPreviewDataObject(firstTemplate));
        
        // Force editor re-render
        setForceEditorKey(`editor-${Date.now()}`);
        
        if (onSelectTemplate) {
          onSelectTemplate(firstTemplate, firstTemplate.defaultContent);
        }
      } else {
        setSelectedTemplate(null);
        setCurrentHtml('');
        setPreviewData({});
      }
      
      message.success('Template deleted successfully');
      setDeleteConfirmVisible(false);
    } catch (error) {
      console.error('Error deleting template:', error);
      message.error('Failed to delete template');
      setDeleteConfirmVisible(false);
    }
  };
  
  // Preview the current template
  const previewCurrentTemplate = () => {
    if (!selectedTemplate) return;
    
    // Store current template in localStorage for the preview page
    localStorage.setItem('preview-template-id', selectedTemplate.id);
    localStorage.setItem('preview-template-html', currentHtml);
    localStorage.setItem('preview-template-data', JSON.stringify(previewData));
    localStorage.setItem('preview-template-name', selectedTemplate.name);
    
    // Navigate to preview page
    router.push('/email-preview');
  };
  
  // Handle adding a new variable
const handleAddVariable = async (variableName: string) => {
  if (!selectedTemplate) return;
  
  try {
    // First check if variable already exists
    if (selectedTemplate.variables.some(v => v.key === variableName)) {
      message.error(`Variable ${variableName} already exists`);
      return;
    }
    
    // Format the display name from the key
    const displayName = variableName.charAt(0).toUpperCase() + 
      variableName.slice(1).replace(/([A-Z])/g, ' $1').trim();
    
    // Add the variable through the API
    const newVariable = await addVariable(selectedTemplate.id, {
      key: variableName,
      name: displayName,
      type: 'TEXT',
      required: false
    });
    
    // Update local state
    setSelectedTemplate(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        variables: [...prev.variables, newVariable]
      };
    });
    
    // Update preview data with an empty value for the new variable
    const updatedPreviewData = { ...previewData, [variableName]: '' };
    setPreviewData(updatedPreviewData);
    
    // Update preview data in the database
    await updatePreviewData(selectedTemplate.id, updatedPreviewData);
    
    message.success(`Variable {{.${variableName}}} added successfully`);
  } catch (error) {
    console.error('Error adding variable:', error);
    message.error('Failed to add variable');
  }
};
  
// Handle variable deletion
const handleDeleteVariable = async (variableName: string) => {
  if (!selectedTemplate) return;
  
  try {
    // Find the variable to delete
    const variableToDelete = selectedTemplate.variables.find(v => v.key === variableName);
    
    if (!variableToDelete) {
      message.error(`Variable ${variableName} not found`);
      return;
    }
    
    // Delete the variable from the database
    await deleteVariable(selectedTemplate.id, variableToDelete.id);
    
    // Update local state
    setSelectedTemplate(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        variables: prev.variables.filter(v => v.key !== variableName)
      };
    });
    
    // Update preview data by removing the variable
    const updatedPreviewData = { ...previewData };
    delete updatedPreviewData[variableName];
    setPreviewData(updatedPreviewData);
    
    // Update preview data in the database
    await updatePreviewData(selectedTemplate.id, updatedPreviewData);
    
    message.success(`Variable ${variableName} deleted successfully`);
  } catch (error) {
    console.error('Error deleting variable:', error);
    message.error('Failed to delete variable');
  }
};

// Handle variable update
const handleUpdateVariable = async (variableId: string, updates: Partial<TemplateVariable>) => {
  if (!selectedTemplate) return;
  
  try {
    // Update the variable in the database
    const updatedVariable = await updateVariable(selectedTemplate.id, variableId, updates);
    
    // Update local state
    setSelectedTemplate(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        variables: prev.variables.map(v => v.id === variableId ? updatedVariable : v)
      };
    });
    
    message.success('Variable updated successfully');
  } catch (error) {
    console.error('Error updating variable:', error);
    message.error('Failed to update variable');
  }
};

  // Get variables for the selected template
  const getVariableKeys = () => {
    if (!selectedTemplate) return [];
    return selectedTemplate.variables.map(v => v.key);
  };
  
  // Calculate whether the template can be deleted
  const canDeleteTemplate = selectedTemplate && !selectedTemplate.isSystem;
  
  if (loading) {
    return <LoaderComponent />;
  }
  
  return (
    <div className="email-app-shell h-screen flex flex-col overflow-hidden bg-slate-100/70">
      {/* Studio Top Navigation Bar */}
      <header className="studio-topbar px-4 lg:px-6 py-2.5 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shrink-0 z-40">
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Template Selector */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-xs">
              <MailOutlined className="text-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm tracking-tight">Email Studio</span>
                <span className="text-slate-300 font-light">/</span>
                <Select
                  value={selectedTemplate?.id}
                  onChange={handleTemplateChange}
                  className="min-w-[180px]"
                  size="small"
                  popupMatchSelectWidth={false}
                  popupRender={(menu) => (
                    <div>
                      {menu}
                      <Divider className="my-1" />
                      <div className="p-1">
                        <Button 
                          type="text" 
                          icon={<PlusOutlined />} 
                          block 
                          size="small" 
                          className="text-left text-indigo-600 font-medium hover:bg-indigo-50"
                          onClick={() => setNewTemplateModalOpen(true)}
                        >
                          New Template...
                        </Button>
                      </div>
                    </div>
                  )}
                >
                  {templateList.map(template => (
                    <Option key={template.id} value={template.id}>
                      <Space>
                        <span className="font-medium">{template.name}</span>
                        {template.isSystem && <Tag color="blue" className="text-[10px] rounded-full px-1.5 py-0 m-0">System</Tag>}
                      </Space>
                    </Option>
                  ))}
                </Select>
                
                {selectedTemplate?.isSystem ? (
                  <Tag color="blue" className="text-xs rounded-full px-2 py-0.5 m-0 font-medium">System Template</Tag>
                ) : (
                  <Tag color="default" className="text-xs rounded-full px-2 py-0.5 m-0 font-medium text-slate-600">Custom Template</Tag>
                )}
              </div>
              
              {/* Save Status & Description */}
              <div className="flex items-center gap-2 mt-0.5">
                {hasUnsavedChanges ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Unsaved edits
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    All changes saved
                  </span>
                )}
                {selectedTemplate?.description && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-xs">{selectedTemplate.description}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Group */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={() => setNewTemplateModalOpen(true)}
            >
              New Template
            </Button>

            {selectedTemplate && (
              <>
                <Button 
                  type="default" 
                  icon={<EyeOutlined />} 
                  onClick={previewCurrentTemplate}
                >
                  Full Preview
                </Button>

                <ExportOptionsComponent
                  html={selectedTemplate.defaultContent}
                  rawTemplateHtml={selectedTemplate.defaultContent}
                  previewData={previewData}
                  templateId={selectedTemplate.id}
                  templateName={selectedTemplate.name}
                />

                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={saveCurrentTemplate}
                  loading={saveLoading}
                  className="shadow-xs font-medium"
                >
                  Save
                </Button>

                {canDeleteTemplate && (
                  <Tooltip title="Delete this template">
                    <Button 
                      type="text" 
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setDeleteConfirmVisible(true)}
                    />
                  </Tooltip>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="w-full flex-1 flex flex-col min-h-0 p-2 sm:p-3 lg:p-4 overflow-hidden">
        {selectedTemplate ? (
          <EmailTemplateEditor 
            key={forceEditorKey}
            initialContent={currentHtml}
            templateId={selectedTemplate.id}
            availableVariables={getVariableKeys()}
            onHtmlChange={handleHtmlChange}
            previewData={previewData}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-12">
            <Card className="max-w-md text-center shadow-sm border-slate-200">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <MailOutlined className="text-xl" />
              </div>
              <Title level={4} className="!mb-1">No Template Selected</Title>
              <Text type="secondary" className="block mb-4">
                Choose an existing template or create a new campaign to get started.
              </Text>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewTemplateModalOpen(true)}>
                Create Template
              </Button>
            </Card>
          </div>
        )}
      </main>

      {/* Create New Template Modal */}
      <Modal
        title={
          <div>
            <div className="text-base font-semibold text-slate-900">Create New Template</div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">Start building a responsive email template with pre-configured variables</p>
          </div>
        }
        open={newTemplateModalOpen}
        onCancel={() => setNewTemplateModalOpen(false)}
        onOk={createNewTemplate}
        okText="Create Template"
        confirmLoading={createLoading}
        okButtonProps={{ disabled: !newTemplateName.trim() }}
        centered
        width={480}
      >
        <div className="space-y-4 my-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Template Name *</label>
            <Input
              placeholder="e.g. Weekly Product Digest, Order Confirmation"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              autoFocus
              onPressEnter={createNewTemplate}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
            <Input.TextArea
              placeholder="Brief summary of this email campaign"
              rows={2}
              value={newTemplateDesc}
              onChange={(e) => setNewTemplateDesc(e.target.value)}
            />
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-700 mb-1">Included Starter Variables:</p>
            <div className="flex gap-2">
              <span className="variable-pill">{'{{.firstName}}'}</span>
              <span className="variable-pill">{'{{.lastName}}'}</span>
              <span className="variable-pill">{'{{.email}}'}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Template"
        open={deleteConfirmVisible}
        onCancel={() => setDeleteConfirmVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteConfirmVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="delete" 
            type="primary" 
            danger
            onClick={handleDeleteTemplate}
          >
            Delete
          </Button>
        ]}
        centered
        width={440}
      >
        <p className="text-sm text-slate-700">Are you sure you want to delete the template <strong>"{selectedTemplate?.name}"</strong>?</p>
        <p className="text-xs text-rose-600 mt-1 font-medium">This action cannot be undone.</p>
      </Modal>
    </div>
  )
}

export default EmailTemplateManager
