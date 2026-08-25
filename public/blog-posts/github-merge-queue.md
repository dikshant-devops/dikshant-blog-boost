# Merge Queues: A Safer Way to Keep `main` Green

Merging code should feel routine. A pull request gets reviewed, tests pass, and
the change lands safely. On a quiet repository, direct merging often works well
enough. On a busy repository, the final merge step can become one of the most
fragile parts of the development workflow.

A pull request can pass CI, receive approval, and still break `main` after it
merges. That usually happens because the PR was tested against one version of
the base branch, but it merged into another version after other pull requests
landed first.

A merge queue solves this by testing pull requests in the order they will
actually land.

## The Problem With Direct Merging

In a direct merge workflow, developers merge pull requests as soon as the branch
protection requirements are satisfied.

That can be fine when merge volume is low. But as more people work on the same
branch, a few recurring problems show up:

- Two pull requests can pass CI independently but fail when combined.
- Developers race to merge before their branch becomes outdated.
- Teams repeatedly rebase, update branches, and rerun checks.
- `main` breaks even though each individual PR appeared green.
- Engineers spend time tracing which merge introduced the failure.

The core issue is that normal PR CI often answers this question:

> Does this PR work against the base branch at the time CI ran?

The safer question is:

> Does this PR work against the exact version of the base branch it will create
> when it merges?

A merge queue is designed to answer the second question.

## What Is a Merge Queue?

A merge queue is an ordered line of pull requests waiting to merge into a
protected branch.

Instead of merging directly, a PR enters the queue. GitHub creates a temporary
merge-group branch that includes:

- the latest target branch,
- any pull requests already ahead in the queue,
- and the pull request currently being validated.

CI runs on that temporary branch. If required checks pass, GitHub merges the PR
automatically. If checks fail, GitHub removes the PR from the queue and keeps the
target branch protected.

In GitHub, these temporary branches use a prefix like:

```text
gh-readonly-queue/<base-branch>/
```

For example:

```text
gh-readonly-queue/main/pr-123-abc123
```

That temporary branch represents the future state of the target branch if the
queued changes land.

## How GitHub Merge Queue Works

A typical flow looks like this:

1. A developer opens a pull request.
2. The PR receives the required approvals.
3. Required checks pass on the PR.
4. The developer clicks **Merge when ready**.
5. GitHub adds the PR to the merge queue.
6. GitHub creates a temporary merge-group branch.
7. CI runs against that temporary branch.
8. If checks pass, GitHub merges the PR.
9. If checks fail, GitHub removes the PR from the queue.

The important detail is that final validation happens against the code that is
actually about to become the base branch.

## Why Merge Queues Matter

### 1. They Keep the Main Branch Healthier

The biggest benefit is stability.

Without a merge queue, a PR can be green before merge but fail after another PR
lands. With a merge queue, GitHub validates the PR together with the changes
ahead of it.

That reduces the chance of breaking the protected branch with an integration
issue.

### 2. They Reduce Manual Rebasing

Without a queue, developers often need to update their branch, wait for CI, and
try to merge before someone else lands another change.

A merge queue automates much of that work. Developers can click **Merge when
ready** and move on. The queue handles ordering, revalidation, and merging.

### 3. They Improve Confidence in CI

A green CI result is more useful when it runs against the real merge result.

Merge queues make CI answer a more practical question: will this branch stay
green after this PR lands?

### 4. They Help Busy Teams Merge Predictably

The more people merging into the same branch, the more valuable a queue becomes.

On high-traffic branches, direct merging can turn into a race. Merge queues
replace that race with a predictable process.

### 5. They Make Failures Easier to Contain

If a queued PR fails required checks, GitHub removes it from the queue instead
of merging it. The author can fix the issue and requeue it later.

The protected branch remains stable.

## What Actually Gets Tested?

Suppose the base branch is at commit `M0`, and three pull requests are queued:

```text
Queue: PR A, PR B, PR C
```

The merge queue does not simply test all three PRs independently against `M0`.
Instead, it validates future branch states.

For example, GitHub may validate:

```text
PR A against M0
PR B against M0 + PR A
PR C against M0 + PR A + PR B
```

This is what prevents the common failure mode where PR B passed against the old
base branch but fails after PR A lands.

If PR A fails, GitHub removes PR A and recreates the queue for the remaining PRs.
PR B is then tested again against the new expected future state.

## Important GitHub Settings

When enabling merge queue, repository admins should review the queue settings
carefully.

### Required Checks

Only checks that must protect the branch should be required.

Every required check must run on merge queue branches. If a required check only
runs on normal pull requests, the queue can get stuck waiting for a status that
will never appear.

For GitHub Actions, required workflows should include:

```yaml
on:
  pull_request:
  merge_group:
```

For third-party CI systems, configure CI to run on GitHub's temporary queue
branches:

```text
gh-readonly-queue/<base-branch>/
```

For example:

```text
gh-readonly-queue/main/
```

### Build Concurrency

