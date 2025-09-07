// Tag configuration for blog posts
export interface TagConfig {
  name: string;
  color?: string;
  description?: string;
}

export const TAG_CONFIGS: Record<string, TagConfig> = {
  'Docker': {
    name: 'Docker',
    description: 'Containerization and Docker-related content'
  },
  'Kubernetes': {
    name: 'Kubernetes',
    description: 'Container orchestration with Kubernetes'
  },
  'Git': {
    name: 'Git',
    description: 'Version control with Git'
  },
  'GitHub': {
    name: 'GitHub',
    description: 'GitHub platform and features'
  },
  'CI/CD': {
    name: 'CI/CD',
    description: 'Continuous Integration and Deployment'
  },
  'Cloud': {
    name: 'Cloud',
    description: 'Cloud computing and services'
  },
  'DevOps': {
    name: 'DevOps',
    description: 'Development and Operations practices'
  },
  'Networking': {
    name: 'Networking',
    description: 'Network infrastructure and protocols'
  },
  'Load Balancer': {
    name: 'Load Balancer',
    description: 'Load balancing and traffic distribution'
  },
  'Security': {
    name: 'Security',
    description: 'Security tools and practices'
  },
  'Monitoring': {
    name: 'Monitoring',
    description: 'Application and infrastructure monitoring'
  },
  'AWS': {
    name: 'AWS',
    description: 'Amazon Web Services'
  },
  'GCP': {
    name: 'GCP',
    description: 'Google Cloud Platform'
  }
};

export const getAllTags = (): TagConfig[] => {
  return Object.values(TAG_CONFIGS);
};

export const getTagConfig = (tagName: string): TagConfig | undefined => {
  return TAG_CONFIGS[tagName];
};