# Security Policy

## Supported Versions

Right now StudioEditor is based on quite old Javascript libraries for markdown parsing and related tasks. This may raise some security issues. If the plugin finds some broader audience that justifies efforts, roadmap is to substitute old libraries with new and maintained parsesrs like Markdown-it. As the plugin is used from within restricted areas of a GRAV instance possible vulnerabilities can't be considered severe/critical as long as GRAV instance owners can trust their authorized users. Nevertheless, the upgrade path for StudioEditor has to be focussed on implementing maintained and security aware javascript libraries.

| Version | Supported          |
| ------- | ------------------ |
| 1.1.4   | :white_check_mark: |

## :pushpin: Note on Security Severity

> NOTE: Please use the following guidlines when selecting a **Severity**.  Submitted advisories that are marked **High** or **Critical** that don't meet the guidelines below will be cliosed.

* **CRITICAL** - no account required, can modify content, or run malicious code or nefarious activity without any access.
* **HIGH** - publisher level account able to run malicious code or nefarious activity, or other high level security things.
* **MODERATE** - admin level account able to run malicious code or do nefarious things. other moderate security things.
* **LOW** - super admin level account able to run malicious code or do nefarious things. other minor security things.

## Reporting a Vulnerability

Please raise an issue in the repository if you discover any security problems.
