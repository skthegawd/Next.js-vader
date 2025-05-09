import React, { useState } from 'react';
import { Form, Select, Button, message } from 'antd';
import { CodeService } from '../../services/codeService';
import { ExportOptions } from '../../types/code';

const { Option } = Select;

interface CodeExportProps {
  code: string;
}

export const CodeExport: React.FC<CodeExportProps> = ({ code }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleExport = async (values: ExportOptions) => {
    setLoading(true);
    try {
      const result = await CodeService.getInstance().exportCode(code, values);
      if (result.success) {
        if (values.format === 'zip' || values.format === 'tar') {
          const url = window.URL.createObjectURL(new Blob([result.data]));
          const a = document.createElement('a');
          a.href = url;
          a.download = result.filename || 'exported_code.' + values.format;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } else {
          message.success('Exported successfully!');
        }
      } else {
        message.error(result.error || 'Failed to export code');
      }
    } catch (e) {
      message.error('Error exporting code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="inline" onFinish={handleExport} initialValues={{ format: 'zip' }}>
      <Form.Item name="format" label="Format" rules={[{ required: true }]}> 
        <Select style={{ width: 120 }}>
          <Option value="zip">ZIP</Option>
          <Option value="tar">TAR</Option>
          <Option value="json">JSON</Option>
          <Option value="txt">Text</Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Export
        </Button>
      </Form.Item>
    </Form>
  );
}; 