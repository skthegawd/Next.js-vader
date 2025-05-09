import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, message } from 'antd';
import { CodeService } from '../../services/codeService';
import { CodeBlock } from './CodeBlock';
import { CodeAnalysis } from './CodeAnalysis';
import { CodeExport } from './CodeExport';
import { CodeDiff } from './CodeDiff';
import { CodeSpecification } from '../../types/code';

const { TextArea } = Input;
const { Option } = Select;

export const CodeGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [diff, setDiff] = useState<string | null>(null);
  const [form] = Form.useForm();

  const handleGenerate = async (values: CodeSpecification) => {
    try {
      setLoading(true);
      const result = await CodeService.getInstance().generateCode(values);
      if (result.success) {
        setGeneratedCode(result.code);
        setDiff(result.diff || null);
        const analysisResult = await CodeService.getInstance().analyzeCode(
          result.code,
          values.language
        );
        if (analysisResult.success) {
          setAnalysis(analysisResult.analysis);
        }
        message.success('Code generated successfully');
      } else {
        message.error(result.error || 'Failed to generate code');
      }
    } catch (error) {
      message.error('Error generating code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card title="Code Generator">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerate}
        >
          <Form.Item
            name="language"
            label="Programming Language"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="python">Python</Option>
              <Option value="typescript">TypeScript</Option>
              <Option value="javascript">JavaScript</Option>
              <Option value="java">Java</Option>
              <Option value="go">Go</Option>
              <Option value="rust">Rust</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="requirements"
            label="Requirements"
          >
            <Select mode="tags" />
          </Form.Item>

          <Form.Item
            name="dependencies"
            label="Dependencies"
          >
            <Select mode="tags" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Generate Code
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {generatedCode && (
        <>
          <Card title="Generated Code">
            <CodeBlock
              code={generatedCode}
              language={form.getFieldValue('language')}
            />
          </Card>

          {diff && (
            <Card title="Code Diff">
              <CodeDiff diff={diff} />
            </Card>
          )}

          {analysis && (
            <Card title="Code Analysis">
              <CodeAnalysis analysis={analysis} />
            </Card>
          )}

          <Card title="Export Options">
            <CodeExport code={generatedCode} />
          </Card>
        </>
      )}
    </div>
  );
}; 