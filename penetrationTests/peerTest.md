# Penetration Peer Testing

## Participants

Partner 1:
- Name: James Finlinson
- URL: https://pizza.wheatharvest.llc

Partner 2:
- Name: Stephen Morgan
- URL: https://pizza.kepelcomputing.com/

## Self Attack

### James Finlinson (wheatharvest.llc)

I anticipated and protected myself against the following security attacks:

| Attack Type | Potential Severity | Description | Commits |
| ----------- | ------------------ | ------ | ---- |
| Security Misconfiguration | High | Change password for each of the following default, privileged users: a@jwt.com, f@jwt.com. |
| Vulnerable Components | High | Review and remove code-injecting 3rd party dependency. | d7bc8f983915d8d6391cd189ba7231ab923867ad |
| Authentication Failure | High |

## Peer Attack

### Against Stephen (kepelcomputing.com)

#### Security Misconfiguration

I was able to exploit the default admin credentials `a@jwt.com` to obtain access to the admin dashboard.

![.ad]
