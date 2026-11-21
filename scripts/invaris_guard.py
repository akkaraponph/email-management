#!/usr/bin/env python3
"""Bounded static checks; these are heuristics, not a security proof."""
import json
import re
import sys
from pathlib import Path

policy = sys.argv[1]
findings = []
inspected = 0

def finding(path, line, message):
    findings.append({"policyId": policy, "path": path.as_posix(), "line": line, "message": message})

if policy == "scan-results-ignored":
    path = Path('.gitignore')
    lines = path.read_text().splitlines()
    inspected = 1
    if '/.tarosec/static-analysis-results/' not in lines:
        finding(path, 1, 'Required root-anchored ignore rule is missing.')
elif policy == "api-explicit-authorization":
    # This policy is a deliberately explicit convention, not an auth analyzer.
    # Each exported route handler must invoke the server-side authorization helper.
    for path in sorted(Path('src/app/api').rglob('route.ts')):
        text = path.read_text()
        handlers = list(re.finditer(r'export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(', text))
        for i, match in enumerate(handlers):
            inspected += 1
            end = handlers[i + 1].start() if i + 1 < len(handlers) else len(text)
            if not re.search(r'\bauthorizeTemplateRequest\s*\(', text[match.end():end]):
                finding(path, text.count('\n', 0, match.start()) + 1,
                        'Handler lacks the required authorizeTemplateRequest call; review authentication and ownership.')
elif policy == "no-raw-react-html":
    for path in sorted(Path('src').rglob('*.tsx')):
        inspected += 1
        for number, line in enumerate(path.read_text().splitlines(), 1):
            if re.search(r'\bdangerouslySetInnerHTML\s*=', line):
                finding(path, number, 'Raw React HTML sink requires replacement with an approved isolated rendering boundary.')
else:
    sys.exit(2)
if inspected == 0:
    print('No targets inspected', file=sys.stderr)
    sys.exit(2)
print(json.dumps({"version": "invaris.inspection/v1alpha1", "policyId": policy,
                  "inspected": inspected, "findings": findings}))
sys.exit(1 if findings else 0)
