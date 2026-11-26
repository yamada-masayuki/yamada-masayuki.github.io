#!/usr/bin/env python3
"""Export a local editing workbook or publish its contents as per-spot files."""

import argparse
from collections import defaultdict
from html import escape
import json
from pathlib import Path
import re
from tempfile import NamedTemporaryFile

from openpyxl import Workbook, load_workbook
from openpyxl.utils.exceptions import InvalidFileException


QUIZ = Path(__file__).resolve().parents[1] / "quiz"
CONFIG = QUIZ / "js/config.js"
CONFIG_START = "// 共通の地点情報。各クイズの内容は data/ 以下に配置する。\nwindow.QUIZ_CONFIG = Object.freeze("
QUIZ_COLUMNS = (
    ("id", "地点ID"),
    ("spot", "クイズ設置場所"),
    ("question", "クイズの問題"),
    ("answer", "正解"),
    ("explanation", "解説・豆知識"),
    ("token", "対応するキーワード"),
    ("keywordNumber", "番号"),
    ("title", "ページタイトル"),
    ("icon", "イラスト"),
)
PHOTO_COLUMNS = (
    ("id", "地点ID"),
    ("file", "写真ファイル名"),
    ("alt", "代替テキスト"),
    ("caption", "写真の説明"),
    ("credit", "写真の出典"),
)


def answer_files(spots):
    ids = {spot["id"] for spot in spots}
    files = {}
    for page in sorted((QUIZ / "qr").glob("answer_*.html")):
        match = re.fullmatch(r"answer_([1-9]\d*)_[A-Za-z0-9]{4}\.html", page.name)
        if not match:
            raise ValueError(f"回答ページのファイル名を確認してください: {page.name}")
        sid = int(match[1])
        if sid not in ids or sid in files:
            raise ValueError(f"未登録または重複した地点ID: {page.name}")
        files[sid] = page
    if files.keys() != ids:
        raise ValueError(f"回答ページが見つからない地点ID: {sorted(ids - files.keys())}")
    return files


def data_path(page):
    return QUIZ / "data" / page.with_suffix(".json").name


def write_sheet(workbook, name, columns, rows):
    sheet = workbook.create_sheet(name)
    sheet.append([label for _, label in columns])
    for row in rows:
        sheet.append([row[key] for key, _ in columns])
        for cell in sheet[sheet.max_row]:
            if isinstance(cell.value, str):
                cell.data_type = "s"
    sheet.freeze_panes = "B2"
    sheet.auto_filter.ref = sheet.dimensions


def export_workbook(path, spots, files):
    if path.exists():
        raise ValueError(f"出力先にはすでにファイルがあります: {path}")
    workbook = Workbook()
    workbook.remove(workbook.active)
    questions = []
    photos = []
    for spot in spots:
        data = json.loads(data_path(files[spot["id"]]).read_text(encoding="utf-8"))
        questions.append({**data, **spot})
        photos.extend({"id": spot["id"], **photo} for photo in data["photos"])
    write_sheet(workbook, "フォームの回答 1", QUIZ_COLUMNS, questions)
    write_sheet(workbook, "写真", PHOTO_COLUMNS, photos)
    # 'xb' also protects the original if an editor creates it after the initial check.
    with path.open("xb") as output:
        workbook.save(output)


def read_rows(workbook, name, columns):
    if name not in workbook:
        raise ValueError(f"シート「{name}」がありません")
    rows = workbook[name].iter_rows()
    headers = [cell.value for cell in next(rows, ())]
    indexes = {}
    for key, label in columns:
        if headers.count(label) != 1:
            raise ValueError(f"シート「{name}」に「{label}」列が1つ必要です")
        indexes[key] = headers.index(label)

    for line, cells in enumerate(rows, start=2):
        if all(cell.value in (None, "") for cell in cells):
            continue
        selected = {key: cells[index] for key, index in indexes.items()}
        if any(cell.data_type == "f" for cell in selected.values()):
            raise ValueError(f"シート「{name}」の{line}行目には値を入力してください")
        yield line, {key: cell.value for key, cell in selected.items()}


def edit_answer_page(path, spot, data, site_title):
    page = path.read_text(encoding="utf-8")
    substitutions = (
        (r"(<title>)[^<]*(</title>)", escape(f"{data['title']} | {site_title}")),
        (r'(<h1 id="answer-title">)[^<]*(</h1>)', escape(spot["spot"])),
        (r'(<div class="answer-breadcrumb">.*?<span>)[^<]*(</span></div>)', escape(spot["spot"])),
        (r'(<img id="answer-illustration" src=")[^"]*(")', f"../assets/images/{data['icon']}.svg"),
    )
    for pattern, value in substitutions:
        page, count = re.subn(pattern, lambda match: match[1] + value + match[2], page)
        if count != 1:
            raise ValueError(f"{path.name} のページ情報を更新できません")
    return page


