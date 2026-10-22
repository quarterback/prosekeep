# Vloora editorial regression example

The before text uses formulaic expressions, a generic heading and an ambiguous link. More seriously, it claims completion when it names only a request. The after text keeps the distinction among an agent action, a service acknowledgment and a verified outcome. This is an illustrative editorial test case, not a real transaction or a documented product result.

Run:

```sh
node bin/prosekeep.mjs check examples/vloora/before.md --profile vloora
node bin/prosekeep.mjs review examples/vloora/after.md --profile vloora
node bin/prosekeep.mjs compare examples/vloora/before.md examples/vloora/after.md
```

Only a reviewer with the underlying request data can establish the real outcome. The automated checker reports language patterns and token changes, not factual success.
