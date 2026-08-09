
gcloud run services update "${CALLER_SERVICE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --vpc-connector="${VPC_CONNECTOR}" \
  --vpc-egress=private-ranges-only
```

Then update service endpoints while preserving their contracts:

```bash
gcloud run services update "${CALLER_SERVICE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --update-env-vars="DB_API_URL=https://db-api.internal.example.com/trpc,TOKEN_SERVICE_ENDPOINT=https://token-service.internal.example.com,SANDBOXER_URL=sandboxer.internal.example.com:443,SANDBOXER_USE_TLS=true"
```

The shapes matter:

- `DB_API_URL` remains an HTTPS URL with the required `/trpc` suffix.
- `TOKEN_SERVICE_ENDPOINT` remains an HTTPS origin.
- `SANDBOXER_URL` remains a gRPC authority in `hostname:port` form.
- `SANDBOXER_USE_TLS` remains enabled.

Do not silently fall back to the public `run.app` endpoint after a certificate, DNS or gRPC failure.

## The 5,000 QPS limitation people miss

Google currently limits traffic sent to serverless NEGs through regional external and regional internal Application Load Balancers to **5,000 queries per second per project**.

The limit is:

- Not 5,000 QPS per Cloud Run service
- Not 5,000 QPS per NEG
- Not 5,000 QPS per load balancer
- Aggregated across all regional external and regional internal Application Load Balancers using serverless NEGs in the project

Official documentation: [Serverless NEG limitations](https://cloud.google.com/load-balancing/docs/negs/serverless-neg-concepts)

A shared internal ALB does not give each backend an independent allowance:

| Traffic source | Example peak QPS |
|---|---:|
| Database API | 1,800 |
| Token service | 700 |
| Sandboxer gRPC | 1,600 |
| Internal dashboards | 100 |
| Review service | 500 |
| Headroom | 300 |
| **Total** | **5,000** |

Cloud Run itself may be capable of scaling further while this regional serverless NEG path remains the bottleneck. Adding another regional internal load balancer in the same project does not create a second 5,000 QPS allowance.

If the expected peak approaches the limit, evaluate the architecture before rollout:

- Keep suitable service-to-service calls on direct Cloud Run endpoints.
- Separate workloads into projects when that boundary makes operational sense.
- Evaluate GKE, Compute Engine or other non-serverless NEG backends.
- Evaluate another supported load-balancer mode against its current limits.
- Measure actual request rates and leave failure headroom.

## Benefits

A regional internal ALB is a good fit when you need:

- Stable private hostnames
- Central TLS termination
- Host- or path-based routing
- One private service entry point
- Private access from Cloud Run, functions, VMs or connected networks
- Separation from public DNS
- Migration flexibility behind stable service names
- Consistent routing and logging policy

## Drawbacks

The design adds a meaningful control plane:

- Proxy-only subnet
- Private VIP
- Forwarding rule
- Regional target HTTPS proxy
- URL map
- Backend services
- Serverless NEGs
- Private DNS
- Certificate Manager
- CA Service
- Client trust distribution

It also introduces regional coupling, private CA rotation work, a project-wide serverless NEG QPS ceiling and several layers to debug.

A failed request can originate in DNS, VPC routing, certificate trust, SAN matching, URL-map routing, Cloud Run ingress, IAM, application authentication, gRPC transport or the application itself.

## Validation from a workload inside the VPC

### Inspect the live backend and NEG

```bash
gcloud compute backend-services describe sandboxer-internal-backend \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format='yaml(name,protocol,loadBalancingScheme,backends)'

gcloud compute network-endpoint-groups describe sandboxer-internal-neg \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format='yaml(name,networkEndpointType,cloudRun)'
```

Expected facts:

```yaml
backendService:
  loadBalancingScheme: INTERNAL_MANAGED
  protocol: HTTP
networkEndpointGroup:
  networkEndpointType: SERVERLESS
  cloudRun:
    service: sandboxer
```

The NEG itself has no HTTP or H2C protocol. The regional backend service carries the `HTTP` value.

### Inspect host routing

```bash
gcloud compute url-maps describe "${URL_MAP}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format='yaml(hostRules,pathMatchers)'
```

Confirm the sandboxer host rule contains both:

```text
sandboxer.internal.example.com
sandboxer.internal.example.com:443
