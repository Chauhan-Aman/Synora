import { useState } from 'react';

export function usePublish() {
  const [publishFormat, setPublishFormat] = useState<'blog' | 'linkedin' | 'twitter' | 'newsletter' | 'paper'>('blog');
  const [publishStyle, setPublishStyle] = useState<'conversational' | 'professional' | 'academic' | 'creative'>('conversational');
  const [publishSelectedTopics, setPublishSelectedTopics] = useState<Set<string>>(new Set());
  const [publishOutput, setPublishOutput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishCopied, setPublishCopied] = useState(false);

  return {
    publishFormat, setPublishFormat,
    publishStyle, setPublishStyle,
    publishSelectedTopics, setPublishSelectedTopics,
    publishOutput, setPublishOutput,
    isPublishing, setIsPublishing,
    publishCopied, setPublishCopied
  };
}
