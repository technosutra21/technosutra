import fitz, pathlib, sys

ROOT = pathlib.Path(r"C:\Users\rouxy\TECHNOSUTRA1\technosutra\chapters")

def pdf_to_markdown(pdf_path: pathlib.Path) -> pathlib.Path:
    doc = fitz.open(pdf_path)
    md_lines = []
    for page in doc:
        md_lines.append(page.get_text("text"))
        md_lines.append("\n---\n")          # page delimiter
    md_text = "\n".join(md_lines).strip()
    md_path = pdf_path.with_suffix(".md")
    md_path.write_text(md_text, encoding="utf-8")
    return md_path

def walk_and_convert(root: pathlib.Path):
    for pdf in root.rglob("*.pdf"):
        try:
            print(f"Converting {pdf} …")
            pdf_to_markdown(pdf)
        except Exception as e:
            print(f"FAILED on {pdf}: {e}", file=sys.stderr)

if __name__ == "__main__":
    walk_and_convert(ROOT)
