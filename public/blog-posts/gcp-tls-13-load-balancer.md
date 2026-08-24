---
title: "Enforce TLS 1.3 on Google Cloud Load Balancers"
excerpt: "Configure and verify a TLS 1.3-only SSL policy on Google Cloud load balancers with gcloud, Terraform, client tests, and a controlled rollback."
date: "2026-07-26"
updatedDate: "2026-07-26"
author: "Dikshant Rai"
category: "Security"
platform: "GCP"
difficulty: "Intermediate"
image: "/images/social/security.png"
tags: ["GCP", "Security", "Networking", "Load Balancer", "TLS"]
tools: ["Google Cloud Load Balancing", "gcloud", "Terraform", "OpenSSL", "curl"]
---

A certificate proves the identity of an HTTPS endpoint, but it does not decide which TLS versions a client may negotiate. On Google Cloud, that decision belongs to the SSL policy attached to the load balancer's target HTTPS proxy. If a service must accept only TLS 1.3, the policy needs a minimum TLS version of 1.3 and the `RESTRICTED` profile.

That is a compatibility decision as much as a security setting. Older operating systems, embedded clients, partner integrations, and TLS-inspecting proxies might support TLS 1.2 but not TLS 1.3. This guide uses a global external Application Load Balancer to show how to inventory the current state, apply a TLS 1.3-only policy with either gcloud or Terraform, test both allowed and rejected handshakes, and roll back without rebuilding the load balancer.

## Decide whether TLS 1.3-only is appropriate

TLS 1.3 removes legacy protocol choices and reduces handshake round trips, but "newer" is not enough justification for excluding clients. Start with the requirement:

| Requirement | Practical policy | Compatibility effect |
| --- | --- | --- |
| Remove TLS 1.0 and 1.1 while retaining broad modern-client support | Minimum TLS 1.2 with an appropriate profile | TLS 1.2 and TLS 1.3 clients can connect |
| Enforce a TLS 1.3-only frontend | Minimum TLS 1.3 with `RESTRICTED` | Every TLS 1.2-only client is rejected |
| Meet a specific compliance profile | Match the mandated version and cipher requirements | Depends on the standard and client estate |

When no SSL policy is attached, Google Cloud Load Balancing behaves as if the `COMPATIBLE` profile and a minimum TLS version of 1.0 were configured. Do not use that default as a rollback target unless its broad compatibility is explicitly acceptable.

An SSL policy controls the connection from the client to the load balancer. It does not configure encryption from the load balancer to a backend service. Backend TLS is a separate design and must be reviewed independently.

## Prerequisites and scope

This example assumes:

- a global target HTTPS proxy already serves the intended hostname;
- the certificate for that hostname is valid;
- your identity can create Compute Engine SSL policies and update the target proxy;
- the Google Cloud CLI is authenticated against the correct project;
- OpenSSL and a curl build with TLS 1.3 support are available for client tests.

Set explicit variables before reading or changing resources:

```bash
export PROJECT_ID="example-production"
export HTTPS_PROXY="public-https-proxy"
export SSL_POLICY="tls-13-restricted"
export HOSTNAME="www.example.com"

gcloud config set project "$PROJECT_ID"
gcloud auth list
gcloud config get-value project
```

The commands below use global resources. For a regional Application Load Balancer, use a regional SSL policy and replace `--global` with `--region=REGION`. The policy and target proxy must have compatible scopes.

## Inventory the current frontend

List the global target HTTPS proxies and their policy references:

```bash
gcloud compute target-https-proxies list \
  --global \
  --format="table(name,sslPolicy)"
```

Inspect the selected proxy before changing it:

```bash
gcloud compute target-https-proxies describe "$HTTPS_PROXY" \
  --global \
  --format="yaml(name,urlMap,sslCertificates,certificateMap,sslPolicy)"
```

Record the current `sslPolicy` value. It is the rollback target. If the field is empty, record that the proxy currently uses the Google Cloud default instead of treating an empty value as a missing observation.

Also confirm that DNS resolves the test hostname to the forwarding rule you intend to change. Testing a different load balancer through stale DNS produces convincing but irrelevant results.

## How the policy controls a handshake

A client advertises the TLS versions, cipher suites, and other capabilities it supports. The load balancer selects the newest mutually supported TLS version and compatible parameters. The handshake fails when the two sides have no overlap.

