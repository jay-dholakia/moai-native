
```shell
# Add a Postgres MCP with unrestricted access mode
claude mcp add-json postgres '{
      "command": "postgres-mcp",
      "args": [
        "--access-mode=unrestricted"
      ],
      "env": {
        "DATABASE_URI": "postgresql://postgres:postgres@localhost:54322/postgres"
      }
    }'
```

```shell
# add playwright MCP
claude mcp add-json playwright '{
      "command": "npx",
      "args": [
        "@playwright/mcp@latest"
      ]
    }'
```

```shell
# add maestro MCP
claude mcp add-json maestro '{
      "command": "maestro",
      "args": [
        "mcp"
      ]
    }'
```
```shell
# Add a Postgres MCP with unrestricted access mode
claude mcp add-json postgres '{
      "command": "postgres-mcp",
      "args": [
        "--access-mode=unrestricted"
      ],
      "env": {
        "DATABASE_URI": "postgresql://postgres:postgres@localhost:5432/launchai"
      }
    }'
```