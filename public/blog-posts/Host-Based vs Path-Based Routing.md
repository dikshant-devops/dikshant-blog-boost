---
title: "Host-Based vs Path-Based Routing in Load Balancers"
excerpt: "Compare host-based and path-based routing patterns for modern load balancers, including use cases, diagrams, and AWS ALB examples."
date: "2025-01-06"
updatedDate: "2025-01-06"
author: "Dikshant Sharma"
category: "Networking"
platform: "AWS"
series: "AWS Day by Day"
seriesOrder: 1
difficulty: "Beginner"
image: "/og-default.jpg"
tags: ["AWS", "Load Balancer", "Networking", "DevOps"]
tools: ["Load Balancer"]
readTime: "3 min read"
---

When designing scalable applications, routing strategies play a crucial role in ensuring traffic is directed to the right service. Modern load balancers provide advanced routing mechanisms such as **host-based routing** and **path-based routing**, enabling more flexibility and control.  

In this blog, we’ll explore both concepts, their differences, and common use cases.  

---

## 🔹 What is Host-Based Routing?  

**Host-based routing** (also known as **domain-based routing**) directs traffic based on the **hostname (domain)** specified in the request’s **HTTP Host header**.  

For example:  

- `api.example.com` → Routes to the API service  
- `blog.example.com` → Routes to the blog service  
- `shop.example.com` → Routes to the e-commerce service  

### ✅ Benefits:  
- Helps run multiple applications under different domains/subdomains.  
- Simplifies multi-service architecture under a single load balancer.  
- Commonly used in **microservices** and **multi-tenant applications**.  

### 🔹 Diagram: Host-Based Routing  
Client Request (HTTP Host header)
|
v
+—————+
| Load Balancer |
+—————+
/      |      
/       |       
api.example.com  blog.example.com  shop.example.com
|              |               |
[API Service]  [Blog Service]  [Shop Service]

---

## 🔹 Wh
at is Path-Based Routing?  

**Path-based routing** (also known as **URL-based routing**) directs traffic based on the **URL path** in the request.  

For example:  

- `example.com/api/*` → Routes to the API backend  
- `example.com/blog/*` → Routes to the blog backend  
- `example.com/shop/*` → Routes to the e-commerce backend  

### ✅ Benefits:  
- Allows multiple services under the **same domain**.  
- Provides finer-grained routing compared to host-based.  
- Useful for **monolith-to-microservices migration**, where paths can be redirected to different backends without changing the domain.  

### 🔹 Diagram: Path-Based Routing  
Client Request (HTTP Path)
|
v
+—————+
| Load Balancer |
+—————+
/      |      
/       |       
/api/*      /blog/*   /shop/*
|           |         |
[API Service] [Blog Service] [Shop Service]

---

## 🔹 Host-Based vs Path-Based Routing  

| Feature                  | Host-Based Routing                  | Path-Based Routing                   |
|--------------------------|--------------------------------------|---------------------------------------|
| **Routing Decision**     | Based on **hostname/domain**        | Based on **URL path**                 |
| **Example**              | `api.example.com` → API service     | `example.com/api/` → API service      |
| **Domain Usage**         | Requires multiple subdomains        | Uses a single domain with paths       |
| **Best For**             | Multi-domain, multi-service setups  | Single domain with multiple services  |
| **Flexibility**          | Moderate                            | High (can split requests by path)     |

---

## 🔹 Common Use Cases  

### Host-Based Routing  
- SaaS platforms hosting multiple customers with separate domains.  
- Applications where services need to be clearly separated by domain, e.g., `admin.example.com`, `user.example.com`.  
- Microservices where each service has its own subdomain.  

### Path-Based Routing  
- Applications with multiple services under one domain.  
- Progressive migration from monolith to microservices.  
- APIs grouped under a single domain with distinct paths.  

---

## 🔹 Example in AWS Application Load Balancer  

In AWS ALB:  
- **Host-based rule**:
   IF host is api.example.com → Forward to Target Group: API
- **Path-based rule**:
  IF path is /blog/* → Forward to Target Group: Blog
  This flexibility helps deploy complex architectures without requiring separate load balancers for each service.  

---

## 🔹 Conclusion  

Both **host-based** and **path-based routing** are powerful mechanisms in load balancers.  
- Use **host-based routing** when you want to separate services by **domain**.  
- Use **path-based routing** when you want to serve multiple services under a **single domain**.  

In real-world systems, it’s common to use a **combination of both** for maximum flexibility and scalability.  