Build concurrency controls how many merge-group validations GitHub may run at
the same time.

A lower value is safer and easier to debug. A higher value improves throughput
but can create more speculative CI work.

A conservative starting point is:

```text
Build concurrency: 1 or 2
```

### Maximum Pull Requests to Build

This controls how many pull requests can be grouped into one merge-group
validation.

A value of `1` means pull requests are validated one at a time. Multiple pull
requests can still sit in the queue, but GitHub processes them serially or in
small speculative steps depending on build concurrency.

A higher value can improve throughput, but failures can be harder to attribute
because one failing build may contain multiple pull requests.

A safe rollout usually starts with:

```text
Maximum pull requests to build: 1
```

Teams can increase it after observing stable queue behavior.

### Merge Limits

Merge limits control how many pull requests GitHub may merge into the base
branch at once after checks pass.

This is useful when merges trigger deployments or other downstream automation.
For example, a team may want to validate several queued PRs quickly but merge
only a smaller number at a time to keep deploy risk manageable.

### Status Check Timeout

This tells GitHub how long to wait for CI before treating the queue validation
as failed.

Set this above the normal upper bound of CI runtime, with enough buffer for
slower builds.

## How Developers Use It

For developers, the workflow is simple:

1. Open a PR.
2. Get the required approvals.
3. Wait for required checks to pass.
4. Click **Merge when ready**.
5. Let GitHub handle the queue.

If the PR is removed from the queue, check the failed required check, fix the
issue, and click **Merge when ready** again.

Developers should avoid direct merge buttons when merge queue is required. The
queue is the safe path because it validates the future state of the branch.

## What Happens If Something Fails?

If CI fails on a merge-group branch, GitHub removes the responsible PR from the
queue. Then it rebuilds the queue without that PR.

For example:

```text
Queue: PR A, PR B, PR C
```

If PR A fails, GitHub removes PR A and recreates the queue for PR B and PR C.

This keeps the target branch safe while allowing unrelated PRs to continue
moving.

## When Merge Queues Are Most Useful

Merge queues are especially useful when:

- many PRs merge into the same branch each day,
- CI takes several minutes or longer,
- the repository is a monorepo,
- multiple teams touch shared code,
- developers often need to rebase before merging,
- `main` breaks even after PR checks passed,
- releases depend on keeping the base branch consistently green.

Small projects with low merge volume may not need a queue. But as merge traffic
grows, a merge queue becomes a practical reliability tool.

## Rollout Tips

Start conservatively.

A good initial setup is:

```text
Maximum pull requests to build: 1
Build concurrency: 1 or 2
```

After the team sees stable behavior, increase gradually:

```text
Maximum pull requests to build: 2 or 3
Build concurrency: 2 or 3
```

Avoid jumping straight to aggressive settings unless CI is reliable and the team
is ready to debug batch failures.

Also make sure every required check reports on merge queue branches. This is the
most common setup issue.

## Common Pitfalls

### Required Checks Do Not Run on Queue Branches

This is the most common failure mode.

The PR is added to the queue, GitHub creates the temporary queue branch, and then
nothing happens because CI never reports the required status on that temporary
branch.

The fix is to configure CI for merge queue events or `gh-readonly-queue/*`
branches.

### Too Much Concurrency Too Early

High concurrency can improve throughput, but it also creates more speculative
builds. If an early PR fails, later speculative builds may need to be recreated.

Start small, observe behavior, and increase gradually.

### Weak Required Checks

A merge queue only enforces the checks configured as required. If the required
checks do not cover the real risk, the queue cannot compensate.

Use the queue together with meaningful CI, code review, and branch protection.

### Confusing Queue Builds With PR Builds

A normal PR build and a merge queue build are not the same thing.

The PR build checks the pull request branch. The queue build checks the future
state of the base branch. The queue build is the one that protects the final
merge.

## Final Thoughts

A merge queue is not a replacement for good tests, useful code review, or
thoughtful engineering. It makes those safeguards run at the right moment.

Instead of asking whether a PR worked sometime in the past, against an older
base branch, the queue asks whether it works in the exact future state it is
about to create.

That is the real value: fewer broken branches, less manual coordination, and a
calmer merge process for everyone.

## Further Reading

- [GitHub Docs: Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
- [GitHub Docs: Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#merge_group)
- [GitHub Blog: Merge queue is generally available](https://github.blog/news-insights/product-news/github-merge-queue-is-generally-available/)
- [GitHub Blog: How GitHub uses merge queue to ship hundreds of changes every day](https://github.blog/engineering/engineering-principles/how-github-uses-merge-queue-to-ship-hundreds-of-changes-every-day/)
- [Graphite: Benefits of a merge queue vs. direct merging](https://graphite.com/guides/merge-queue-vs-direct-merging-benefits)
- [Atlassian: How merge queues help ship faster with fewer incidents](https://www.atlassian.com/blog/bitbucket/merge-queues-how-we-ship-faster-with-fewer-incidents)
