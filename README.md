# Experimental Tabular Data Platform

[![Test](https://github.com/tchak/tableur/workflows/Test/badge.svg)](https://github.com/tchak/tableur/actions/workflows/test.yml)
[![Lint](https://github.com/tchak/tableur/workflows/Lint/badge.svg)](https://github.com/tchak/tableur/actions/workflows/lint.yml)

This is a backend for an experimental tabular data platform. It provides a RESTful API for importing, managing, querying and exporting tabular data.

Features:

- Import tabular data and schema from csv and spreadsheet files
- Create schema from scratch
- Manage data schema
- Manage data
- Add forms to collect new data
- Revise data schema while preserving data integrity
- Revise forms schema while preserving data integrity
- Query data with a rich query language
- Generate documents from templates and data
- Export to csv or json

To install dependencies:

```bash
just setup
```

To run:

```bash
just
```
