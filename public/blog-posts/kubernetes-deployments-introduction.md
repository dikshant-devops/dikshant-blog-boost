---
title: "Kubernetes Deployments: A Practical Introduction"
excerpt: "Build and operate a Kubernetes Deployment with matching selectors, health checks, resource requests, rolling updates, verification, and rollback."
date: "2026-07-12"
updatedDate: "2026-07-12"
author: "Dikshant Rai"
category: "Containers"
platform: "Kubernetes"
playlist: "Kubernetes Foundations"
playlistOrder: 2
playlistOnly: true
difficulty: "Beginner"
image: "/images/social/containers.png"
tags: ["Kubernetes", "Containers", "Orchestration"]
tools: ["Kubernetes", "kubectl"]
---

A container image is not a deployment plan. Kubernetes still needs to know how many copies to run, how to identify them, when a new copy is ready for traffic, and how to replace an old version. A `Deployment` captures that desired state for a stateless application and continuously reconciles the cluster toward it.

This guide creates one Deployment, observes the objects it controls, performs a rolling update, and exercises rollback. The emphasis is on the fields that affect production behavior, not on producing the shortest possible YAML.

## What a Deployment controls

A Deployment manages ReplicaSets, and each ReplicaSet manages Pods. You normally declare and update the Deployment; its controller creates the lower-level objects.

```text
Deployment
  -> ReplicaSet for the current Pod template
      -> Pod
      -> Pod
      -> Pod
```

The Deployment records a desired Pod template and replica count. When the template changes, Kubernetes creates a new ReplicaSet and gradually shifts replicas to it according to the update strategy. Old ReplicaSets are retained within the configured revision history so a rollout can be reversed.

Use a Deployment for replaceable application replicas that do not require stable Pod identity. StatefulSets, DaemonSets, Jobs, and CronJobs solve different workload problems; changing the kind later is more disruptive than choosing it deliberately at the start.

## Check the target before applying

`kubectl` acts on the current kubeconfig context and namespace. Confirm both before a write:

```bash
kubectl config current-context
kubectl config view --minify --output 'jsonpath={..namespace}'
kubectl auth can-i create deployments.apps --namespace applications
```

An empty namespace output means `default`, not that no namespace is selected. In shared environments, pass `--namespace` explicitly in operational commands and keep the namespace in the manifest.

## A deployment manifest with operational defaults

The following manifest runs three replicas of an HTTP service. Replace the example image with an immutable image digest or a version tag from your own registry before applying it:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: release-api
  namespace: applications
  labels:
    app.kubernetes.io/name: release-api
spec:
  replicas: 3
  revisionHistoryLimit: 5
  progressDeadlineSeconds: 300
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: release-api
  template:
    metadata:
      labels:
        app.kubernetes.io/name: release-api
    spec:
      containers:
        - name: api
          image: ghcr.io/example/release-api:1.0.0
          ports:
            - name: http
              containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 3
            periodSeconds: 5
            timeoutSeconds: 2
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /live
              port: http
            initialDelaySeconds: 15
            periodSeconds: 10
            timeoutSeconds: 2
```

Several details carry more weight than their line count suggests.

The selector under `spec.selector` must match the labels in `spec.template.metadata.labels`. A Deployment uses that selector to decide which Pods it owns. In `apps/v1`, the selector is required and effectively immutable after creation, so choose stable identity labels. Do not place a release version in the selector; versions change during every rollout.

The readiness probe controls whether a Pod is eligible to receive Service traffic. A running process is not necessarily ready: it may still be loading configuration, warming caches, or waiting for a dependency. The liveness probe has a different purpose and can restart a stuck container. Pointing both probes at a fragile dependency can turn an external outage into a restart loop.

Resource requests help the scheduler place Pods based on expected consumption. A memory limit can contain a leak, but a CPU limit can introduce throttling, so it should come from measurement rather than a copied default.

The rolling update permits one extra Pod and requires all desired replicas to remain available. That favors availability but needs temporary cluster capacity for the surge. For a non-critical environment, allowing one unavailable replica may use capacity more efficiently.

## Validate and apply

Ask the API server to validate the object without persisting it:

```bash
kubectl apply \
  --filename deployment.yaml \
  --namespace applications \
  --server-side \
  --dry-run=server
