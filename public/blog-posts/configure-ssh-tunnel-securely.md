
## A green connection was only the first test

We first proved the intended path from an approved test address:

```bash
ssh \
  -N \
  -L 15432:10.20.0.15:5432 \
  -i ./test-tunnel-key \
  -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=yes \
  tunneluser@203.0.113.20
```

Then we tested the controls. Each of the following was expected to fail:

```bash
# Interactive shell
ssh -i ./test-tunnel-key -o IdentitiesOnly=yes tunneluser@203.0.113.20

# Remote command
ssh -i ./test-tunnel-key -o IdentitiesOnly=yes tunneluser@203.0.113.20 id

# SFTP subsystem
sftp -i ./test-tunnel-key tunneluser@203.0.113.20

# A different private destination
ssh -N -L 18080:10.20.0.99:8080 \
  -i ./test-tunnel-key -o IdentitiesOnly=yes \
  tunneluser@203.0.113.20

# Reverse forwarding
ssh -N -R 18080:127.0.0.1:8080 \
  -i ./test-tunnel-key -o IdentitiesOnly=yes \
  tunneluser@203.0.113.20
```

We also attempted the connection from an address outside the provider allowlist. Ideally the firewall drops that traffic before sshd can process it. The key's `from=` restriction remains a second check in case the network rule changes later.

At the database layer, reads through the approved views succeeded. Inserts, updates, schema access outside `integration_export`, and object creation failed.

## How we debugged the public-key failure

The most useful step was filtering the logs by the expected username and source address instead of staring at every event on the bastion:

```bash
sudo journalctl -u ssh -f -o cat \
  | grep --line-buffered -E 'tunneluser|203\.0\.113\.10|publickey|signature algorithm|account|authentication'
```

The relevant line included a fingerprint:

```text
Failed publickey for tunneluser from 203.0.113.10 ... RSA SHA256:abc123...
```

We compared it with the installed key:

```bash
sudo ssh-keygen -lf /etc/ssh/tunneluser_authorized_keys
```

That comparison divides the investigation neatly:

- If the fingerprints differ, the external client is offering the wrong private key.
- If they match, the key reached the server. Check file readability, key restrictions, account state, and effective sshd policy.

For the second case, these commands cover most failures:

```bash
sudo passwd --status tunneluser
sudo namei -l /etc/ssh/tunneluser_authorized_keys
sudo -u tunneluser test -r /etc/ssh/tunneluser_authorized_keys
sudo sshd -T \
  -C user=tunneluser,host=bastion.example.com,addr=203.0.113.10 \
  | grep -E 'pubkeyauthentication|authorizedkeysfile|authenticationmethods|allowtcpforwarding|permitopen|maxsessions'
```

When normal logging is not enough, `LogLevel DEBUG3` can be added temporarily inside the user's `Match` block. Validate, reload, reproduce one attempt, and remove it afterward; debug-level SSH logging is noisy.

```bash
sudo sshd -t
sudo systemctl reload ssh
sudo journalctl -u ssh --since "2 minutes ago" --no-pager -o cat \
  | grep -E 'tunneluser|debug|publickey|authorized|Authentication'
```

The sequence of errors matters. A public-key rejection is an SSH problem. A `pg_hba.conf` message means SSH forwarding reached PostgreSQL. A database permission error means both the tunnel and database login worked, but the query exceeded the role's grants. Debug the layer that actually produced the message.

## Rotation and the day-two work

The setup is not finished when the first sync succeeds. Someone must be able to answer: Which key is this? Who owns it? When does it rotate? How do we shut it off quickly?

We monitor SSH activity by username, source address, and key fingerprint. At PostgreSQL, we monitor logins and query behavior by database role. The names can be the same for convenience, but they are separate identities and should remain independently revocable.

For a normal SSH-key rotation, add the new restricted public key as a second line, confirm a connection with it, and only then remove the old line. Rotate the database credential separately through the normal secret-management process.

For an incident, the shortest containment path may be any combination of:

- removing the authorized key;
- blocking the provider addresses temporarily;
- disabling the PostgreSQL login or rotating its password;
- terminating active database sessions; and
- preserving SSH, firewall, and PostgreSQL logs.

Removing the SSH key does not claw back data already synchronized, and it does not neutralize a database password copied somewhere else. The residual risk of any data integration is the data already delivered to it. That is why the database view should expose the smallest useful dataset in the first place.

When the integration is retired, remove the job, database login and sessions, public key, sshd drop-in, firewall rules, Unix account, database grants, and export views. A forgotten allow rule or dormant service account has a habit of surviving long after everyone remembers why it exists.

## The practical checklist

Before calling the connection production-ready, I want every answer below to be yes:

- Is the SSH identity dedicated, non-root, passwordless, and outside privileged groups?
- Can the key arrive only from documented provider addresses?
- Can sshd forward only to the exact PostgreSQL host and port?
- Do shell, command, SFTP, reverse-forwarding, and alternate-destination tests fail?
- Is bastion egress restricted as well as ingress?
- Does the client verify the bastion host key?
- Does PostgreSQL require TLS and use a separate read-only role?
- Is the exported dataset limited through a dedicated schema or views?
- Can we identify the key by fingerprint and revoke both credentials independently?
- Have we documented what to remove when the integration is decommissioned?

## What I would do differently next time

I would start with the fingerprint and readability checks instead of rereading the public key by eye. A 700-character RSA key can look correct while being the wrong key, and a perfectly correct key is useless when the configured file cannot be read.
