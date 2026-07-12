---
title: "Host-Based vs Path-Based Routing in Load Balancers"
excerpt: "Compare host-based and path-based routing patterns for modern load balancers, including use cases, diagrams, and AWS ALB examples."
date: "2025-01-06"
updatedDate: "2026-07-12"
author: "Dikshant Rai"
category: "Networking"
platform: "AWS"
playlist: "AWS Load Balancing"
playlistOrder: 1
difficulty: "Beginner"
image: "/images/social/networking.png"
tags: ["AWS", "Load Balancer", "Networking", "DevOps"]
tools: ["Load Balancer"]
---

Host- and path-based rules let one application load balancer route requests to different backends. The routing choice affects DNS, certificates, cookies, application paths, and the order in which listener rules must be evaluated.

## Host-Based Routing

Host-based routing matches the request hostname, normally from the HTTP `Host` header or the HTTP/2 `:authority` pseudo-header. It is useful when services have separate DNS names:

- `api.example.com` routes to the API target group.
- `docs.example.com` routes to the documentation target group.
- `admin.example.com` routes to an administrative application.

```text
api.example.com  ---->  [load balancer]  ---->  [API targets]
docs.example.com ---->  [load balancer]  ---->  [documentation targets]
```

Each hostname must resolve to the load balancer. TLS certificates must also cover every hostname presented to the listener. A wildcard certificate may reduce certificate count, but its scope and renewal process still need review.

## Path-Based Routing

Path-based routing matches the URL path while keeping one hostname:

- `example.com/api/*` routes to the API target group.
- `example.com/docs/*` routes to the documentation target group.
- `example.com/static/*` routes to the static-content target group.

```text
example.com/api/*    ---->  [load balancer]  ---->  [API targets]
example.com/docs/*   ---->  [load balancer]  ---->  [documentation targets]
example.com/static/* ---->  [load balancer]  ---->  [static targets]
```

The backend must understand the path it receives. A load balancer does not necessarily remove a prefix such as `/api`; path rewriting is a separate feature and varies by product. Query strings also require explicit conditions when the load balancer supports them.

## Choosing Between Them

| Concern | Host based | Path based |
| --- | --- | --- |
| Routing key | Hostname | URL path |
| DNS | One record per hostname | Usually one hostname |
| TLS | Certificate must cover each hostname | One hostname can use one certificate |
| Browser isolation | Separate origins | Shared origin unless another control separates applications |
| Migration fit | Separate products or tenants | Incremental extraction behind one public URL |

Neither pattern is automatically more scalable. Choose the boundary that matches ownership and browser behavior. Separate hostnames can simplify cookie and Content Security Policy boundaries. Shared-host paths can simplify DNS and preserve public URLs during a migration.

## Rule Priority and Defaults

Most application load balancers evaluate listener rules by priority and use a default action when no rule matches. Specific rules should appear before broad catch-all rules. For example, `/api/admin/*` must be evaluated before `/api/*` when the two paths require different target groups.

Define the unmatched-request behavior deliberately. Sending an unknown host or path to the main application can expose a backend that was not intended to handle it. A fixed `404` response is often safer than an accidental default route.

## AWS Application Load Balancer Example

An AWS Application Load Balancer listener can combine `host-header` and `path-pattern` conditions. One rule might require host `api.example.com` and path `/v1/*` before forwarding to an API target group. A lower-priority rule can route `/health` separately, and the listener default action can return a fixed response.

Before enforcement, verify each rule with requests that should match and requests that should fall through:

```bash
curl --resolve api.example.com:443:203.0.113.10 https://api.example.com/v1/status
curl --resolve unknown.example.com:443:203.0.113.10 https://unknown.example.com/
```

Replace the example address with the test endpoint. Check the selected target group, response status, access logs, and behavior for an unknown host.

## Production Checklist

- Confirm DNS and certificate coverage for every hostname.
- Document listener-rule priority and the default action.
- Test overlapping paths and trailing-slash behavior.
- Decide whether the backend receives or rewrites the matched prefix.
- Keep authentication and authorization in the application; routing is not an access-control boundary.
- Monitor target health and load-balancer access logs after a rule change.

## References

- [AWS ALB listener rules](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-rules.html)
- [Google Cloud URL maps](https://cloud.google.com/load-balancing/docs/url-map-concepts)