```

Server-side dry run exercises API validation and admission policies. It can still differ from the final write if cluster state changes between commands, but it catches more than local parsing.

Apply the reviewed file and wait for the controller:

```bash
kubectl apply \
  --filename deployment.yaml \
  --namespace applications

kubectl rollout status \
  deployment/release-api \
  --namespace applications \
  --timeout=5m
```

Do not treat `kubectl apply` returning zero as rollout success. It only confirms that the API accepted the desired state. `kubectl rollout status` waits for the Deployment to reach its completion criteria and returns a failure when the timeout is exceeded.

## Observe the ownership chain

Inspect the Deployment first:

```bash
kubectl get deployment release-api \
  --namespace applications \
  --output wide

kubectl describe deployment release-api \
  --namespace applications
```

Then list the controlled ReplicaSets and Pods using the same stable label:

```bash
kubectl get replicasets,pods \
  --namespace applications \
  --selector app.kubernetes.io/name=release-api \
  --show-labels
```

The `READY`, `UP-TO-DATE`, and `AVAILABLE` Deployment columns answer different questions. A desired replica may exist without being ready, and an old ReplicaSet may remain during a rollout. Events near the bottom of `kubectl describe` often reveal image pull failures, failed scheduling, probe failures, or admission problems.

## Perform a controlled rollout

Update the image in source control, review the manifest diff, and apply it. For an interactive demonstration, `kubectl set image` changes the Pod template directly:

```bash
kubectl set image deployment/release-api \
  api=ghcr.io/example/release-api:1.1.0 \
  --namespace applications

kubectl rollout status deployment/release-api \
  --namespace applications \
  --timeout=5m
```

Changing the Pod template creates a new ReplicaSet. Changing only the replica count does not. In a GitOps or infrastructure-as-code workflow, direct mutations such as `set image` can create drift, so commit the desired version and let the delivery controller perform the update.

Watch the rollout from another terminal when diagnosing timing:

```bash
kubectl get pods \
  --namespace applications \
  --selector app.kubernetes.io/name=release-api \
  --watch
```

A useful rollout gate checks more than Pod readiness. Exercise a real application endpoint, inspect error rate and latency, and verify that the new image identity is visible in logs or metrics.

## Roll back a bad revision

View recorded revisions:

```bash
kubectl rollout history deployment/release-api \
  --namespace applications
```

Undo the latest rollout:

```bash
kubectl rollout undo deployment/release-api \
  --namespace applications

kubectl rollout status deployment/release-api \
  --namespace applications \
  --timeout=5m
```

Rollback restores an earlier Pod template. It does not reverse a database migration, external configuration change, or irreversible side effect. Application releases need backward-compatible data changes and an operational rollback plan beyond the Deployment object.

## Diagnose a stalled rollout

Work from the controller down instead of deleting Pods at random:

1. Run `kubectl describe deployment` and inspect conditions and events.
2. Identify the new ReplicaSet and compare desired, current, and ready replicas.
3. Describe a failing Pod to inspect scheduling and image events.
4. Read current and previous container logs with `kubectl logs` and `kubectl logs --previous`.
5. Confirm readiness behavior from inside the cluster if the probe path or network is in doubt.

Deleting a failing Pod only asks the ReplicaSet to recreate the same specification. Fix the image, configuration, resource constraint, probe, or policy that caused the failure.

## Production checklist

- Use an immutable image digest or a version tag with controlled promotion.
- Keep selector labels stable and separate from release labels.
- Define resource requests from measured workload behavior.
- Use a readiness probe that represents the ability to serve traffic.
- Choose `maxSurge` and `maxUnavailable` against real capacity and availability requirements.
- Wait for rollout status in the deployment pipeline.
- Add application-level health and telemetry gates.
- Retain enough revision history for practical rollback.
- Keep the manifest in source control and avoid untracked direct mutations.
- Plan database and configuration compatibility independently of Kubernetes rollback.

## References

- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Run a stateless application using a Deployment](https://kubernetes.io/docs/tasks/run-application/run-stateless-application-deployment/)
