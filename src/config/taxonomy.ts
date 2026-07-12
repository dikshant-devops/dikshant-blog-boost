export const BLOG_CATEGORIES = [
  "Cloud",
  "CI/CD",
  "Containers",
  "Networking",
  "Security",
  "Developer Tools",
  "Observability",
  "DevOps",
] as const;

export const CLOUD_PLATFORMS = ["GCP", "AWS", "Azure", "Kubernetes", "Docker"] as const;

export const DEVOPS_TOOLS = [
  "GitHub Actions",
  "Jenkins",
  "Terraform",
  "Docker",
  "Kubernetes",
  "Git",
  "Cloud Armor",
  "Load Balancer",
  "Prometheus",
  "Grafana",
  "Ansible",
] as const;

export const BLOG_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

export const LEARNING_PATHS = [
  {
    title: "GCP Day by Day",
    platform: "GCP",
    description: "Google Cloud services, security, networking, automation, and production patterns.",
  },
  {
    title: "AWS Day by Day",
    platform: "AWS",
    description: "AWS services, load balancing, deployment, security, and DevOps architecture.",
  },
  {
    title: "Azure Day by Day",
    platform: "Azure",
    description: "Azure cloud fundamentals, deployment patterns, and operational practices.",
  },
  {
    title: "CI/CD Tooling",
    platform: "CI/CD",
    description: "Jenkins, GitHub Actions, release automation, pipelines, and delivery workflows.",
  },
] as const;
