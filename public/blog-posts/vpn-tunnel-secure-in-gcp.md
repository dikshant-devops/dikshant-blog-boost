When a VPN Becomes a Route

A practical SecOps pattern for protecting production from accidental BGP route advertisements

Category: SecOps · Cloud Networking · Route Security
Environment: Illustrative Google Cloud production design
Document status: Reusable reference pattern
Validation: Command syntax and policy logic validated
Usage: Replace every example identifier before execution



The quiet risk inside an encrypted tunnel

An encrypted VPN tunnel solves one important problem: it protects traffic in transit. It does not decide whether the routes received through that tunnel are safe.

That distinction is easy to miss. Once BGP is involved, a partner connection is no longer just a private path between two networks. It is also a source of routing information that can influence production traffic.

The failure mode we wanted to prevent was straightforward:



What happens if the partner accidentally advertises 0.0.0.0/0?

That single prefix represents the entire IPv4 address space. If accepted as a learned route, it could turn a customer VPN into an unintended default path for traffic that has nothing to do with that customer.

This was not treated as a question of trust. It was treated as a boundary-control problem. Good SecOps design assumes that well-intentioned systems can still make dangerous mistakes.





The control pattern

This pattern applies a dedicated Cloud Router import policy to one example partner BGP peer.

The policy does two things:





Drops the exact IPv4 default route, 0.0.0.0/0.



Accepts other IPv4 prefixes with MED 2000, lowering their preference in route comparisons where MED is considered.

Routes received from Example Partner
        │
        ▼
Example Partner import policy
        │
        ├── 0.0.0.0/0       → DROP
        │
        └── /1 through /32  → SET MED 2000 → ACCEPT

The control is attached only to the example partner peer. Other BGP sessions remain outside its scope.



Important: This is a route-admission control. It governs BGP prefixes learned by Cloud Router. It is not a firewall rule and does not inspect packets.





Why the filter is deliberately defensive

The first term explicitly drops 0.0.0.0/0:

destination == '0.0.0.0/0'

The second term uses longer():

destination.inAnyRange(prefix('0.0.0.0/0').longer())

This is more defensive than orLonger().





orLonger() matches the /0 itself and every more-specific prefix.



longer() matches only /1 through /32.

The explicit drop rule is therefore not the only thing protecting the default route. Even if someone later changes the policy order, the acceptance term still cannot match 0.0.0.0/0.

That is a small syntax choice with a meaningful security benefit: the safe behavior survives more than one kind of operator mistake.





Example configuration

The following values are intentionally fictional. Replace them with values read from the target environment before executing any change.







Resource



Example value





Project



example-prod-project





Region



us-central1





VPC



example-prod-vpc





Cloud Router



example-prod-vpn-router





VPN tunnel



example-partner-vpn-tunnel





Router interface



if-example-partner-bgp





BGP peer



example-partner-bgp-peer





Cloud Router ASN



64514





Example Partner ASN



64515





Cloud Router BGP IP



169.254.10.1





Example Partner BGP IP



169.254.10.2





GCP prefix advertised to Example Partner



10.20.30.0/24





Import policy



example-partner-import-policy

After deployment, the example peer should reference:

importPolicies:
  - example-partner-import-policy





Reference implementation



Create the import policy

gcloud beta compute routers add-route-policy example-prod-vpn-router \
  --project=example-prod-project \
  --region=us-central1 \
  --policy-name=example-partner-import-policy \
  --policy-type=IMPORT

Purpose: Creates an empty import-policy resource on the example Cloud Router.
Security value: Establishes a dedicated policy boundary for one partner instead of modifying a policy shared by other peers.

Term 1 — Reject the learned default route

gcloud beta compute routers add-route-policy-term example-prod-vpn-router \
  --project=example-prod-project \
  --region=us-central1 \
  --policy-name=example-partner-import-policy \
  --priority=1 \
  --match="destination == '0.0.0.0/0'" \
  --actions="drop()"

Purpose: Rejects the exact IPv4 default route before it can become a learned dynamic VPC route.
Security value: Prevents the Example Partner tunnel from becoming an unintended path for general production egress.

Term 2 — Admit non-default IPv4 routes at MED 2000

gcloud beta compute routers add-route-policy-term example-prod-vpn-router \
  --project=example-prod-project \
  --region=us-central1 \
  --policy-name=example-partner-import-policy \
  --priority=9999 \
  --match="destination.inAnyRange(prefix('0.0.0.0/0').longer())" \
  --actions="med.set(2000); accept()"

Purpose: Accepts IPv4 prefixes /1 through /32 and overwrites the partner-supplied MED with 2000.
Security value: Keeps the default route outside the match while making accepted routes less preferred in applicable comparisons.

Attach the policy only to Example Partner

gcloud compute routers update-bgp-peer example-prod-vpn-router \
  --project=example-prod-project \
  --region=us-central1 \
  --peer-name=example-partner-bgp-peer \
  --import-policies=example-partner-import-policy

Purpose: Applies the import control to the BGP session associated with example-partner-vpn-tunnel.
Security value: Avoids modifying shared policies or changing unrelated production peers.



