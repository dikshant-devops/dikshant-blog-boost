---
title: "Measure Network Throughput Safely with iPerf3"
excerpt: "Use iPerf3 to measure TCP throughput, retransmits, UDP loss, and jitter with repeatable tests that separate network limits from host bottlenecks."
date: "2025-12-02"
updatedDate: "2026-08-31"
author: "Dikshant Rai"
category: "Networking"
platform: ""
difficulty: "Beginner"
image: "/images/social/networking.png"
tags: ["Networking", "DevOps", "Linux"]
tools: ["iPerf3"]
---

A speed test to the public internet cannot tell you why traffic between two private hosts is slow. The result mixes the local network, internet path, test provider, and both endpoints into one number. iPerf3 removes much of that ambiguity by generating controlled traffic between a server and client that you choose.

The tool is useful for measuring achievable TCP throughput, TCP retransmits, and UDP loss and jitter. It does not replace application monitoring, packet captures, or a latency tool such as `ping`. This guide builds a repeatable test that helps distinguish a network-path limit from CPU, interface, firewall, or endpoint constraints.

## What iPerf3 measures

iPerf3 performs active measurements between two endpoints. One process listens as the server and the other starts the test as the client. By default, the client sends TCP traffic to the server for ten seconds over port `5201`.

The most useful results depend on the protocol:

| Test | Useful signals | What it does not prove |
| --- | --- | --- |
| TCP | Throughput, retransmits, congestion-window behavior | Maximum link capacity in every workload condition |
| Reverse TCP | Throughput from server to client | That both directions behave the same |
| Parallel TCP | Whether one stream is the limiting factor | That an application can use the same concurrency |
| UDP | Achieved bitrate, datagram loss, jitter | One-way latency or safe production capacity |

UDP jitter is variation in packet timing, not the same measurement as round-trip or one-way latency. Use a dedicated latency test when delay is the question.

## Plan the test before sending traffic

An iPerf3 test can consume a substantial share of a link. Treat it as a controlled load test:

- choose endpoints that represent the path under investigation;
- confirm that both hosts have enough CPU and interface capacity;
- restrict firewall access to the test client rather than exposing port `5201` publicly;
- start below the expected link capacity and increase deliberately;
- avoid peak production periods unless the test is part of an approved exercise;
- record host types, zones or regions, iPerf3 versions, time, direction, protocol, and command.

For a UDP test, allow both TCP and UDP on the selected port. iPerf3 still uses a TCP control connection while UDP carries the test traffic.

## Install and verify iPerf3

Ubuntu and Debian package iPerf3 in their standard repositories:

```bash
sudo apt-get update
sudo apt-get install --yes iperf3
iperf3 --version
```

On macOS with Homebrew:

```bash
brew install iperf3
iperf3 --version
```

Use the same recent iPerf3 version on both endpoints when possible. iPerf3 is not wire-compatible with the original iPerf2 implementation, so verify the executable rather than assuming the name `iperf` refers to the same protocol.

## Establish a controlled server

Assume the server uses private address `10.20.0.20` and only test client `10.10.0.15` may connect. Configure the relevant host and network firewalls before starting the listener.

Run a one-test server in the foreground:

```bash
iperf3 --server --one-off
```

`--one-off` exits after one completed client test. Running in the foreground keeps the event visible and avoids leaving an unnecessary listener behind. For repeated tests, omit `--one-off`, but stop the server when the test window ends.

On the server, confirm the process is listening on the expected address and port:

```bash
ss --tcp --listening --numeric --process | rg ':5201'
```

If `rg` is unavailable, use the equivalent filter available on the system. Do not widen a firewall before confirming that the service is listening and that routing between the two test addresses is correct.

## Run a baseline TCP test

From the client, send traffic for 30 seconds and print one-second intervals:

```bash
iperf3 \
  --client 10.20.0.20 \
  --time 30 \
  --interval 1
```

Read the final sender and receiver summaries. Small differences are normal because the endpoints account for data at different points. Focus on:

- sustained bitrate after the initial ramp-up;
- retransmits reported by the sender;
- large interval-to-interval changes;
- CPU utilization on both hosts during the test.

One result is not a baseline. Run at least three tests under comparable conditions and keep the commands with the results.

## Test the reverse direction

Network paths can be asymmetric. Security appliances, cloud routes, interface limits, and congestion can affect one direction more than the other.

