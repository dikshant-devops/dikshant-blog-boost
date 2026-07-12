// Tag configuration for blog posts
export interface TagConfig {
  name: string;
  color?: string;
  description?: string;
}

export interface TagGroup {
  title: string;
  tags: string[];
}

export const TAG_CONFIGS: Record<string, TagConfig> = {
  'DevOps': {
    name: 'DevOps',
    description: 'Development and Operations practices'
  },
  'Cloud': {
    name: 'Cloud',
    description: 'Cloud computing and services'
  },
  'GCP': {
    name: 'GCP',
    description: 'Google Cloud Platform'
  },
  'AWS': {
    name: 'AWS',
    description: 'Amazon Web Services'
  },
  'Azure': {
    name: 'Azure',
    description: 'Microsoft Azure'
  },
  'Cloud Armor': {
    name: 'Cloud Armor',
    description: 'Google Cloud Armor security and WAF content'
  },
  'Docker': {
    name: 'Docker',
    description: 'Containerization and Docker-related content'
  },
  'Kubernetes': {
    name: 'Kubernetes',
    description: 'Container orchestration with Kubernetes'
  },
  'Containers': {
    name: 'Containers',
    description: 'Container technology and containerized workloads'
  },
  'Orchestration': {
    name: 'Orchestration',
    description: 'Workload orchestration and scheduling'
  },
  'CI/CD': {
    name: 'CI/CD',
    description: 'Continuous Integration and Deployment'
  },
  'GitHub Actions': {
    name: 'GitHub Actions',
    description: 'GitHub Actions workflows and automation'
  },
  'Jenkins': {
    name: 'Jenkins',
    description: 'Jenkins automation and pipelines'
  },
  'Automation': {
    name: 'Automation',
    description: 'Automation workflows and operational scripting'
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
  'Git': {
    name: 'Git',
    description: 'Version control with Git'
  },
  'GitHub': {
    name: 'GitHub',
    description: 'GitHub platform and features'
  },
  'Version Control': {
    name: 'Version Control',
    description: 'Source control workflows and collaboration'
  },
  'Command Line': {
    name: 'Command Line',
    description: 'Terminal commands and command-line workflows'
  },
  'Developer Tools': {
    name: 'Developer Tools',
    description: 'Tools that improve developer productivity'
  },
  'Terraform': {
    name: 'Terraform',
    description: 'Infrastructure as Code with Terraform'
  },
  'Ansible': {
    name: 'Ansible',
    description: 'Configuration management and automation with Ansible'
  }
};

export const TAG_GROUPS: TagGroup[] = [
  {
    title: 'Core Topics',
    tags: ['DevOps', 'Cloud', 'Security', 'Networking', 'Containers', 'CI/CD', 'Automation', 'Orchestration', 'Monitoring']
  },
  {
    title: 'Platforms',
    tags: ['GCP', 'AWS', 'Azure', 'Kubernetes', 'Docker']
  },
  {
    title: 'Tools & Services',
    tags: ['Cloud Armor', 'Load Balancer', 'GitHub Actions', 'Jenkins', 'Terraform', 'Ansible']
  },
  {
    title: 'Development',
    tags: ['Developer Tools', 'Git', 'GitHub', 'Version Control', 'Command Line']
  }
];

const TAG_ORDER = new Map(
  TAG_GROUPS.flatMap((group, groupIndex) =>
    group.tags.map((tag, tagIndex) => [tag, groupIndex * 100 + tagIndex] as const)
  )
);

export const getAllTags = (): TagConfig[] => {
  return Object.values(TAG_CONFIGS);
};

export const getTagConfig = (tagName: string): TagConfig | undefined => {
  return TAG_CONFIGS[tagName];
};

export const sortTagsByTaxonomy = (tags: string[]): string[] => {
  return [...tags].sort((a, b) => {
    const aOrder = TAG_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = TAG_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.localeCompare(b);
  });
};

export const getOrderedTagGroups = (tags: string[]): TagGroup[] => {
  const presentTags = new Set(tags);
  const groupedTags = new Set<string>();

  const groups = TAG_GROUPS.map((group) => {
    const groupTags = group.tags.filter((tag) => presentTags.has(tag));
    groupTags.forEach((tag) => groupedTags.add(tag));
    return { ...group, tags: groupTags };
  }).filter((group) => group.tags.length > 0);

  const uncategorizedTags = sortTagsByTaxonomy(tags.filter((tag) => !groupedTags.has(tag)));

  if (uncategorizedTags.length > 0) {
    groups.push({
      title: 'Other',
      tags: uncategorizedTags,
    });
  }

  return groups;
};