Google Cloud's predefined profiles mainly control cipher suites for TLS 1.2 and earlier. A policy with `min_tls_version` set to TLS 1.3 must use the `RESTRICTED` profile. Other profiles can negotiate TLS 1.3, but Google Cloud does not allow them to enforce 1.3 as the minimum.

This distinction matters during review:

- "The endpoint supports TLS 1.3" can still mean that TLS 1.2 is accepted.
- "The endpoint requires TLS 1.3" means a forced TLS 1.2 handshake must fail.

Both statements need separate tests.

## Create and attach the policy with gcloud

Create a global SSL policy:

```bash
gcloud compute ssl-policies create "$SSL_POLICY" \
  --global \
  --profile=RESTRICTED \
  --min-tls-version=1.3 \
  --description="Require TLS 1.3 for the public HTTPS frontend"
```

Confirm the stored policy before attaching it:

```bash
gcloud compute ssl-policies describe "$SSL_POLICY" \
  --global \
  --format="yaml(name,profile,minTlsVersion,enabledFeatures)"
```

The output should show `profile: RESTRICTED` and `minTlsVersion: TLS_1_3`. If either value differs, stop before changing the proxy.

Attach the policy to the existing global target HTTPS proxy:

```bash
gcloud compute target-https-proxies update "$HTTPS_PROXY" \
  --global \
  --ssl-policy="$SSL_POLICY"
```

Verify the reference from the proxy:

```bash
gcloud compute target-https-proxies describe "$HTTPS_PROXY" \
  --global \
  --format="get(sslPolicy)"
```

This control-plane check proves that the proxy references the intended policy. It does not prove that DNS reaches this proxy or that a real client can complete a TLS 1.3 handshake.

## Manage the same policy with Terraform

For a long-lived environment, keep the policy and proxy attachment in the same reviewed infrastructure workflow as the load balancer. The Google provider represents the policy with `google_compute_ssl_policy`:

```hcl
resource "google_compute_ssl_policy" "tls_13" {
  project         = var.project_id
  name            = "tls-13-restricted"
  description     = "Require TLS 1.3 for the public HTTPS frontend"
  profile         = "RESTRICTED"
  min_tls_version = "TLS_1_3"
}

resource "google_compute_target_https_proxy" "frontend" {
  project = var.project_id
  name    = "public-https-proxy"

  url_map          = google_compute_url_map.frontend.id
  ssl_certificates = [google_compute_managed_ssl_certificate.frontend.id]
  ssl_policy       = google_compute_ssl_policy.tls_13.id
}
```

Add `ssl_policy` to the target HTTPS proxy resource already managed by the configuration. Do not create a second proxy to avoid importing the first one. If the SSL policy already exists, import it into exactly one Terraform resource address:

```bash
terraform import \
  google_compute_ssl_policy.tls_13 \
  "projects/${PROJECT_ID}/global/sslPolicies/${SSL_POLICY}"
```

Then run the normal review sequence:

```bash
terraform fmt -check
terraform validate
terraform plan -out=tls13.tfplan
terraform show -no-color tls13.tfplan
```

The expected plan creates or imports one SSL policy and updates the intended target HTTPS proxy in place. Stop if the plan replaces the proxy, forwarding rule, URL map, or certificate resources. A policy change does not justify rebuilding the load balancer.

Because TLS 1.3 minimum support is version-sensitive, confirm that the pinned Google provider version accepts `TLS_1_3` before merging the change. Upgrade the provider as a separate reviewed decision when the current constraint does not support it.

## Verify the result from a new client connection

Test the public hostname rather than only the Google Cloud resource. The `-servername` argument sends Server Name Indication (SNI), which is necessary when multiple hostnames share an address:

```bash
openssl s_client \
  -connect "${HOSTNAME}:443" \
  -servername "$HOSTNAME" \
  -tls1_3 \
  </dev/null
```

Look for `TLSv1.3`, a negotiated cipher, the expected certificate name, and a successful verification result. Certificate verification can still fail independently of protocol negotiation, so inspect both.

Confirm that an HTTP request also succeeds over TLS 1.3:

```bash
curl --head \
  --tlsv1.3 \
  --tls-max 1.3 \
  "https://${HOSTNAME}"
```

Check `curl --version` if those options are rejected. The installed TLS library must support TLS 1.3.