Use reverse mode so the server sends and the client receives:

```bash
iperf3 \
  --client 10.20.0.20 \
  --reverse \
  --time 30 \
  --interval 1
```

Compare forward and reverse throughput rather than averaging them. A large difference is evidence to inspect routing, shaping, receive limits, and host resources separately in each direction.

## Check whether one TCP stream is the constraint

A single TCP stream may not fill a high-bandwidth, high-latency path because its congestion window grows gradually and is bounded by packet loss and buffer behavior. Test a small number of parallel streams:

```bash
iperf3 \
  --client 10.20.0.20 \
  --parallel 4 \
  --time 30
```

Interpret the change carefully:

- If four streams are much faster than one, the path may be healthy while a single flow is constrained by latency, loss, or host tuning.
- If both results stop at the same rate, inspect interface limits, shaping, virtual-machine bandwidth tiers, and CPU saturation.
- If parallel streams increase retransmits or harm production traffic, stop the test and reduce the load.

Do not report the parallel result as the expected speed of a single-connection application.

## Use UDP to measure loss and jitter

UDP tests send at a target bitrate. The default target is intentionally low, so specify a controlled value below the expected path capacity first:

```bash
iperf3 \
  --client 10.20.0.20 \
  --udp \
  --bitrate 100M \
  --time 30 \
  --interval 1
```

Review the achieved bitrate, lost datagrams, loss percentage, and jitter. Increase the target in measured steps only when the environment can tolerate it.

With multiple UDP streams, iPerf3 applies the bitrate limit to each stream. For example, `--parallel 4 --bitrate 100M` can target approximately `400 Mbit/s` in aggregate, not `100 Mbit/s`. This is an easy way to overload a test path accidentally.

Packet loss at an aggressive offered rate does not automatically prove a network fault. It can mean the sender exceeded the receiver, interface, queue, or policy capacity. Repeat at lower rates to find where loss begins.

## Save results as machine-readable evidence

JSON output makes comparisons easier and preserves details that are lost in screenshots:

```bash
iperf3 \
  --client 10.20.0.20 \
  --time 30 \
  --json \
  > "iperf3-forward-$(date -u +%Y%m%dT%H%M%SZ).json"
```

Store the result with:

- client and server identifiers;
- iPerf3 versions;
- source and destination addresses;
- protocol, direction, duration, and parallel-stream count;
- expected interface or service limits;
- CPU and network-interface observations from both hosts.

Remove addresses or metadata that should not leave the environment before attaching results to a public issue.

## Diagnose results without jumping to conclusions

### Throughput is lower than expected with no retransmits

Check the machine or service bandwidth tier, CPU use, virtualization limits, traffic shaping, and whether one stream can fill the bandwidth-delay product. Compare one stream with a small parallel test.

### Retransmits rise during TCP tests

Inspect packet loss, congestion, interface errors, MTU problems, and overloaded queues. A retransmit count identifies a symptom; it does not identify which device discarded the packet.

### UDP loss begins at a specific bitrate

Repeat immediately below and above that rate. Correlate the threshold with interface limits, policy limits, queue drops, and receiver CPU. Avoid assuming the physical link is the bottleneck.

### Results vary between runs

Check whether the route, zone, host load, CPU frequency, background traffic, or test duration changed. Stable methodology matters more than collecting many incomparable numbers.

## Cleanup and safety checks

After testing:

1. Stop any long-running iPerf3 server.
2. Remove temporary firewall access.
3. Confirm that no process still listens on the test port.
4. Store or delete result files according to the environment's data policy.
5. Record whether the test affected application latency or error rates.

## Key takeaways

- iPerf3 actively generates traffic; scope and monitor it like a load test.
- Test forward and reverse directions separately before calling a path slow.
- Compare one TCP stream with limited parallel streams, but do not confuse their application behavior.
- UDP results show loss and jitter at an offered rate; they do not directly measure latency.
- Keep commands, versions, host context, and JSON results so another engineer can reproduce the finding.

## References

- [Official iPerf3 documentation](https://software.es.net/iperf/)
- [Invoking iPerf3 and command-line options](https://software.es.net/iperf/invoking.html)
- [Obtaining iPerf3](https://software.es.net/iperf/obtaining.html)
- [ESnet iPerf3 source repository](https://github.com/esnet/iperf)