def generate(path, config, files):
    workbook = load_workbook(path, read_only=True)
    registry = {spot["id"]: spot for spot in config["items"]}
    try:
        data_by_id = {}
        numbers = set()
        names = set()
        for line, row in read_rows(workbook, "フォームの回答 1", QUIZ_COLUMNS):
            sid = row["id"]
            number = row["keywordNumber"]
            if type(sid) is not int or sid not in registry or sid in data_by_id:
                raise ValueError(f"{line}行目の地点IDが未登録または重複しています")
            if type(number) is not int or not 1 <= number <= len(registry) or number in numbers:
                raise ValueError(f"{line}行目の表示番号が範囲外または重複しています")
            for key, label in QUIZ_COLUMNS:
                if key not in ("id", "keywordNumber") and (
                    not isinstance(row[key], str) or not row[key].strip()
                ):
                    raise ValueError(f"{line}行目の「{label}」に文字を入力してください")
            if len(row["token"]) != 1:
                raise ValueError(f"{line}行目のキーワードは1文字にしてください")
            if row["spot"] in names:
                raise ValueError(f"{line}行目のクイズ設置場所が重複しています")
            if not re.fullmatch(r"[a-z0-9-]+", row["icon"]) or not (
                QUIZ / "assets/images" / (row["icon"] + ".svg")
            ).is_file():
                raise ValueError(f"{line}行目のイラストが見つかりません")
            data_by_id[sid] = row
            numbers.add(number)
            names.add(row["spot"])
        if data_by_id.keys() != registry.keys():
            raise ValueError(f"未入力の地点ID: {sorted(registry.keys() - data_by_id.keys())}")

        photos = defaultdict(list)
        for line, row in read_rows(workbook, "写真", PHOTO_COLUMNS):
            sid = row.pop("id")
            if type(sid) is not int or sid not in registry:
                raise ValueError(f"写真シート{line}行目の地点IDが未登録です")
            for key, label in PHOTO_COLUMNS[1:]:
                if not isinstance(row[key], str) or not row[key].strip():
                    raise ValueError(f"写真シート{line}行目の「{label}」に文字を入力してください")
            name = row["file"]
            if Path(name).name != name or not (QUIZ / "assets/photos" / name).is_file():
                raise ValueError(f"写真シート{line}行目の写真が見つかりません")
            photos[sid].append(row)
    finally:
        workbook.close()

    outputs = {}
    for sid, spot in registry.items():
        row = data_by_id[sid]
        spot["spot"] = row["spot"]
        spot["keywordNumber"] = row["keywordNumber"]
        data = {key: row[key] for key in ("id", "token", "title", "question", "answer", "explanation", "icon")}
        data["photos"] = photos[sid]
        contents = json.dumps(data, ensure_ascii=False, indent=2)
        contents = re.sub(
            r'("token": )[^\n]+',
            lambda match: match[1] + json.dumps(data["token"], ensure_ascii=True) + ",",
            contents,
            count=1,
        )
        page_path = files[sid]
        outputs[data_path(page_path)] = contents + "\n"
        outputs[page_path] = edit_answer_page(page_path, spot, data, config["title"])
    outputs[CONFIG] = CONFIG_START + json.dumps(config, ensure_ascii=False, indent=2) + ");\n"

    # Check all rows and all templates before touching the public files.
    for destination, text in outputs.items():
        if destination.exists() and destination.read_text(encoding="utf-8") == text:
            continue
        with NamedTemporaryFile(mode="w", encoding="utf-8", dir=destination.parent, delete=False) as file:
            temporary = Path(file.name)
            try:
                file.write(text)
                file.close()
                temporary.chmod(destination.stat().st_mode & 0o777 if destination.exists() else 0o644)
                temporary.replace(destination)
            finally:
                temporary.unlink(missing_ok=True)
        print(destination.relative_to(QUIZ.parent))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("export", "build"))
    parser.add_argument("workbook", type=Path)
    args = parser.parse_args()
    try:
        source = CONFIG.read_text(encoding="utf-8")
        if not source.startswith(CONFIG_START) or not source.endswith(");\n"):
            raise ValueError("config.js の形式を確認してください")
        config = json.loads(source[len(CONFIG_START):-3])
        files = answer_files(config["items"])
        if args.action == "export":
            export_workbook(args.workbook, config["items"], files)
        else:
            generate(args.workbook, config, files)
    except (OSError, InvalidFileException, ValueError) as error:
        parser.error(str(error))


if __name__ == "__main__":
    main()
