import React, { useState } from 'react';
import { Button, Input, Modal, Form, message, Select, Checkbox, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { addVariable } from '@/services/emailTemplateService';

const { Option } = Select;
const { Text } = Typography;

interface AddVariableComponentProps {
  existingVariables: string[];
  onAddVariable: (variable: string) => void;
  templateId?: string;
}

const AddVariableComponent: React.FC<AddVariableComponentProps> = ({
  existingVariables,
  onAddVariable,
  templateId
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Format a variable key to follow conventions
  const formatVariableKey = (input: string) => {
    return input
      .trim()
      .replace(/\s+/g, '')      // Remove spaces
      .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
      .replace(/^[0-9]/, '')     // Ensure doesn't start with a number
      .replace(/^\w/, c => c.toLowerCase()); // Start with lowercase
  };

  const validateKeyUniqueness = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    
    const exists = existingVariables.includes(value);
    return exists 
      ? Promise.reject(new Error('This variable already exists')) 
      : Promise.resolve();
  };

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const variableName = formatVariableKey(values.variableName);
      
      // If templateId is provided, save to database
      if (templateId) {
        try {
          await addVariable(templateId, {
            key: variableName,
            name: values.displayName || variableName.charAt(0).toUpperCase() + variableName.slice(1).replace(/([A-Z])/g, ' $1').trim(),
            type: values.variableType,
            required: values.required || false,
            description: values.description || null,
            defaultValue: values.defaultValue || null
          });
          
          message.success(`Variable {{.${variableName}}} created successfully`);
        } catch (error) {
          console.error('Error adding variable to database:', error);
          message.error('Failed to add variable to database');
          setLoading(false);
          return;
        }
      }
      
      // Update local state
      onAddVariable(variableName);
      setIsModalVisible(false);
      form.resetFields();
      setLoading(false);
    } catch (info) {
      console.log('Validate Failed:', info);
    }
  };

  return (
    <>
      <Button 
        type="default" 
        size="small"
        icon={<PlusOutlined />} 
        onClick={showModal}
        className="font-medium text-indigo-600 hover:!text-indigo-700 hover:!border-indigo-300"
      >
        New Variable
      </Button>
      
      <Modal
        forceRender
        title={
          <div>
            <div className="text-base font-semibold text-slate-900">Add Variable</div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">Create a dynamic placeholder for your email templates</p>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSubmit}
        okText="Create Variable"
        confirmLoading={loading}
        centered
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Variable Key (camelCase)</span>}
            name="variableName"
            rules={[
              { required: true, message: 'Please input a variable name' },
              { validator: validateKeyUniqueness }
            ]}
            help="Used in the template as {{.variableName}}"
          >
            <Input 
              placeholder="e.g. firstName, companyName, orderNumber" 
              onChange={(e) => {
                const formattedName = formatVariableKey(e.target.value);
                form.setFieldValue('variableName', formattedName);
              }}
            />
          </Form.Item>
          
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Display Label</span>}
            name="displayName"
            help="Human-readable title shown in forms"
          >
            <Input placeholder="e.g. First Name, Company Name" />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              label={<span className="text-xs font-semibold text-slate-700">Data Type</span>}
              name="variableType"
              initialValue="TEXT"
            >
              <Select>
                <Option value="TEXT">Text</Option>
                <Option value="EMAIL">Email</Option>
                <Option value="NUMBER">Number</Option>
                <Option value="DATE">Date</Option>
                <Option value="BOOLEAN">Yes / No</Option>
                <Option value="URL">Web URL</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              label={<span className="text-xs font-semibold text-slate-700">Default Value</span>}
              name="defaultValue"
            >
              <Input placeholder="Fallback value" />
            </Form.Item>
          </div>
          
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Description (Optional)</span>}
            name="description"
          >
            <Input.TextArea 
              placeholder="What is this variable used for?"
              rows={2}
            />
          </Form.Item>
          
          <Form.Item
            name="required"
            valuePropName="checked"
            className="mb-3"
          >
            <Checkbox className="text-slate-700">
              Required field in recipient data
            </Checkbox>
          </Form.Item>
          
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3">
            <Text className="text-xs text-slate-600 block mb-1">Preview placeholder token:</Text>
            <code className="variable-pill text-xs">
              {'{{.'}
              {form.getFieldValue('variableName') || 'yourVariable'}
              {'}}'}
            </code>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default AddVariableComponent;