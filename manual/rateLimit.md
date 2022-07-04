# Rate Limiting

Heretic allows you to use rate limits. This helps protect your website from various denial-of-service attacks and helps you to limit access for specified IPs.

In order to enable rate limits, you will need to **install Redis server** in addition to the base Heretic requirements. Then, please specify rate limit configuration in your *system.json* file.

When rate limits are reached, internal server error occurs. This triggers a 429 HTTP error, the *Internal Server Error* (*./src/errors/500*) page is displayed (using a different error message: *Rate Limit Exceeded*).

## Configuration

First, you will need to enable rate limiting by setting the *enabled* option to *true*.

There are global options which are affecting every module (and even static resource) of your site:

* *timeWindow*: time period (in milliseconds); in case a client reaches the maximum number of allowed requests in this time period, a *429* error is generated
* *max*: request limit until client gets temporary restricted
* *ban*: request limit until client gets banned

Additionally, you may wish to define blacklists and whitelists (arrays of string); add headers to the response).