// Modified version of EmailTemplateEditor.tsx with key prop to force re-render

"use client"
import { useEditor, EditorContent } from '@tiptap/react'
import SandboxedEmailPreview from '@/components/SandboxedEmailPreview';
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import { useState, useEffect, useCallback } from 'react'
import { Node } from '@tiptap/core'
import { PreviewData, TemplateVariable } from '@/types/email-templates'
import { 
  getVariablesByTemplateId, 
  addVariable, 
  updateVariable, 
  deleteVariable, 
  updatePreviewData 
} from '@/services/emailTemplateService';
import ExportOptionsComponent from '@/components/editor/sections/export/ExportOptionsComponent';

import ImageUploadComponent from '@/components/editor/sections/ImageUploadComponent';
import EmailSectionsComponent from '@/components/editor/sections/EmailSectionsComponent';
import EmailTableComponent from '@/components/editor/sections/EmailTableComponent';
import SocialLinksComponent from '@/components/editor/sections/SocialLinksComponent';

// Import Ant Design components
import { Button, Select, Tooltip, Divider, Input, Card, Typography, Space, Tabs, Modal, Form, message, Radio, ColorPicker } from 'antd'
import type { TabsProps } from 'antd'
import { 
  BoldOutlined, 
  ItalicOutlined, 
  StrikethroughOutlined,
  AlignLeftOutlined, 
  AlignCenterOutlined, 
  AlignRightOutlined,
  LinkOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DownloadOutlined,
  FontColorsOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  EditOutlined,
  BgColorsOutlined,
  UndoOutlined,
  RedoOutlined,
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined,
  AppstoreOutlined,
  SplitCellsOutlined
} from '@ant-design/icons'
import VariableTabs from './variables/VariableTabsComponent'
import AddVariableComponent from './variables/AddVariableComponent'
import EmailTemplateBackgroundEditor from './background/EmailTemplateBackgroundEditor'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Table from '@tiptap/extension-table'

const { Title, Text } = Typography;
const { Option } = Select;

// Define custom variable node
const Variable = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      name: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="variable"]',
      },
    ]
  },

  renderHTML({ node }) {
    return ['span', { 'data-type': 'variable', class: 'variable bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-sm font-medium' }, `{{.${node.attrs.name}}}`]
  },
})

