#!/usr/bin/env python3
import csv
import json
import math
import os
import runpy
import sys
import warnings
from collections import OrderedDict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator, FuncFormatter

warnings.filterwarnings("ignore", message="Glyph .* missing from current font")


def load_json(path):
    with open(path, encoding="utf-8") as file:
        return json.load(file)


def num(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip().replace(",", "")
    if text.endswith("%"):
        text = text[:-1]
    if text == "":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def read_rows(path, schema):
    with open(path, encoding="utf-8-sig", newline="") as file:
        rows = list(csv.DictReader(file))
    numeric = [name for name, kind in schema.get("columns", {}).items() if kind == "number"]
    for row in rows:
        for name in numeric:
            row[name] = num(row.get(name))
    return rows


def color(theme, index, key=None):
    if key and key in theme.get("series", {}):
        return theme["series"][key]
    palette = theme.get("colors", {}).get("palette", ["#cc001e", "#494e52"])
    return palette[index % len(palette)]


def series_style(config, name, index, theme):
    styles = config.get("series") or {}
    style = styles.get(name, {}) if isinstance(styles, dict) else {}
    return {
        "color": style.get("color", color(theme, index, name)),
        "width": style.get("width", theme.get("lineWidth", 2)),
        "dash": style.get("dash"),
        "marker": style.get("marker"),
        "alpha": style.get("alpha", 1),
        "order": style.get("order", index),
    }


def figure_size(config, theme):
    width = config.get("width")
    height = config.get("height")
    aspect = config.get("aspect")

    def px(value):
        if isinstance(value, (int, float)):
            return float(value) / 100.0
        if isinstance(value, str) and value.endswith("px"):
            try:
                return float(value[:-2]) / 100.0
            except ValueError:
                pass
        return None

    w = px(width)
    h = px(height)
    if w and h:
        return (w, h)
    base_w, base_h = theme.get("figureSize", [8, 4.5])
    if w:
        return (w, w * base_h / base_w)
    if h:
        return (h * base_w / base_h, h)
    if isinstance(aspect, str) and ":" in aspect:
        try:
            aw, ah = [float(part) for part in aspect.split(":", 1)]
            return (base_w, base_w * ah / aw)
        except ValueError:
            pass
    if isinstance(aspect, (int, float)) and aspect > 0:
        return (base_w, base_w / float(aspect))
    return (base_w, base_h)


def apply_axes(ax, config, theme, axis="y"):
    options = (config.get("axes") or {}).get(axis, {}) if isinstance(config.get("axes"), dict) else {}
    if not isinstance(options, dict):
        options = {}
    label = config.get(f"{axis}Label") or options.get("label")
    if label:
        ax.set_ylabel(label) if axis == "y" else ax.set_xlabel(label)
    lower = config.get(f"{axis}Min", options.get("min"))
    upper = config.get(f"{axis}Max", options.get("max"))
    if lower is not None:
        (ax.set_ylim if axis == "y" else ax.set_xlim)(bottom=float(lower)) if axis == "y" else ax.set_xlim(left=float(lower))
    if upper is not None:
        (ax.set_ylim if axis == "y" else ax.set_xlim)(top=float(upper)) if axis == "y" else ax.set_xlim(right=float(upper))
    if options.get("log"):
        (ax.set_yscale if axis == "y" else ax.set_xscale)("log")
    step = options.get("majorStep")
    if step:
        (ax.yaxis if axis == "y" else ax.xaxis).set_major_locator(MultipleLocator(float(step)))
    minor = options.get("minorStep")
    if minor:
        (ax.yaxis if axis == "y" else ax.xaxis).set_minor_locator(MultipleLocator(float(minor)))
    grid = config.get("grid", options.get("grid", True))
    if grid:
        ax.grid(True, color=theme.get("colors", {}).get("grid", "#e3e6e8"), linewidth=theme.get("gridWidth", 0.6))
    else:
        ax.grid(False)
    ax.set_axisbelow(True)


def style_axes(ax, theme):
    text = theme.get("colors", {}).get("text", "#24292d")
    ax.tick_params(colors=text, labelsize=theme.get("fontSize", 12))
    for spine in ax.spines.values():
        spine.set_color(theme.get("colors", {}).get("grid", "#e3e6e8"))
    ax.title.set_color(text)
    ax.xaxis.label.set_color(text)
    ax.yaxis.label.set_color(text)


def legend(ax, config, theme):
    where = config.get("legend", "auto")
    if where in (False, "none"):
        return
    position = {"bottom": "lower center", "top": "upper center", "right": "center left"}.get(where, "best")
    kwargs = {"frameon": False, "fontsize": theme.get("fontSize", 12)}
    if where == "bottom":
        kwargs["bbox_to_anchor"] = (0.5, -0.22)
        kwargs["ncol"] = min(4, max(1, len(ax.get_legend_handles_labels()[0])))
    elif where == "top":
        kwargs["bbox_to_anchor"] = (0.5, 1.12)
        kwargs["ncol"] = min(4, max(1, len(ax.get_legend_handles_labels()[0])))
    elif where == "right":
        kwargs["bbox_to_anchor"] = (1.02, 0.5)
    ax.legend(loc=position, **kwargs)


def annotate(ax, config, theme):
    for item in config.get("annotations") or []:
        if not isinstance(item, dict):
            continue
        kind = item.get("type")
        color_value = item.get("color", theme.get("colors", {}).get("sub", "#494e52"))
        if kind == "hline":
            ax.axhline(float(item.get("y", 0)), color=color_value, linestyle=item.get("dash", "--"), linewidth=item.get("width", 1))
            if item.get("label"):
                ax.text(1, float(item.get("y", 0)), f" {item['label']}", color=color_value, va="bottom", ha="right", fontsize=theme.get("fontSize", 12) - 1)
        elif kind == "vline":
            ax.axvline(float(item.get("x", 0)), color=color_value, linestyle=item.get("dash", "--"), linewidth=item.get("width", 1))
        elif kind == "text":
            ax.text(float(item.get("x", 0)), float(item.get("y", 0)), str(item.get("text", "")), color=color_value, fontsize=item.get("size", theme.get("fontSize", 12)))


def finish(fig, ax, config, theme):
    title = config.get("title")
    if title:
        ax.set_title(str(title), fontsize=theme.get("titleSize", 15), pad=12, loc="left")
    apply_axes(ax, config, theme, "x")
    apply_axes(ax, config, theme, "y")
    style_axes(ax, theme)
    annotate(ax, config, theme)
    legend(ax, config, theme)
    layout = config.get("layout") or {}
    if isinstance(layout, dict):
        if layout.get("margin"):
            fig.subplots_adjust(**layout["margin"])
        else:
            fig.tight_layout()
    else:
        fig.tight_layout()


def render_bar(rows, preset, config, theme):
    x_name = config.get("x") or preset.get("x", "category")
    y_name = config.get("y") or preset.get("y", "value")
    labels = [str(row[x_name]) for row in rows]
    values = [row[y_name] or 0 for row in rows]
    horizontal = bool((config.get("options") or {}).get("horizontal"))
    fig, ax = plt.subplots(figsize=figure_size(config, theme))
    style = series_style(config, y_name, 0, theme)
    if horizontal:
        bars = ax.barh(labels, values, color=style["color"], alpha=style["alpha"])
        ax.invert_yaxis()
    else:
        bars = ax.bar(labels, values, color=style["color"], alpha=style["alpha"])
    if (config.get("options") or {}).get("valueLabels", True):
        ax.bar_label(bars, padding=3, fontsize=theme.get("fontSize", 12) - 1)
    return fig, ax


def render_line(rows, preset, config, theme):
    x_name = config.get("x") or preset.get("x", "period")
    columns = config.get("series") or preset.get("series") or [config.get("y") or preset.get("y", "value")]
    if isinstance(columns, dict):
        columns = list(columns.keys())
    labels = [str(row[x_name]) for row in rows]
    fig, ax = plt.subplots(figsize=figure_size(config, theme))
    for index, name in enumerate(columns):
        style = series_style(config, name, index, theme)
        kwargs = {
            "color": style["color"],
            "linewidth": style["width"],
            "alpha": style["alpha"],
            "marker": style["marker"] or ("o" if index == 0 else None),
            "markersize": 4,
            "label": preset.get("labels", {}).get(name, name),
        }
        if style["dash"] or name in preset.get("dash", []):
            kwargs["linestyle"] = style["dash"] or "--"
        ax.plot(labels, [row.get(name) or 0 for row in rows], **kwargs)
    return fig, ax


def pivot(rows, x_name, group_name, y_name):
    labels = list(OrderedDict.fromkeys(str(row[x_name]) for row in rows))
    groups = list(OrderedDict.fromkeys(str(row[group_name]) for row in rows))
    values = {group: [0.0] * len(labels) for group in groups}
    index = {label: i for i, label in enumerate(labels)}
    for row in rows:
        values[str(row[group_name])][index[str(row[x_name])]] = row[y_name] or 0
    return labels, groups, values


def render_grouped_bar(rows, preset, config, theme):
    x_name = config.get("x") or preset.get("x", "period")
    group_name = config.get("group") or preset.get("group", "series")
    y_name = config.get("y") or preset.get("y", "value")
    labels, groups, values = pivot(rows, x_name, group_name, y_name)
    fig, ax = plt.subplots(figsize=figure_size(config, theme))
    width = 0.8 / max(1, len(groups))
    positions = range(len(labels))
    for index, group in enumerate(groups):
        style = series_style(config, group, index, theme)
        ax.bar([p + (index - (len(groups) - 1) / 2) * width for p in positions], values[group], width=width, color=style["color"], label=group, alpha=style["alpha"])
    ax.set_xticks(list(positions))
    ax.set_xticklabels(labels)
    return fig, ax


def render_stacked_bar(rows, preset, config, theme):
    x_name = config.get("x") or preset.get("x", "period")
    group_name = config.get("group") or preset.get("group", "series")
    y_name = config.get("y") or preset.get("y", "value")
    labels, groups, values = pivot(rows, x_name, group_name, y_name)
    fig, ax = plt.subplots(figsize=figure_size(config, theme))
    bottoms = [0.0] * len(labels)
    for index, group in enumerate(groups):
        style = series_style(config, group, index, theme)
        ax.bar(labels, values[group], bottom=bottoms, color=style["color"], label=group, alpha=style["alpha"])
        bottoms = [a + b for a, b in zip(bottoms, values[group])]
    return fig, ax


def render_donut(rows, preset, config, theme):
    x_name = config.get("x") or preset.get("x", "category")
    y_name = config.get("y") or preset.get("y", "value")
    labels = [str(row[x_name]) for row in rows]
    values = [row[y_name] or 0 for row in rows]
    fig, ax = plt.subplots(figsize=figure_size(config, theme))
    colors = [color(theme, index) for index in range(len(values))]
    wedges, texts, autotexts = ax.pie(values, labels=labels, colors=colors, autopct="%1.0f%%", startangle=90, wedgeprops={"width": 0.38}, textprops={"fontsize": theme.get("fontSize", 12)})
    for text in autotexts:
        text.set_color(theme.get("colors", {}).get("background", "#ffffff"))
    ax.set_aspect("equal")
    return fig, ax


CHARTS = {
    "bar": render_bar,
    "line": render_line,
    "grouped-bar": render_grouped_bar,
    "stacked-bar": render_stacked_bar,
    "donut": render_donut,
}


def render(job, presets, schemas, theme):
    matplotlib.rcParams["font.family"] = "sans-serif"
    matplotlib.rcParams["font.sans-serif"] = list(theme.get("fontFamily", [])) + ["DejaVu Sans"]
    matplotlib.rcParams["axes.unicode_minus"] = False
    preset = presets[job["preset"]]
    config = dict(preset)
    config.update(job.get("config") or {})
    schema = schemas[preset["schema"]]
    rows = read_rows(job["csvPath"], schema)
    if config.get("sort") in ("asc", "desc"):
        key = config.get("x") or preset.get("x")
        rows.sort(key=lambda row: row.get(key), reverse=config["sort"] == "desc")
    chart = config.get("chart") or preset.get("chart", "bar")
    if chart not in CHARTS:
        raise ValueError(f"未対応のグラフ種類です: {chart}")
    fig, ax = CHARTS[chart](rows, preset, config, theme)
    custom = config.get("custom")
    if custom and os.path.exists(custom):
        context = runpy.run_path(custom, init_globals={"fig": fig, "ax": ax, "rows": rows, "config": config, "theme": theme})
        if "render" in context:
            context["render"](fig, ax, rows, config, theme)
    finish(fig, ax, config, theme)
    os.makedirs(os.path.dirname(job["output"]), exist_ok=True)
    fig.savefig(job["output"], format="svg", bbox_inches="tight", pad_inches=0.08, facecolor=theme.get("colors", {}).get("background", "#ffffff"))
    plt.close(fig)


def main():
    payload = json.load(sys.stdin)
    presets = load_json(payload["presets"])
    schemas = load_json(payload["schemas"])
    themes = {os.path.splitext(name)[0]: load_json(os.path.join(payload["themes"], name)) for name in os.listdir(payload["themes"]) if name.endswith(".json")}
    for job in payload["jobs"]:
        theme = themes.get(job.get("config", {}).get("theme", "company"), themes.get("company"))
        try:
            render(job, presets, schemas, theme)
        except Exception as error:
            print(f"{job.get('id')}: {error}", file=sys.stderr)
            raise


if __name__ == "__main__":
    main()
