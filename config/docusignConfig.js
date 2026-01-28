// DocuSign Configuration
// WARNING: This is for DEMO purposes only. Never expose private keys in production!
const DOCUSIGN_CONFIG = {
  // Cloudflare Worker proxy URL to bypass CORS
  // Deploy the worker first, then set this to your worker URL (e.g., 'https://docusign-proxy.YOUR_SUBDOMAIN.workers.dev')
  proxyUrl: 'https://docusign-proxy.timbranthover.workers.dev',
  integrationKey: 'e3b57567-c8d9-4a8c-9afa-a9c17d6c0e6c',
  userId: 'f8153ebd-bdaf-47dc-b281-f79e5bc0e345',
  accountId: 'a8cadde8-8b48-4282-8bd8-7bbaeb670fc3',
  basePath: 'https://demo.docusign.net/restapi',
  oAuthBasePath: 'account-d.docusign.com',
  templateId: '7b218ea1-868f-44c8-9307-ad8f963d2dd6',
  rsaPrivateKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAhQCmPaZ9P4YxjTK5pZExBecBVglOuJr75T3/GA4rM44YGog4
m91NbwCk/MvuE/sAWupwADY2XW2QibBl4qpWuOtcs9+0nzbix5G2SvpfxOnLIUpu
J4rZnYfLXLqhuM4Gzq++yzvH0xlE0jc4e+NahU8ChhlzdF3sWPi+5MXjXdP8AdF1
WVhpf+LeqHCw780a1g6lF4nWfyAKlokcQ7JAnkNg8G6IOJ5L4AXrC2palklgN6fH
zrFLykgF0HINbhZ4RvMFXUV8d7vuUgAatNIa9fA1c007g3lrztfeGREIp3vH41go
GQ1/kFc1KPfGlPhfD5n8eW2icoOi545/9K/w2wIDAQABAoIBAAV32npN9VtpPv/Z
IrW3sOSB5cBjISGlbZZCj1/nXh0cvAJLPwM9Cx6gFwv8ytsFOF5LpaT1eTDzCyA+
E0QQbTmso42EUT7Cg5cMBXykjwhRSp8hxO0uYASCPWrZde0ignEjotUrWLK7JwFs
qY9lfqaVx3OsaYk2InU9+/XfBra2VteCcm7XEfOyUOsO+Sr673UUgaurq8qlkr05
2rxkDe+zwNJhXGz8SQajMDm/X2L7y2N+XOKj3smR1dt42sXlPtlS3hXtBz9Blygg
IyAqpZc6WDxu6g0hI82t4XlVv7AGJQe683HowxllxzhhDKJbXoZZ+XNM7b5FOe5A
6IYNegECgYEAutYYaDt9x7sqZO+B9se/2bWfWKRdAP6afBc3ZBbu2K3IX7jaqn1v
NBP/jvhq3BGztLrpjFgq5//FpSuxLqZUKhU5xCUNgqrXRFkyxF7pi4p0/k338yKv
QJAQjKTGp12I36vt539rXxeDmhCFYOJWmuh1oqm2O4sbdcb6eqYzFoECgYEAtjzk
bHKxUnplpwyH4iZPh6+r6D/+1jX3oJmcwpTiAq53nnpnvztLviVw263cW/wZ2LzT
JAmSRIh4gjdhtb/BWROvYzikAdax2NQRipVgNjpFqM9QO5mux9mXR/xK38I0o3ZF
fOGx3bej2hqjXlfoQ7m6JeuSOkhvvKRqP3eYcVsCgYEAn9sYjO4Bw0dfkXbfIs9r
VZGxIb2XmYc9lFik2u1INHoUC9p0tRSXdd56dNAVVe+La2HU+3BgXZmYeKa2dWx4
bH02rJzrP1Z+0orjBeMTPYIccY0yTYPqoHnivwMouQAtYPqQldaOfpD213W1ONzP
LsEgDSnZsn5l41J480GKSoECgYAB5XxTDJZ/zzpDlMPNPKzTMqbNUe0q+YDMMQ0K
kVYQxRQFmCyANvPA1M7p2lNSubrjIIPp+heFkw39/OmNZKN0c9n9ZFeAlWVgZkSQ
dqF7rvuOmCmzlRPWjJMgcqWs0m6NzOtIM2kQb5rK6EAO+Uc3fTVMs7jf1mUjR2q7
olj5xQKBgFnu6O0Eem4BITTpDjZFjm+y2QMMgbMOjZTsZr6dL5SBoTEu9Bpzsyu5
U5iLx69xinnyDAgHk+99P3bnryDFT+mtnOlJKaT/CDZ8m0IXVAANRn27gdLGWas7
Gu/TjYVW20DPRVk+q+zPrFVjeuEcXwuGo+xPhQfjZk/y8D04yHG7
-----END RSA PRIVATE KEY-----`,
  scopes: ['signature', 'impersonation']
};