Now run the negative test:

```bash
openssl s_client \
  -connect "${HOSTNAME}:443" \
  -servername "$HOSTNAME" \
  -tls1_2 \
  </dev/null
```

The TLS 1.2 handshake should fail. If it succeeds, confirm DNS, the target proxy reference, policy scope, and propagation before assuming the rollout worked. Open a new connection for every protocol test; an existing keep-alive session does not exercise a new handshake.

For externally used endpoints, test representative automated clients and partner paths, not only a current browser. If load balancer logging is configured to capture the optional `tls.protocol` field, use it to measure negotiated protocols before enforcement and to confirm TLS 1.3 traffic after rollout.

## Failure modes to check

### The policy cannot be created

Confirm that the minimum is `1.3` and the profile is `RESTRICTED`. A TLS 1.3 minimum cannot be combined with `COMPATIBLE`, `MODERN`, `CUSTOM`, or `FIPS_202205`.

### The policy cannot be attached

Check whether the target proxy and policy are global or regional. A regional proxy requires a regional policy in the appropriate region.

### TLS 1.3 fails from one network

Compare the result from a second network and inspect local OpenSSL or curl capabilities. A corporate proxy or TLS inspection device can change the path. Also verify SNI, certificate trust, DNS, and the target address before changing the policy.

### Terraform proposes replacement

Check whether the existing proxy is already represented at another resource address, whether imported state matches the configuration, and whether certificate or URL map arguments were omitted. Resolve the drift instead of accepting an unrelated replacement.

## Roll back deliberately

The clean rollback reattaches the previous SSL policy:

```bash
export PREVIOUS_SSL_POLICY="previous-production-policy"

gcloud compute target-https-proxies update "$HTTPS_PROXY" \
  --global \
  --ssl-policy="$PREVIOUS_SSL_POLICY"
```

If the proxy previously had no policy, the technical rollback is:

```bash
gcloud compute target-https-proxies update "$HTTPS_PROXY" \
  --global \
  --clear-ssl-policy
```

Clearing the policy restores Google Cloud's broad default behavior, including a minimum TLS version of 1.0. Use that rollback only when it matches the recorded previous state and the security owner accepts it. A prepared TLS 1.2 minimum policy is usually a better compatibility fallback.

After rollback, repeat the positive application request and the expected TLS 1.2 or TLS 1.3 handshake tests. A successful update command is not sufficient evidence that the client path recovered.

## Production rollout checklist

1. Inventory every target HTTPS and target SSL proxy in scope.
2. Measure client TLS versions and identify non-browser integrations.
3. Create the policy in a non-production environment and test both accepted and rejected protocols.
4. Review the Terraform plan or gcloud change record and prepare the previous policy reference.
5. Roll out during an observed window with owners for client support and rollback.
6. Verify the real hostname from representative networks and monitor connection failures.

TLS enforcement is an edge change, not an application deployment. Keeping the policy separate lets the platform team change transport requirements without rebuilding the application, but it also means application health checks alone cannot validate client compatibility.

## Key takeaways

- TLS 1.3 minimum on Google Cloud requires the `RESTRICTED` SSL policy profile.
- The policy protects the client-to-load-balancer connection, not the load-balancer-to-backend connection.
- Configuration checks, a successful TLS 1.3 handshake, and a failed TLS 1.2 handshake prove different parts of the rollout.
- The safest rollback is the recorded previous policy, not an unexamined return to the default.

## References

- [RFC 8446: The Transport Layer Security Protocol Version 1.3](https://www.rfc-editor.org/rfc/rfc8446)
- [Google Cloud SSL policies overview](https://docs.cloud.google.com/load-balancing/docs/ssl-policies-concepts)
- [Google Cloud: Use SSL policies](https://docs.cloud.google.com/load-balancing/docs/use-ssl-policies)
- [gcloud compute ssl-policies create](https://docs.cloud.google.com/sdk/gcloud/reference/compute/ssl-policies/create)
- [gcloud compute target-https-proxies update](https://docs.cloud.google.com/sdk/gcloud/reference/compute/target-https-proxies/update)
- [Google Cloud load balancer logging and TLS fields](https://docs.cloud.google.com/load-balancing/docs/https/https-logging-monitoring)
- [Terraform google_compute_ssl_policy resource](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_ssl_policy)
