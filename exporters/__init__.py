"""Modular JSON export package.

Each submodule owns exactly one output file under ``output/data/`` and
exposes a single ``*Exporter`` class with a ``build()`` method (returns the
data structure) and an ``export()`` method (writes it to disk).

``json_exporter.JSONExporter`` is the coordinator that wires a shared
SQLite connection into every individual exporter and runs them in order.
"""
