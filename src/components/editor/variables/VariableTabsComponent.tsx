// src/components/VariableTabsComponent.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, Button, Badge, Input, Typography, Space, Tooltip, message, Spin } from 'antd';
import type { TabsProps } from 'antd';
import { EditOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { updatePreviewData, deleteVariable, updateVariable } from '@/services/emailTemplateService';

const { Text } = Typography;

interface VariableTabsProps {
  availableVariables: string[];
  insertVariable: (variable: string) => void;
  previewMode: boolean;
  localPreviewData: Record<string, any>;
  setLocalPreviewData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onEditVariable?: (variable: string) => void;
  onDeleteVariable?: (variable: string) => void;
  templateId?: string;
}

const VariableTabs: React.FC<VariableTabsProps> = ({
  availableVariables,
  insertVariable,
  previewMode,
  localPreviewData,
  setLocalPreviewData,
  onEditVariable,
  onDeleteVariable,
  templateId
}) => {
  const [activeTab, setActiveTab] = useState<string>("variables");
  const [saving, setSaving] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  
  // Handle updating preview data in the database
  const handleUpdatePreviewData = async (key: string, value: string) => {
    // Update local state immediately for responsive UI
    const updatedData = {
      ...localPreviewData,
      [key]: value
    };
    
    setLocalPreviewData(updatedData);
    
    // If template ID is provided, save to database
    if (templateId) {
      try {
        setSaving(true);
        await updatePreviewData(templateId, updatedData);
        setSaving(false);
      } catch (error) {
        console.error('Error saving preview data:', error);
        setSaving(false);
        message.error('Failed to save preview data');
      }
    }
  };
  
  // Handle variable deletion with proper database update
  const handleDeleteVariable = async (variable: string) => {
    if (!templateId) {
      if (onDeleteVariable) {
        onDeleteVariable(variable);
      }
      return;
    }
    
    try {
      // Set loading state for this specific variable
      setDeleteLoading(prev => ({ ...prev, [variable]: true }));
      
      // First, we need to get the variable ID from the key
      // This would require adding a function to get variables by template ID
      const variables = await getVariablesByTemplateId(templateId);
      const variableToDelete = variables.find((v: { key: string; id: string }) => v.key === variable);
      
      if (!variableToDelete) {
        message.error(`Variable ${variable} not found`);
        setDeleteLoading(prev => ({ ...prev, [variable]: false }));
        return;
      }
      
      // Delete from database
      await deleteVariable(templateId, variableToDelete.id);
      
      // Update local state via the callback
      if (onDeleteVariable) {
        onDeleteVariable(variable);
      }
      
      // Remove from preview data
      const updatedPreviewData = { ...localPreviewData };
      delete updatedPreviewData[variable];
      setLocalPreviewData(updatedPreviewData);
      
      // Update preview data in database
      await updatePreviewData(templateId, updatedPreviewData);
      
      message.success(`Variable {{.${variable}}} deleted successfully`);
    } catch (error) {
      console.error('Error deleting variable:', error);
      message.error('Failed to delete variable');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [variable]: false }));
    }
  };
  
  // Create items array for Tabs
  const tabItems: TabsProps['items'] = [
    {
      key: 'variables',
      label: (
        <span className="font-medium">
          Variables ({availableVariables.length})
        </span>
      ),
      children: (
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          {availableVariables.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No variables added yet.
            </div>
          ) : (
            availableVariables.map((variable) => (
              <div 
                key={variable} 
                className="group flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:border-indigo-200 bg-slate-50/70 hover:bg-indigo-50/40 transition-all duration-150"
              >
                <Tooltip title={previewMode ? "Disabled in preview mode" : "Click to insert into cursor position"}>
                  <button
                    type="button"
                    onClick={() => !previewMode && insertVariable(variable)}
                    disabled={previewMode}
                    className="text-left font-mono text-xs text-indigo-700 hover:text-indigo-900 font-medium cursor-pointer disabled:cursor-not-allowed flex-1 truncate"
                  >
                    {`{{.${variable}}}`}
                  </button>
                </Tooltip>
                
                {!previewMode && (
                  <Space size={4} className="opacity-70 group-hover:opacity-100 transition-opacity">
                    {onEditVariable && (
                      <Tooltip title="Rename variable">
                        <Button 
                          type="text"
                          icon={<EditOutlined className="text-slate-500 hover:text-indigo-600" />} 
                          size="small"
                          onClick={() => onEditVariable(variable)}
                        />
                      </Tooltip>
                    )}
                    
                    {onDeleteVariable && (
                      <Tooltip title="Delete variable">
                        <Button 
                          type="text"
                          danger
                          icon={deleteLoading[variable] ? <LoadingOutlined /> : <DeleteOutlined className="text-rose-400 hover:text-rose-600" />} 
                          size="small" 
                          loading={deleteLoading[variable]}
                          onClick={() => handleDeleteVariable(variable)}
                        />
                      </Tooltip>
                    )}
                  </Space>
                )}
              </div>
            ))
          )}
        </div>
      )
    },
    {
      key: 'test-data',
      label: (
        <span className="font-medium">
          Mock Data {saving && <span className="text-xs text-indigo-500 animate-pulse">(saving)</span>}
        </span>
      ),
      children: (
        <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
          {availableVariables.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              Add variables first to configure mock values.
            </div>
          ) : (
            availableVariables.map((key) => (
              <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <Text className="text-xs font-mono font-medium text-slate-700">{key}</Text>
                  <span className="text-[10px] text-slate-400 font-mono">{'{{.' + key + '}}'}</span>
                </div>
                <Input
                  value={localPreviewData[key] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleUpdatePreviewData(key, e.target.value)
                  }
                  placeholder={`Value for ${key}`}
                  size="small"
                  className="bg-white"
                />
              </div>
            ))
          )}
        </div>
      )
    }
  ];
  
  return (
    <Tabs 
      activeKey={activeTab}
      onChange={setActiveTab}
      items={tabItems}
      size="small"
    />
  );
};

// This function needs to be implemented in the component
// or imported from your service
async function getVariablesByTemplateId(templateId: string) {
  const response = await fetch(`/api/templates/${templateId}/variables`);
  if (!response.ok) {
    throw new Error('Failed to fetch variables');
  }
  return response.json();
}

export default VariableTabs;