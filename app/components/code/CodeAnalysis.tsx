import React from 'react';
import { Card, Progress, List, Typography } from 'antd';
import { CodeAnalysis as CodeAnalysisType } from '../../types/code';

const { Title, Text } = Typography;

interface CodeAnalysisProps {
  analysis: CodeAnalysisType;
}

export const CodeAnalysis: React.FC<CodeAnalysisProps> = ({ analysis }) => {
  const sections = [
    {
      title: 'Quality',
      data: analysis.quality,
      color: '#1890ff'
    },
    {
      title: 'Security',
      data: analysis.security,
      color: '#52c41a'
    },
    {
      title: 'Performance',
      data: analysis.performance,
      color: '#faad14'
    },
    {
      title: 'Maintainability',
      data: analysis.maintainability,
      color: '#722ed1'
    },
    {
      title: 'Best Practices',
      data: analysis.bestPractices,
      color: '#eb2f96'
    }
  ];

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <Card key={section.title} title={section.title}>
          <div className="mb-4">
            <Progress
              percent={section.data.score}
              strokeColor={section.color}
              format={percent => `${percent}%`}
            />
          </div>
          <List
            dataSource={section.data.issues || section.data.vulnerabilities || 
                       section.data.bottlenecks || section.data.suggestions || 
                       section.data.recommendations}
            renderItem={item => (
              <List.Item>
                <Text>{item}</Text>
              </List.Item>
            )}
          />
        </Card>
      ))}
    </div>
  );
}; 