interface EmailTemplateEditorProps {
  initialContent?: string;
  templateId?: string;
  availableVariables?: string[];
  onHtmlChange?: (html: string) => void;
  previewData?: PreviewData;
  onVariablesChange?: (variables: string[]) => void;
  // onAddVariable: (variableName: string) => Promise<void>;
  // onDeleteVariable: (variableName: string) => Promise<void>;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  initialContent = '',
  templateId = 'default-template',
  availableVariables = ['firstName', 'lastName', 'companyName', 'email'],
  onHtmlChange,
  previewData = {},
  onVariablesChange,
  // onAddVariable,
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [htmlOutput, setHtmlOutput] = useState<string>('')
  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [editorViewMode, setEditorViewMode] = useState<'edit' | 'split' | 'preview'>('edit')
  const [sidebarTab, setSidebarTab] = useState<'variables' | 'blocks'>('variables')
  const [localPreviewData, setLocalPreviewData] = useState<PreviewData>(previewData)
  const [variables, setVariables] = useState<string[]>(availableVariables)
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false)
  const [editingVariable, setEditingVariable] = useState<string>('')
  const [newVariableName, setNewVariableName] = useState<string>('')
  const [form] = Form.useForm();
  const [activeTabKey, setActiveTabKey] = useState<string>('content');

  
  const [variablesLoading, setVariablesLoading] = useState<boolean>(false);
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Type your email template here...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image, // Add this
      Table.configure({ // Add these table extensions
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
      Variable,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlOutput(html);
      if (onHtmlChange) {
        onHtmlChange(html);
      }
      localStorage.setItem(`email-template-${templateId}`, html);
    },
  })

  // Reset editor content when templateId or initialContent changes
  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
      setHtmlOutput(editor.getHTML());
    }
  }, [editor, initialContent, templateId]);

  // Load template variables from database if templateId is provided
  useEffect(() => {
    if (templateId && templateId !== 'default-template') {
      setVariablesLoading(true);
      getVariablesByTemplateId(templateId)
        .then(variables => {
          setTemplateVariables(variables.map(variable => ({
            ...variable,
            type: variable.type.toLowerCase() as TemplateVariable['type'],
          })));
          setVariables(variables.map(v => v.key));
          setVariablesLoading(false);
        })
        .catch(error => {
          console.error('Error loading template variables:', error);
          setVariablesLoading(false);
        });
    } else {
      // Use the provided availableVariables if no templateId
      setVariables(availableVariables);
    }
  }, [templateId, availableVariables]);


  // Handle Next.js hydration
  useEffect(() => {
    setIsMounted(true)
    
    // Load saved template if available
    const savedTemplate = localStorage.getItem(`email-template-${templateId}`);
    if (savedTemplate && editor && !initialContent) {
      editor.commands.setContent(savedTemplate);
    }

    // Initialize variables state
    setVariables(availableVariables);
  }, [editor, initialContent, templateId, availableVariables])

  // Update local preview data when prop changes
  useEffect(() => {
    setLocalPreviewData(previewData);
  }, [previewData]);

  // Insert variable at cursor position
  const insertVariable = useCallback((variableName: string) => {
    if (!editor) return;
    
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'variable',
        attrs: { name: variableName },
      })
      .run();
  }, [editor])

  // Add a new variable
  const handleAddVariable = async (variableName: string) => {
    // Check if variable already exists
    if (variables.includes(variableName)) {
      return;
    }
    
    // Add the new variable to the list
    const updatedVariables = [...variables, variableName];
    setVariables(updatedVariables);
    
    // Update parent component if needed
    if (onVariablesChange) {
      onVariablesChange(updatedVariables);
    }
    
    // Add to preview data
    const updatedPreviewData = {
      ...localPreviewData,
      [variableName]: ''
    };
    
    setLocalPreviewData(updatedPreviewData);
    
    // If templateId is provided, save preview data to database
    if (templateId && templateId !== 'default-template') {
      try {
        await updatePreviewData(templateId, updatedPreviewData);
      } catch (error) {
        console.error('Error updating preview data:', error);
        message.error('Failed to update preview data');
      }
    }
  };

  // Show edit modal for a variable
  const showEditModal = (variable: string) => {
    setEditingVariable(variable);
    setNewVariableName(variable);
    setIsEditModalVisible(true);
  };

 // Handle variable rename in the database
 const handleRenameVariable = async () => {
  if (!newVariableName || newVariableName === editingVariable) {
    setIsEditModalVisible(false);
    return;
  }
  
  // Check if new name already exists
  if (variables.includes(newVariableName)) {
    message.error(`Variable ${newVariableName} already exists`);
    return;
  }
  
  // Update the HTML content to replace all instances of the old variable with the new one
  if (editor) {
    const oldPattern = new RegExp(`{{\.${editingVariable}}}`, 'g');
    const newReplacement = `{{.${newVariableName}}}`;
    
    // Get current HTML and replace variable references
    const currentHtml = editor.getHTML();
    const updatedHtml = currentHtml.replace(oldPattern, newReplacement);
    
    // Update editor content
    editor.commands.setContent(updatedHtml);
  }
  
  // If we have a templateId, update the variable in the database
  if (templateId && templateId !== 'default-template') {
    try {
      // Find the variable in templateVariables
      const variableToUpdate = templateVariables.find(v => v.key === editingVariable);
      
      if (variableToUpdate) {
        await updateVariable(templateId, variableToUpdate.id, {
          key: newVariableName,
          name: newVariableName.charAt(0).toUpperCase() + newVariableName.slice(1).replace(/([A-Z])/g, ' $1').trim()
        });
        
        // Update local templateVariables state
        setTemplateVariables(prev => 
          prev.map(v => v.key === editingVariable 
            ? { ...v, key: newVariableName, name: newVariableName.charAt(0).toUpperCase() + newVariableName.slice(1).replace(/([A-Z])/g, ' $1').trim() } 
            : v
          )
        );
      }
    } catch (error) {
      console.error('Error updating variable in database:', error);
      message.error('Failed to update variable in database');
      setIsEditModalVisible(false);
      return;
    }
  }
  
  // Update variables list
  const updatedVariables = variables.map(v => v === editingVariable ? newVariableName : v);
  setVariables(updatedVariables);
  
  // Update parent component if needed
  if (onVariablesChange) {
    onVariablesChange(updatedVariables);
  }
  
  // Update preview data
  const updatedPreviewData = { ...localPreviewData };
  if (editingVariable in updatedPreviewData) {
    updatedPreviewData[newVariableName] = updatedPreviewData[editingVariable];
    delete updatedPreviewData[editingVariable];
    setLocalPreviewData(updatedPreviewData);
    
    // If templateId is provided, save preview data to database
    if (templateId && templateId !== 'default-template') {
      try {
        await updatePreviewData(templateId, updatedPreviewData);
      } catch (error) {
        console.error('Error updating preview data:', error);
        message.error('Failed to update preview data');
      }
    }
  }
  
  setIsEditModalVisible(false);
  message.success(`Variable renamed from ${editingVariable} to ${newVariableName}`);
};
  // Handle variable deletion
  const handleDeleteVariable = async (variableName: string) => {
    // If we have a templateId, delete the variable from the database
    if (templateId && templateId !== 'default-template') {
      try {
        // Find the variable in templateVariables
        const variableToDelete = templateVariables.find(v => v.key === variableName);
        
        if (variableToDelete) {
          await deleteVariable(templateId, variableToDelete.id);
          
          // Update local templateVariables state
          setTemplateVariables(prev => prev.filter(v => v.key !== variableName));
        }
      } catch (error) {
        console.error('Error deleting variable from database:', error);
        message.error('Failed to delete variable from database');
        return;
      }
    }
    
    // Update variables list
    const updatedVariables = variables.filter(v => v !== variableName);
    setVariables(updatedVariables);
    
    // Update parent component if needed
    if (onVariablesChange) {
      onVariablesChange(updatedVariables);
    }
    
    // Update preview data
    const updatedPreviewData = { ...localPreviewData };
    delete updatedPreviewData[variableName];
    setLocalPreviewData(updatedPreviewData);
    
    // If templateId is provided, save preview data to database
    if (templateId && templateId !== 'default-template') {
      try {
        await updatePreviewData(templateId, updatedPreviewData);
      } catch (error) {
        console.error('Error updating preview data:', error);
        message.error('Failed to update preview data');
      }
    }
    
    message.success(`Variable ${variableName} deleted successfully`);
  };

  // FIXED: Generate preview with variables replaced
  const getPreviewHTML = useCallback(() => {
    if (!htmlOutput) return '';
    
    let previewHTML = htmlOutput;
    
    // Replace all variables with their values
    if (localPreviewData && Object.keys(localPreviewData).length > 0) {
      Object.entries(localPreviewData).forEach(([key, value]) => {
        // More robust regex pattern that properly escapes the dot
        const regex = new RegExp(`{{\\s*\\.\\s*${key}\\s*}}`, 'g');
        previewHTML = previewHTML.replace(regex, String(value || ''));
      });
    }
    
    return previewHTML;
  }, [htmlOutput, localPreviewData])

  // Export the template HTML with backgrounds and structure
  const exportTemplate = useCallback(() => {
    // Get current content
    const templateContent = editor?.getHTML() || '';
    
    // Create a DOM parser for proper HTML structure
    const parser = new DOMParser();
    
    // First check if we have a properly structured email template
    // by wrapping the current content in a basic structure
    let exportDoc = parser.parseFromString(`
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #D9D9D9;">
  <div style="width: 100%; margin: 0 auto; background-color: #D9D9D9;">
    <div style="max-width: 650px; margin: 0 auto; background-color: #FFFFFF;">
  
      <div style="padding: 40px 20px; background-color: #FFFFFF;">
        ${templateContent}
      </div>
    
    </div>
  </div>
</body>
</html>
    `, 'text/html');

    // Check if the current htmlOutput already has our structure
    // If so, use that instead of the default structure
    if (htmlOutput.includes('width: 100%; margin: 0 auto;')) {
      // The current HTML already has structure, use it entirely
      exportDoc = parser.parseFromString(htmlOutput, 'text/html');
    }
    
    // Replace variables with their preview values for export
    if (localPreviewData && Object.keys(localPreviewData).length > 0) {
      const bodyHTML = exportDoc.body.innerHTML;
      let updatedHTML = bodyHTML;
      
      Object.entries(localPreviewData).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*\\.\\s*${key}\\s*}}`, 'g');
        updatedHTML = updatedHTML.replace(regex, String(value || ''));
      });
      
      exportDoc.body.innerHTML = updatedHTML;
    }
    
    // Get the complete HTML
    const emailSafeHTML = exportDoc.documentElement.outerHTML;
    
    // Download as HTML file
    const blob = new Blob([emailSafeHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-template-${templateId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [editor, templateId, htmlOutput, localPreviewData])

  // Format a variable key to follow conventions
  const formatVariableKey = (input: string) => {
    return input
      .trim()
      .replace(/\s+/g, '')      // Remove spaces
      .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
      .replace(/^[0-9]/, '')     // Ensure doesn't start with a number
      .replace(/^\w/, c => c.toLowerCase()); // Start with lowercase
  };

  // Style rules for editor
  const editorClassNames = `
    prose max-w-none min-h-[300px] focus:outline-none p-4
  `;

  // Style override for editor content
  useEffect(() => {
    if (editor) {
      // Add custom styles for the variable nodes in the editor
      const style = document.createElement('style');
      style.innerHTML = `
        .ProseMirror .variable {
          background-color: rgba(59, 130, 246, 0.1);
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
          color: rgb(29, 78, 216);
          font-weight: 500;
          white-space: nowrap;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          min-height: 300px;
          padding: 1rem;
          border-radius: 0.375rem;
        }
        .ant-tabs-content {
          height: 100%;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [editor]);

  // Define Editor Toolbar
  const EditorToolbar = () => (
    <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
      {/* Left Formatting Group */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* History */}
        <Space.Compact size="small">
          <Tooltip title="Undo (Ctrl+Z)">
            <Button 
              icon={<UndoOutlined />} 
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={editorViewMode === 'preview' || !editor?.can().undo()}
            />
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <Button 
              icon={<RedoOutlined />} 
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={editorViewMode === 'preview' || !editor?.can().redo()}
            />
          </Tooltip>
        </Space.Compact>

        <Divider type="vertical" className="h-6 mx-0.5" />

        {/* Text Hierarchy */}
        <Select
          size="small"
          value={
            editor?.isActive('heading', { level: 1 }) ? 'h1' :
            editor?.isActive('heading', { level: 2 }) ? 'h2' :
            editor?.isActive('heading', { level: 3 }) ? 'h3' : 'p'
          }
          onChange={(val) => {
            if (val === 'p') editor?.chain().focus().setParagraph().run();
            else if (val === 'h1') editor?.chain().focus().toggleHeading({ level: 1 }).run();
            else if (val === 'h2') editor?.chain().focus().toggleHeading({ level: 2 }).run();
            else if (val === 'h3') editor?.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          options={[
            { value: 'p', label: 'Body' },
            { value: 'h1', label: 'Heading 1' },
            { value: 'h2', label: 'Heading 2' },
            { value: 'h3', label: 'Heading 3' },
          ]}
          style={{ width: 105 }}
          disabled={editorViewMode === 'preview'}
        />

        {/* Style Controls */}
        <Space.Compact size="small">
          <Tooltip title="Bold">
            <Button 
              type={editor?.isActive('bold') ? 'primary' : 'default'}
              icon={<BoldOutlined />} 
              onClick={() => editor?.chain().focus().toggleBold().run()}
              disabled={editorViewMode === 'preview'}
            />
          </Tooltip>
          <Tooltip title="Italic">
            <Button 
              type={editor?.isActive('italic') ? 'primary' : 'default'}
              icon={<ItalicOutlined />} 
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              disabled={editorViewMode === 'preview'}
            />
          </Tooltip>
          <Tooltip title="Strikethrough">
            <Button 
              type={editor?.isActive('strike') ? 'primary' : 'default'}
              icon={<StrikethroughOutlined />} 
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              disabled={editorViewMode === 'preview'}
            />
          </Tooltip>
        </Space.Compact>

        {/* Text Color Picker */}
        <Tooltip title="Text Color">
          <ColorPicker
            size="small"
            value={editor?.getAttributes('textStyle').color || '#000000'}
            onChange={(color) => {
              editor?.chain().focus().setColor(color.toHexString()).run();
            }}
            disabled={editorViewMode === 'preview'}
            presets={[
              {
                label: 'Presets',
                colors: ['#000000', '#334155', '#4f46e5', '#2563eb', '#059669', '#dc2626', '#7c3aed', '#d97706'],
              }
            ]}
          />
        </Tooltip>

        <Divider type="vertical" className="h-6 mx-0.5" />

        {/* Alignment Controls */}
        <Space.Compact size="small">
          <Tooltip title="Align Left">
            <Button 
              type={editor?.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
              icon={<AlignLeftOutlined />} 
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              disabled={editorViewMode === 'preview'}
            />
          </Tooltip>
          <Tooltip title="Align Center">
            <Button 
              type={editor?.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
              icon={<AlignCenterOutlined />} 
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              disabled={editorViewMode === 'preview'}
            />
          </Tooltip>
          <Tooltip title="Align Right">
            <Button 
              type={editor?.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
              icon={<AlignRightOutlined />} 
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              disabled={editorViewMode === 'preview'}
            />
          </Tooltip>
        </Space.Compact>

        <Divider type="vertical" className="h-6 mx-0.5" />

        {/* Lists Controls */}
        <Space.Compact size="small">
          <Tooltip title="Bullet List">
            <Button 
              type={editor?.isActive('bulletList') ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />} 
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              disabled={editorViewMode === 'preview'}
            />
          </Tooltip>
          <Tooltip title="Ordered List">
            <Button 
              type={editor?.isActive('orderedList') ? 'primary' : 'default'}
              icon={<OrderedListOutlined />} 
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              disabled={editorViewMode === 'preview'}
            />
          </Tooltip>
        </Space.Compact>

        {/* Add Link */}
        <Tooltip title="Insert Link">
          <Button 
            size="small"
            type={editor?.isActive('link') ? 'primary' : 'default'}
            icon={<LinkOutlined />} 
            onClick={() => {
              const url = window.prompt('Enter the URL:');
              if (url) {
                editor?.chain().focus().setLink({ href: url }).run();
              } else if (url === '') {
                editor?.chain().focus().unsetLink().run();
              }
            }}
            disabled={editorViewMode === 'preview'}
          />
        </Tooltip>

        <Divider type="vertical" className="h-6 mx-0.5" />

        {/* Email Blocks */}
        <Space size="small">
          <ImageUploadComponent editor={editor} />
          <EmailSectionsComponent editor={editor} />
          <EmailTableComponent editor={editor} />
          <SocialLinksComponent editor={editor} />
        </Space>
      </div>

      {/* Right Mode & Viewport Controls */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Device Viewport Selector */}
        {editorViewMode !== 'split' && (
          <Radio.Group 
            value={deviceViewport} 
            onChange={(e) => setDeviceViewport(e.target.value)}
            size="small"
            optionType="button"
            buttonStyle="solid"
          >
            <Tooltip title="Desktop (650px)">
              <Radio.Button value="desktop"><DesktopOutlined /></Radio.Button>
            </Tooltip>
            <Tooltip title="Tablet (480px)">
              <Radio.Button value="tablet"><TabletOutlined /></Radio.Button>
            </Tooltip>
            <Tooltip title="Mobile (375px)">
              <Radio.Button value="mobile"><MobileOutlined /></Radio.Button>
            </Tooltip>
          </Radio.Group>
        )}

        {/* View Mode Toggle: Edit / Split / Preview */}
        <Radio.Group
          value={editorViewMode}
          onChange={(e) => {
            setEditorViewMode(e.target.value);
          }}
          size="small"
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="edit">
            <EditOutlined className="mr-1" /> Edit
          </Radio.Button>
          <Radio.Button value="split">
            <SplitCellsOutlined className="mr-1" /> Split Live
          </Radio.Button>
          <Radio.Button value="preview">
            <EyeOutlined className="mr-1" /> Preview
          </Radio.Button>
        </Radio.Group>
      </div>
    </div>
  );
    
  // Define tabs for the editor
  const tabItems: TabsProps['items'] = [
    {
      key: 'content',
      label: (
        <span className="font-medium text-sm flex items-center gap-1.5">
          <EditOutlined /> Content Studio
        </span>
      ),
      children: (
        <div className="flex-1 flex flex-col min-h-0 h-full">
          {/* Editor Toolbar */}
          <EditorToolbar />
          
          {/* Main Studio Area */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 h-full overflow-hidden">
            {/* Center Stage: Canvas */}
            <div className="flex-1 email-canvas-viewport p-4 sm:p-6 overflow-y-auto flex flex-col items-center">
              {/* EDIT MODE */}
              {editorViewMode === 'edit' && (
                <div 
                  className={`email-paper w-full transition-all duration-300 ${
                    deviceViewport === 'mobile' 
                      ? 'max-w-[375px]' 
                      : deviceViewport === 'tablet' 
                        ? 'max-w-[500px]' 
                        : 'max-w-[780px]'
                  }`}
                >
                  <div className="bg-slate-50/90 border-b border-slate-100 px-4 py-2 flex items-center justify-between text-xs text-slate-500 rounded-t-lg">
                    <span className="font-semibold text-slate-700">Email Canvas</span>
                    <span className="font-mono text-[11px] text-slate-400 capitalize">
                      {deviceViewport} Viewport
                    </span>
                  </div>
                  <div className="p-4 sm:p-6 bg-white min-h-[calc(100vh-270px)] rounded-b-lg">
                    <EditorContent editor={editor} className={editorClassNames} />
                  </div>
                </div>
              )}

              {/* SPLIT VIEW MODE: WYSIWYG on Left, Live Mock Output on Right */}
              {editorViewMode === 'split' && (
                <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                  {/* Left: Editor */}
                  <div className="email-paper overflow-hidden flex flex-col rounded-lg">
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 flex justify-between items-center">
                      <span>Editor</span>
                      <span className="text-slate-400 font-normal text-[11px]">Type & format</span>
                    </div>
                    <div className="p-4 sm:p-5 bg-white min-h-[calc(100vh-270px)] flex-1 overflow-y-auto">
                      <EditorContent editor={editor} className={editorClassNames} />
                    </div>
                  </div>

                  {/* Right: Live Rendered Output with variables replaced */}
                  <div className="email-paper overflow-hidden flex flex-col rounded-lg">
                    <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2 text-xs font-semibold text-indigo-900 flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live Preview (Mock Data)
                      </span>
                      <span className="text-indigo-500 font-mono text-[10px]">Real-time Interpolation</span>
                    </div>
                    <SandboxedEmailPreview title="Live email preview" html={getPreviewHTML()} className="w-full min-h-[calc(100vh-270px)] bg-white flex-1 border-0" />
                  </div>
                </div>
              )}

              {/* FULL PREVIEW MODE */}
              {editorViewMode === 'preview' && (
                <div 
                  className={`email-paper w-full transition-all duration-300 ${
                    deviceViewport === 'mobile' 
                      ? 'max-w-[375px]' 
                      : deviceViewport === 'tablet' 
                        ? 'max-w-[500px]' 
                        : 'max-w-[780px]'
                  }`}
                >
                  <div className="bg-slate-50 border-b border-slate-100 p-4 rounded-t-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-semibold text-slate-800">Preview: {templateId}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      To: {localPreviewData.email || 'recipient@example.com'}
                    </div>
                  </div>
                  <SandboxedEmailPreview title="Email preview" html={getPreviewHTML()} className="w-full min-h-[calc(100vh-270px)] bg-white rounded-b-lg border-0" />
                </div>
              )}
            </div>
            
            {/* Right Studio Sidebar */}
            <div className="w-full lg:w-84 xl:w-96 border-t lg:border-t-0 lg:border-l border-slate-200/80 bg-white p-4 flex flex-col h-full overflow-hidden shrink-0">
              {/* Sidebar Header & Add Variable Button */}
              <div className="flex items-center justify-between mb-3 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Template Data</span>
                <AddVariableComponent 
                  existingVariables={variables}
                  onAddVariable={handleAddVariable}
                  templateId={templateId}
                />
              </div>

              {/* Quick Variable Insert Pills */}
              <div className="mb-4 shrink-0">
                <Text className="text-xs text-slate-400 block mb-1.5">Click tag to insert into editor:</Text>
                <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto p-2 bg-slate-50/70 border border-slate-100 rounded-lg">
                  {variables.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No variables yet</span>
                  ) : (
                    variables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        disabled={editorViewMode === 'preview'}
                        className="variable-pill hover:shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>{`{{.${variable}}}`}</span>
                        <Tooltip title="Rename variable">
                          <EditOutlined
                            className="text-[10px] ml-1 text-indigo-400 hover:text-indigo-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              showEditModal(variable);
                            }}
                          />
                        </Tooltip>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <Divider className="my-2 shrink-0" />

              {/* Variables List & Test Data Values */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <VariableTabs 
                  availableVariables={variables}
                  insertVariable={insertVariable}
                  previewMode={false}
                  localPreviewData={localPreviewData}
                  setLocalPreviewData={setLocalPreviewData}
                  onEditVariable={showEditModal}
                  onDeleteVariable={handleDeleteVariable}
                  templateId={templateId}
                />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'preview',
      label: (
        <span className="font-medium text-sm flex items-center gap-1.5">
          <BgColorsOutlined /> Background & Layout
        </span>
      ),
      children: (
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <EmailTemplateBackgroundEditor
            currentHtml={htmlOutput || initialContent}
            templateId={templateId}
            onHtmlChange={(html) => {
              if (editor) {
                editor.commands.setContent(html);
              }
              if (onHtmlChange) {
                onHtmlChange(html);
              }
              setHtmlOutput(html);
            }}
          />
        </div>
      ),
    },
  ];

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col h-full rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      <Tabs 
        activeKey={activeTabKey} 
        onChange={setActiveTabKey}
        items={tabItems}
        className="email-template-editor-tabs h-full flex flex-col [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:flex [&_.ant-tabs-content]:flex-1 [&_.ant-tabs-content]:h-full [&_.ant-tabs-tabpane]:h-full [&_.ant-tabs-tabpane]:flex [&_.ant-tabs-tabpane]:flex-col [&_.ant-tabs-tabpane]:min-h-0"
        tabBarStyle={{ padding: '4px 16px 0 16px', marginBottom: 0 }}
      />
      
      {/* Edit Variable Modal */}
      <Modal
        title="Edit Variable"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={handleRenameVariable}
        okText="Update"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ variableName: editingVariable }}
        >
          <Form.Item
            label="Variable Name"
            name="variableName"
            help="Changing this will update all occurrences in the template"
          >
            <Input 
              value={newVariableName}
              onChange={(e) => setNewVariableName(formatVariableKey(e.target.value))}
              placeholder="e.g. firstName, companyName"
            />
          </Form.Item>
          
          <div className="bg-gray-50 p-2 rounded">
            <Text type="secondary">
              Current: <code className="bg-blue-50 text-blue-700 px-1">{`{{.${editingVariable}}}`}</code>
            </Text>
            <br />
            <Text type="secondary">
              New: <code className="bg-blue-50 text-blue-700 px-1">{`{{.${newVariableName}}}`}</code>
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
export default EmailTemplateEditor