These commands are examples. Replace all identifiers and inspect the target router first. Do not run the create command if the policy already exists, and do not add terms whose priorities are already present.





How to verify the control



Read the policy definition

gcloud beta compute routers get-route-policy example-prod-vpn-router \
  --project=example-prod-project \
  --region=us-central1 \
  --policy-name=example-partner-import-policy \
  --format=yaml

Use: Confirms the exact match expressions, action order, and policy-term priorities.
Look for: drop() on 0.0.0.0/0 and med.set(2000); accept() on the longer() expression.

Confirm the policy is attached to the right peer

gcloud compute routers describe example-prod-vpn-router \
  --project=example-prod-project \
  --region=us-central1 \
  --format=json | \
jq '.bgpPeers[] | select(.name == "example-partner-bgp-peer") | {name, interfaceName, peerAsn, importPolicies}'

Use: Verifies policy attachment without relying on the policy name alone.
Look for: example-partner-import-policy attached to example-partner-bgp-peer on if-example-partner-bgp.

See what Example Partner sends before filtering

gcloud beta compute routers list-bgp-routes example-prod-vpn-router \
  --project=example-prod-project \
  --region=us-central1 \
  --peer=example-partner-bgp-peer \
  --address-family=IPV4 \
  --route-direction=INBOUND \
  --no-policy-applied \
  --format=yaml

Use: Captures the raw route advertisements received from Example Partner before policy processing.
Look for: Unexpected broad prefixes, especially 0.0.0.0/0, and prefixes outside the agreed network scope.

See what remains after filtering

gcloud beta compute routers list-bgp-routes example-prod-vpn-router \
  --project=example-prod-project \
  --region=us-central1 \
  --peer=example-partner-bgp-peer \
  --address-family=IPV4 \
  --route-direction=INBOUND \
  --policy-applied \
  --format=yaml

Use: Shows the routes that survived policy evaluation and their modified attributes.
Look for: No 0.0.0.0/0, and MED 2000 on accepted non-default IPv4 routes.

Confirm effective routes through the Example Partner tunnel

gcloud compute routers get-status example-prod-vpn-router \
  --project=example-prod-project \
  --region=us-central1 \
  --format=json | \
jq '[.result.bestRoutesForRouter[] | select(.nextHopVpnTunnel != null and (.nextHopVpnTunnel | endswith("/example-partner-vpn-tunnel"))) | {destRange, priority, routeStatus, nextHopIp}]'

Use: Filters the effective Cloud Router route set to paths learned through example-partner-vpn-tunnel.
Look for: No default route and priority 2000 on accepted Example Partner routes that reach the effective set.





Configuration assurance is not runtime assurance

A correctly defined and attached policy proves configuration intent. It does not prove that live routes are being filtered as expected.

Runtime assurance requires an established VPN and BGP session. After the session reaches Established, capture both the pre-policy and post-policy route views and compare them.

This distinction is important in security reporting:





Configuration assurance: The policy exists, contains the intended terms, and is attached to the intended peer.



Operational assurance: Live BGP evidence confirms that the default route is absent post-policy and accepted routes carry MED 2000.





What MED 2000 does—and what it does not do

MED is useful, but it should not be described as a universal safety mechanism.

It helps when Google Cloud compares eligible routes for the same destination and MED participates in that comparison. A larger MED is less preferred than a smaller one.

It does not override every other routing decision:





A more-specific prefix is considered before a broader prefix.



The VPC's configured best-path selection mode influences how MED is compared.



MED comparison can be affected by neighbor ASN grouping.



Local subnet routes and other route categories follow Google Cloud's routing order.

The default-route drop is the hard control. MED 2000 is preference management for the routes that remain.





Residual risk and the next maturity step

The example policy accepts every non-default IPv4 prefix. That is intentionally broader than a mature route-admission policy.

For example, a mistaken /8, /16, /24, or /32 can still be accepted. A more-specific unexpected route might affect traffic even with MED 2000.

The stronger end state is fail-closed:

0.0.0.0/0                    → DROP
Approved partner prefixes only → SET MED 2000 → ACCEPT
Everything else                → DROP

Once the tunnel is operational, the pre-policy route output should be compared with the network contract agreed with Example Partner. That observed and approved prefix set should become the allowlist.

Security controls are strongest when they encode the relationship we intended—not every route the other side is technically capable of sending.





Rollback reference

gcloud compute routers update-bgp-peer example-prod-vpn-router \
  --project=example-prod-project \
  --region=us-central1 \
  --peer-name=example-partner-bgp-peer \
  --import-policies=""

Use: Detaches the policy from Example Partner without deleting the tunnel, BGP peer, or policy definition.
Caution: This restores default Cloud Router import behavior and removes the default-route protection from the Example Partner peer.





References





Google Cloud: BGP route policy attribute reference



Google Cloud: Create BGP route policies



Google Cloud: List pre-policy and post-policy BGP routes



Google Cloud: Learned routes and best-path selection



Google Cloud: VPC route selection order

