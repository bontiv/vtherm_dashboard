# Version constraints

A UI plugin says which versions of the dashboard it supports with `dashboard_version`, when it registers in Python. The
dashboard checks it before it downloads the module: a plugin that was not made for the running version is never executed.
Audience: plugin authors.

## Grammar

A constraint is a list of comparators separated by commas. Every comparator must be satisfied.

| Operator | Meaning |
| --- | --- |
| `>=` | The dashboard is this version or newer. |
| `>` | The dashboard is newer than this version. |
| `<=` | The dashboard is this version or older. |
| `<` | The dashboard is older than this version. |
| `==` | The dashboard is exactly this version. |

A version has a major and a minor number, an optional patch number, and an optional pre-release: `1.4`, `1.4.2`,
`2.0.0-rc.1`. `1.0` means `1.0.0`. Spaces around a comparator are ignored.

Not supported: `^1.0`, `~1.0`, `||`, wildcards such as `1.x`, `!=`, a single number such as `2`, and build metadata such as
`1.0.0+build`. The plugin is then `invalid` and its status quotes the faulty comparator.

## Pre-releases

The versions are ordered as on semver.org: `1.0.0-rc.1` is lower than `1.0.0`. So `>=1.0` is not satisfied by `1.0.0-rc.1`,
and `<2.0` is satisfied by `2.0.0-rc.1`. A plugin that must run on a pre-release names it in its constraint.

## Examples

<!-- example: docs/examples/python/version_constraints.py -->
```python
"""Constraints on the dashboard version, as a plugin declares them."""

SUPPORTS_VERSION_1 = ">=1.0,<2.0"
"""Every 1.x version. The plugin is not loaded by the dashboard 2.0, which it was not tested with."""

SUPPORTS_VERSIONS_1_AND_2 = ">=1.0,<3.0"
"""The constraint of the same plugin once it was tested with the dashboard 2.x."""

SUPPORTS_FROM_A_PRERELEASE = ">=1.0.0-rc.1,<2.0"
"""A pre-release is lower than its release, so a plugin that needs one must say it."""

EXACT_VERSION = "==1.4.0"
"""Only this version."""
```
<!-- /example -->

## When the constraint is not satisfied

The plugin has the state `dashboard_incompatible`, with the cause `too_old` (the dashboard is older than the plugin
supports) or `too_new` (the dashboard is more recent). The plugins that require it are `missing_dependency`.

## Support a new major version of the dashboard

Always give an upper bound, such as `<2.0`: a plugin that was not tested with a new major version is not loaded by it,
instead of failing in an unexpected way. When the new major version is out:

1. Read the section for plugin authors of the changelog of the release, which lists the incompatible changes and how to migrate.
2. Update your plugin and test it with the new version.
3. Widen the constraint, for example from `>=1.0,<2.0` to `>=1.0,<3.0` when the plugin works with both, and release it.

Keep the range of your dependency on `@vtherm/dashboard-sdk` aligned with this constraint: the SDK has the same version as the dashboard.
