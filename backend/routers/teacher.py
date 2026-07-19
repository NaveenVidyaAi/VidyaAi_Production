import asyncio
import json
import logging
import re
from pathlib import Path
from typing import Literal

import requests
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.config import settings
from backend.routers.auth import get_current_student
from backend.services.rag import _retrieval_match_is_strong, _retrieve_context

router = APIRouter()
logger = logging.getLogger(__name__)
PROJECT_ROOT = Path(__file__).resolve().parents[2]
PAPER_PART_PATTERN = re.compile(r"<!--\s*(PAPER|ANSWER_KEY|BLUEPRINT)\s*-->\s*", re.IGNORECASE)
TOP_LEVEL_QUESTION_PATTERN = re.compile(
    r"^\s*(?:#{1,4}\s*)?(?:\*\*)?प्रश्न\s*(\d{1,3})\s*[.)।:-].*?\[\s*(\d{1,3})\s*अंक\s*\]",
    re.IGNORECASE,
)

CLASS_10_CHAPTERS = {
    "Science": [
        ("1", "जीवों का विकास"),
        ("2", "अम्ल, क्षारक एवं लवण"),
        ("3", "ऊष्मा एवं ताप"),
        ("4", "तत्वों का आवर्त वर्गीकरण"),
        ("5", "हमारा पर्यावरण : पारिस्थितिक तंत्र में ऊर्जा का प्रवाह"),
        ("6", "विद्युत धारा एवं परिपथ"),
        ("7", "जैविक प्रक्रियाएँ (I) : पोषण, परिवहन, श्वसन और उत्सर्जन"),
        ("8", "जैविक प्रक्रियाएँ (II) : नियंत्रण एवं समन्वय"),
        ("9", "धातु एवं धातुकर्म"),
        ("10", "प्रकाश : परावर्तन एवं अपवर्तन—समतल सतह से"),
        ("11", "अधातुओं का रसायन"),
        ("12", "विद्युत के चुंबकीय प्रभाव"),
        ("13", "प्रकाश : परावर्तन एवं अपवर्तन—गोलीय सतह से"),
        ("14", "जैविक प्रक्रियाएँ (III) : प्रजनन, वृद्धि और परिवर्धन"),
        ("15", "आनुवंशिकी : जनकों से संतानों तक"),
        ("16", "हाइड्रोकार्बन के व्युत्पन्न"),
        ("17", "दैनिक जीवन में रसायन"),
        ("18", "ऊर्जा : स्वरूप एवं स्रोत"),
    ],
    "Math": [
        ("1", "बहुपद"), ("2", "दो चरों का रैखिक समीकरण"), ("3", "एक चर का द्विघात समीकरण"),
        ("4", "समांतर श्रेणी"), ("5", "अनुपात एवं समानुपात"), ("6", "निर्देशांक ज्यामिति"),
        ("7", "आलेख"), ("8", "बैंकिंग एवं कराधान"), ("9", "त्रिकोणमितीय समीकरण एवं सर्वसमिकाएँ"),
        ("10", "ऊँचाई एवं दूरी"), ("11", "ज्यामितीय आकृतियों में समरूपता"), ("12", "वृत्त एवं स्पर्श रेखाएँ"),
        ("13", "ज्यामितीय रचनाएँ"), ("14", "गणितीय कथनों की जाँच"),
        ("15", "ठोस आकृतियों का पृष्ठीय क्षेत्रफल एवं आयतन"), ("16", "आँकड़ों का विश्लेषण"),
    ],
    "Social Science": [
        ("1.1", "संसाधन और विकास"), ("1.2", "विकास की समझ"), ("1.3", "भूमि संसाधन"), ("2", "प्रथम विश्वयुद्ध"),
        ("3.1", "भारत के संविधान का निर्माण"), ("3.2", "संविधान, शासन व्यवस्था और सामाजिक सरोकार"),
        ("4.1", "कृषि"), ("4.2", "रूसी क्रांति और महामंदी"), ("4.3", "मुद्रा एवं साख"),
        ("5.1", "खनिज संसाधन और औद्योगीकरण"), ("5.2", "नाजीवाद और द्वितीय विश्वयुद्ध"), ("5.3", "सरकारी बजट और कर निर्धारण"),
        ("6.1", "मानव संसाधन"), ("6.2", "स्वतंत्र भारत में लोकतंत्र और राजनीतिक संस्थाएँ"),
        ("7.1", "खाद्य सुरक्षा"), ("7.2", "उपनिवेशों का खात्मा और शीतयुद्ध"),
        ("8.1", "20वीं सदी में संचार माध्यम"), ("8.2", "लोकतंत्र में जनसहभागिता"),
        ("9.1", "लोकतंत्र और सामाजिक आंदोलन"), ("9.2", "मानव अधिवास"), ("9.3", "वैश्वीकरण"),
    ],
    "Sanskrit": [
        ("1", "वार्तालापः"), ("2", "लोष्टभ्रष्टालयोः मित्रता"), ("3", "क्रियाकारककुतूहलम्"), ("4", "बिलासा"),
        ("5", "यक्ष-युधिष्ठिर-संवादः"), ("6", "प्राणभ्योऽपि प्रियः सुहृद्"), ("7", "सुभाषितानि"), ("8", "स्वामी आत्मानन्दः"),
        ("9", "ओदनं सूक्तम्"), ("10", "परिवारः लघुः एव वरम्"), ("11", "विचित्रः साक्षी"), ("12", "हेमन्तवर्णनम्"), ("13", "यात्रा मङ्गलं प्रति"),
        ("G1", "शब्दरूपम्, संज्ञा एवं संख्या"), ("G2", "धातुरूपम् एवं अव्ययम्"),
        ("G3", "सन्धिः एवं समासः"), ("G4", "प्रत्ययः, उपसर्गः एवं वाच्यम्"),
        ("G5", "उपपदविभक्तिः एवं वाक्यशुद्धिकरणम्"), ("R1", "अपठित-अवबोधनम्"),
        ("W1", "पत्रलेखनम् / कथालेखनम्"), ("W2", "निबन्धलेखनम् / चित्राधारित वर्णनम्"),
    ],
}

CLASS_10_HINDI_CHAPTERS = [
    ("1.1", "चन्द्रगहना से लौटती बेर"), ("1.2", "नर्मदा का उद्गम : अमरकंटक"), ("1.3", "बादल को घिरते देखा है"),
    ("2.1", "मैं मजदूर हूँ"), ("2.2", "जनतंत्र का जन्म"), ("2.3", "अपनी-अपनी बीमारी"),
    ("3.1", "माटीवाली"), ("3.2", "कन्यादान"), ("3.3", "घीसा"), ("3.4", "पुरस्कार"),
    ("4.1", "अमर शहीद वीरनारायण सिंह"), ("4.2", "गृह प्रवेश"), ("4.3", "छत्तीसगढ़ की लोककलाएँ"),
    ("5.1", "ये जिनगी फेर चमक जाए"), ("5.2", "मरिया"), ("5.3", "शील के बरसै छंद"),
    ("6.1", "जीवन का झरना"), ("6.2", "एक था पेड़ और एक था ठूँठ"), ("6.3", "साध"),
    ("7.1", "मध्ययुगीन काव्य (मीरा बाई एवं संत दादू दयाल)"), ("7.2", "मैं लेखक कैसे बना"),
    ("7.3", "जेबकतरा"), ("7.4", "गोधूलि"),
]


class CurriculumRequest(BaseModel):
    class_level: str = Field(min_length=1, max_length=5)
    subject: str = Field(min_length=2, max_length=100)
    duration_weeks: int = Field(default=16, ge=1, le=52)
    periods_per_week: int = Field(default=5, ge=1, le=12)
    chapters: str = Field(default="", max_length=3000)
    learning_goals: str = Field(default="", max_length=2000)
    medium: str = Field(default="Hindi", max_length=30)


class TestPaperRequest(BaseModel):
    class_level: str = Field(min_length=1, max_length=5)
    subject: str = Field(min_length=2, max_length=100)
    syllabus: str = Field(default="", max_length=3000)
    selected_chapters: list[str] = Field(default_factory=list, max_length=40)
    total_marks: int = Field(default=50, ge=5, le=200)
    question_count: int = Field(default=20, ge=1, le=100)
    duration_minutes: int = Field(default=90, ge=10, le=360)
    difficulty: Literal["easy", "balanced", "challenging"] = "balanced"
    paper_type: Literal["unit_test", "term_exam", "practice", "worksheet"] = "unit_test"
    medium: str = Field(default="Hindi", max_length=30)
    instructions: str = Field(default="", max_length=1500)
    sections: list[dict] = Field(default_factory=list, max_length=12)


class LessonGuideRequest(BaseModel):
    class_level: str = Field(min_length=1, max_length=5)
    subject: str = Field(min_length=2, max_length=100)
    chapter_or_topic: str = Field(min_length=2, max_length=500)
    lesson_minutes: int = Field(default=45, ge=15, le=180)
    medium: str = Field(default="Hindi", max_length=30)
    student_level: Literal["mixed", "foundation", "advanced"] = "mixed"
    teacher_notes: str = Field(default="", max_length=1500)


async def require_teacher(current_user=Depends(get_current_student)):
    if getattr(current_user, "role", "student") != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")
    return current_user


def _chapter_options(subject: str, class_level: str) -> list[dict[str, str]]:
    if str(class_level) != "10":
        return []
    if subject == "Hindi":
        pairs = CLASS_10_HINDI_CHAPTERS
    elif subject == "English":
        from backend.services.rag import CLASS_10_ENGLISH_UNITS
        pairs = [(item["chapter"], item["title"]) for items in CLASS_10_ENGLISH_UNITS.values() for item in items]
    else:
        pairs = CLASS_10_CHAPTERS.get(subject, [])
    prefix = subject.lower().replace(" ", "-")
    math_units = {
        **{str(number): "इकाई 1" for number in range(1, 6)},
        "6": "इकाई 2", "7": "इकाई 2", "8": "इकाई 3", "9": "इकाई 4", "10": "इकाई 4",
        "11": "इकाई 5", "12": "इकाई 5", "13": "इकाई 5", "14": "इकाई 6", "15": "इकाई 7", "16": "इकाई 8",
    }
    roman_units = ["I", "II", "III", "IV", "V", "VI"]
    options: list[dict[str, str]] = []
    for code, title in pairs:
        normalized_code = code.lower().replace(".", "-")
        if subject == "Science":
            group = f"इकाई {roman_units[(int(code) - 1) // 3]}"
        elif subject == "Math":
            group = math_units[code]
        elif subject in {"Hindi", "Social Science"}:
            group = f"इकाई {code.split('.')[0]}"
        elif subject == "English":
            group = f"Unit {code.split('-')[0]}"
        elif subject == "Sanskrit" and code.isdigit():
            group = "पाठ"
        elif subject == "Sanskrit" and code.startswith("G"):
            group = "व्याकरण"
        elif subject == "Sanskrit" and code.startswith("R"):
            group = "अपठित बोध"
        elif subject == "Sanskrit":
            group = "लेखन"
        else:
            group = "पाठ्यक्रम"
        option = {
            "id": f"{prefix}-{normalized_code}",
            "code": code,
            "label": title,
            "group": group,
            "retrieval_query": f"Class 10 {subject} {title}",
        }
        if subject in {"Science", "Math"}:
            option["chapter_hint"] = code
            option["retrieval_query"] = f"Class 10 {subject} chapter {code} {title}"
        elif subject == "Hindi":
            option["chapter_hint"] = code.split(".")[0]
            option["section_hint"] = code.replace(".", "-")
            option["retrieval_query"] = f"Class 10 Hindi पाठ {code} {title}"
        elif subject == "English":
            option["section_hint"] = code
        options.append(option)
    return options


@router.get("/chapter-options")
async def chapter_options(subject: str, class_level: str = "10", teacher=Depends(require_teacher)):
    chapters = [
        {key: option[key] for key in ("id", "code", "label", "group")}
        for option in _chapter_options(subject, class_level)
    ]
    return {"subject": subject, "class_level": class_level, "chapters": chapters}


def _chapter_hint(value: str) -> str | None:
    # A bare number is usually the class or marks (for example "Class 10"),
    # not a chapter. Only accept a number following an explicit chapter marker.
    # Retrieval currently indexes the unit-level chapter as the leading number,
    # so a selected curriculum item such as 1.2 deliberately maps to chapter 1.
    match = re.search(r"(?:chapter|अध्याय|पाठ)\s*(\d{1,2})(?:[.\-]\d+)?", value or "", flags=re.IGNORECASE)
    return match.group(1) if match else None


def _grounding_context(
    *,
    class_level: str,
    subject: str,
    query: str,
    document_type_boosts: dict[str, float],
    result_limit: int = 8,
    chapter_hint: str | None = None,
    section_hint: str | None = None,
    infer_chapter_hint: bool = True,
) -> tuple[str, list[str]]:
    try:
        rows = _retrieve_context(
            question=query,
            subject=subject,
            class_level=class_level,
            weak_topics=[],
            chapter_hint=chapter_hint if chapter_hint is not None else (_chapter_hint(query) if infer_chapter_hint else None),
            section_hint=section_hint,
            limit=24,
            document_type_boosts=document_type_boosts,
            strict_subject=True,
        )
    except Exception:
        logger.exception("Teacher resource retrieval failed")
        return "", []
    # Preserve evidence diversity: a paper request should see both the official
    # model pattern and curriculum scope instead of eight adjacent chunks from
    # whichever single PDF scored highest.
    selected_rows = []
    selected_ids = set()
    for document_type, boost in sorted(document_type_boosts.items(), key=lambda item: item[1], reverse=True):
        if boost <= 0:
            continue
        label_token = document_type.replace("_", " ").lower()
        match = next(
            (row for row in rows if row[1] not in selected_ids and label_token in (row[3] or "").lower()),
            None,
        )
        if match:
            selected_rows.append(match)
            selected_ids.add(match[1])
    for row in rows:
        if row[1] in selected_ids:
            continue
        selected_rows.append(row)
        selected_ids.add(row[1])
        if len(selected_rows) >= result_limit:
            break
    rows = selected_rows[:result_limit]

    if not _retrieval_match_is_strong(rows, subject):
        return "", []
    blocks = [f"[Source: {row[3]}]\n{row[0]}" for row in rows]
    sources = list(dict.fromkeys(row[3] for row in rows))
    return "\n\n".join(blocks), sources


def _fallback_content(title: str, sections: list[str]) -> str:
    body = [f"# {title}", "", "> AI generation is temporarily unavailable. Use this structured draft and verify it against the textbook."]
    for section in sections:
        body.extend(["", f"## {section}", "", "- Add textbook-aligned details here.", "- Confirm learning outcomes and examples before classroom use."])
    return "\n".join(body)


def _local_teacher_context(
    class_level: str,
    subject: str,
    max_chars: int = 16000,
    scope_terms: list[str] | None = None,
) -> tuple[str, list[str]]:
    """Read active model-paper/curriculum PDFs when Qdrant is unavailable or incomplete."""
    catalog_path = PROJECT_ROOT / "ingestion" / "document_catalog.json"
    try:
        import pdfplumber

        documents = json.loads(catalog_path.read_text(encoding="utf-8")).get("documents", [])
    except Exception:
        logger.exception("Could not load the local teacher document catalog")
        return "", []

    # Textbooks are retrieved from the vector index. Reading every page of a
    # 300-page textbook during a request is too expensive for this fallback;
    # local PDFs here supply the board pattern and curriculum scope.
    wanted = {"model_question_paper": 0, "curriculum": 1, "previous_year_question": 2}
    matches = sorted(
        (
            item for item in documents
            if item.get("status") == "active"
            and item.get("ingestion_enabled", True)
            and str(item.get("class", "")).lower() == str(class_level).lower()
            and str(item.get("subject", "")).lower() == subject.lower()
            and item.get("document_type") in wanted
        ),
        key=lambda item: wanted[item["document_type"]],
    )
    blocks: list[str] = []
    sources: list[str] = []
    remaining = max_chars
    for item in matches:
        if remaining < 800:
            break
        pdf_path = PROJECT_ROOT / item["path"]
        try:
            with pdfplumber.open(pdf_path) as pdf:
                text = "\n".join((page.extract_text() or "") for page in pdf.pages)
        except Exception:
            logger.exception("Could not read local teacher source %s", pdf_path)
            continue
        # Several official Hindi PDFs contain embedded NUL glyph separators.
        # Removing them makes canonical curriculum titles searchable.
        text = re.sub(r"\n{3,}", "\n\n", text.replace("\x00", "")).strip()
        if not text:
            continue
        per_type_limit = {
            "model_question_paper": 5500,
            "curriculum": 4000,
            "textbook": 6000,
            "previous_year_question": 2500,
        }[item["document_type"]]
        excerpt_limit = min(remaining, per_type_limit)
        excerpt = ""
        if scope_terms and item["document_type"] in {"curriculum", "textbook", "previous_year_question"}:
            windows: list[str] = []
            seen_positions: set[int] = set()
            searchable = text.casefold()
            for term in scope_terms:
                canonical_term = term.casefold().strip()
                search_candidates = [canonical_term, *sorted(
                    (token for token in re.findall(r"[\w\u0900-\u097f]+", canonical_term) if len(token) >= 5),
                    key=len,
                    reverse=True,
                )]
                position = next(
                    (found for candidate in search_candidates if (found := searchable.find(candidate)) >= 0),
                    -1,
                )
                if position < 0 or any(abs(position - seen) < 500 for seen in seen_positions):
                    continue
                seen_positions.add(position)
                windows.append(text[max(0, position - 500):position + 1800].strip())
                if sum(len(window) for window in windows) >= excerpt_limit:
                    break
            excerpt = "\n\n[…selected chapter…]\n\n".join(windows)[:excerpt_limit]
        if not excerpt:
            excerpt = text[:excerpt_limit]
        label = item.get("source_file") or pdf_path.name
        blocks.append(f"[Local {item['document_type']}: {label}]\n{excerpt}")
        sources.append(label)
        remaining -= len(excerpt)
    return "\n\n".join(blocks), sources


def _split_paper_content(content: str) -> dict[str, str]:
    """Split the generated resource into independently printable teacher/student parts."""
    matches = list(PAPER_PART_PATTERN.finditer(content or ""))
    if not matches:
        return {"paper_content": content.strip(), "answer_key": "", "blueprint": ""}
    parts = {"paper_content": "", "answer_key": "", "blueprint": ""}
    names = {"PAPER": "paper_content", "ANSWER_KEY": "answer_key", "BLUEPRINT": "blueprint"}
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(content)
        parts[names[match.group(1).upper()]] = content[match.end():end].strip()
    return parts


def _paper_validation_errors(content: str, payload: TestPaperRequest) -> list[str]:
    """Reject incomplete, repetitive, bilingual, or numerically invalid papers."""
    errors: list[str] = []
    markers = [match.group(1).upper() for match in PAPER_PART_PATTERN.finditer(content or "")]
    if markers != ["BLUEPRINT", "PAPER", "ANSWER_KEY"]:
        errors.append("The three required delimiter comments are missing, duplicated, or out of order.")
        return errors

    parts = _split_paper_content(content)
    minimum_paper_length = min(1000, 200 + (payload.question_count * 30))
    if len(parts["paper_content"]) < minimum_paper_length:
        errors.append("The student paper is incomplete.")
    if len(parts["answer_key"]) < 150:
        errors.append("The answer key is incomplete.")
    if len(parts["blueprint"]) < 100:
        errors.append("The blueprint is incomplete.")

    question_rows: list[tuple[int, int]] = []
    comparable_lines: list[str] = []
    for raw_line in parts["paper_content"].splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip(" |*#\t")
        match = TOP_LEVEL_QUESTION_PATTERN.match(raw_line)
        if match:
            question_rows.append((int(match.group(1)), int(match.group(2))))
        if len(line) >= 25 and not re.fullmatch(r"[-:| ]+", line):
            normalized = re.sub(r"^(?:प्रश्न\s*)?\d+[.)।:-]\s*", "", line, flags=re.IGNORECASE)
            normalized = re.sub(r"\[\s*\d+\s*अंक\s*\]\s*$", "", normalized).strip().casefold()
            comparable_lines.append(normalized)

    expected_numbers = list(range(1, payload.question_count + 1))
    actual_numbers = [number for number, _ in question_rows]
    if actual_numbers != expected_numbers:
        errors.append(
            f"Top-level questions must be numbered exactly 1 to {payload.question_count}; found {actual_numbers or 'none'}."
        )
    marks_total = sum(marks for _, marks in question_rows)
    if marks_total != payload.total_marks:
        errors.append(f"Question marks total {marks_total}, not {payload.total_marks}.")

    duplicate_count = len(comparable_lines) - len(set(comparable_lines))
    if duplicate_count:
        errors.append(f"The student paper contains {duplicate_count} repeated question/content lines.")

    if payload.medium.strip().lower() == "hindi":
        translations = re.findall(r"\([^)]*[A-Za-z]{3,}[^)]*\)", parts["paper_content"])
        if len(translations) > 2:
            errors.append("The Hindi paper contains repeated English translations or bilingual labels.")
        devanagari_count = len(re.findall(r"[\u0900-\u097f]", parts["paper_content"]))
        latin_count = len(re.findall(r"[A-Za-z]", parts["paper_content"]))
        if devanagari_count < max(100, latin_count * 3):
            errors.append("The student paper is not predominantly written in natural Hindi.")
    return errors


def _structured_paper_token_budget(question_count: int) -> int:
    """Size full-paper output without exceeding the provider's practical limit."""
    return min(5000, max(3000, 1500 + (question_count * 160)))


def _compact_paper_context(context: str, max_chars: int = 12000) -> str:
    """Keep a balanced excerpt from every top-level evidence scope."""
    cleaned = re.sub(r"\n{3,}", "\n\n", (context or "").replace("\x00", "")).strip()
    if len(cleaned) <= max_chars:
        return cleaned
    if max_chars < 200:
        return cleaned[:max_chars]

    blocks = [
        block.strip()
        for block in re.split(r"\n{2,}(?=\[(?:Evidence scope:|Local ))", cleaned)
        if block.strip()
    ]
    if len(blocks) < 2:
        marker = "\n\n[…evidence shortened…]\n\n"
        available = max_chars - len(marker)
        head_size = max(1, (available * 2) // 3)
        return f"{cleaned[:head_size].rstrip()}{marker}{cleaned[-(available - head_size):].lstrip()}"[:max_chars]

    separator = "\n\n"
    available = max_chars - (len(separator) * (len(blocks) - 1))
    allocations = [0] * len(blocks)
    pending = set(range(len(blocks)))
    remaining = max(0, available)
    while pending and remaining:
        share = max(1, remaining // len(pending))
        completed: list[int] = []
        for index in pending:
            needed = len(blocks[index]) - allocations[index]
            take = min(needed, share)
            allocations[index] += take
            remaining -= take
            if allocations[index] >= len(blocks[index]):
                completed.append(index)
            if remaining <= 0:
                break
        pending.difference_update(completed)

    snippets: list[str] = []
    marker = "\n[…shortened…]\n"
    for block, size in zip(blocks, allocations):
        if size >= len(block):
            snippets.append(block)
        elif size <= len(marker) + 20:
            snippets.append(block[:size].rstrip())
        else:
            content_size = size - len(marker)
            head_size = max(1, (content_size * 3) // 4)
            snippets.append(
                f"{block[:head_size].rstrip()}{marker}{block[-(content_size - head_size):].lstrip()}"
            )
    return separator.join(snippets)[:max_chars]


def _request_paper_completion(
    prompt: str,
    *,
    json_mode: bool = False,
    max_tokens: int = 7000,
    model: str | None = None,
) -> str:
    system_content = (
        "You are an expert CGBSE assessment designer and Hindi editor. "
        "Never repeat a question. Obey every numerical and syllabus constraint exactly. "
        "Return exactly one valid JSON object and no Markdown, code fence, or commentary."
        if json_mode
        else (
            "You are an expert CGBSE assessment designer and Hindi editor. "
            "Never repeat a question. Obey the required line format and numerical constraints exactly. "
            "Return polished Markdown only."
        )
    )
    request_payload = {
        "model": model or settings.groq_paper_model or settings.groq_model,
        "messages": [
            {
                "role": "system",
                "content": system_content,
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.15,
        "max_tokens": max_tokens,
    }
    if json_mode:
        request_payload["response_format"] = {"type": "json_object"}
    if request_payload["model"].startswith("openai/gpt-oss-"):
        request_payload["reasoning_effort"] = "low"
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
        json=request_payload,
        timeout=120,
    )
    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        try:
            provider_detail = str(response.json().get("error", {}).get("message", "")).strip()
        except (AttributeError, TypeError, ValueError):
            provider_detail = ""
        detail = re.sub(r"\s+", " ", provider_detail)[:500] or "no provider detail"
        detail = re.sub(r"organization `[^`]+`", "organization [redacted]", detail, flags=re.IGNORECASE)
        raise requests.HTTPError(
            f"Groq returned HTTP {response.status_code}: {detail}",
            response=response,
            request=getattr(exc, "request", None),
        ) from exc
    choice = response.json().get("choices", [{}])[0]
    content = choice.get("message", {}).get("content", "").strip()
    if choice.get("finish_reason") == "length":
        raise ValueError(f"paper response exceeded the {max_tokens}-token output budget")
    if not content:
        raise ValueError("paper response was empty")
    return content


def _paper_request_errors(payload: TestPaperRequest) -> list[str]:
    """Reject contradictory teacher controls before spending a generation call."""
    if not payload.sections:
        if payload.total_marks < payload.question_count or payload.total_marks > payload.question_count * 20:
            return [
                "बिना खंड-विन्यास के कुल अंक प्रश्न संख्या के 1 से 20 गुना के बीच होने चाहिए।"
            ]
        return []
    errors: list[str] = []
    calculated_marks = 0
    calculated_questions = 0
    section_names: list[str] = []
    custom_question_texts: list[str] = []
    allowed_types = {"mcq", "very_short", "short", "long"}
    for index, section in enumerate(payload.sections, 1):
        if not isinstance(section, dict):
            errors.append(f"खंड {index} का विन्यास मान्य नहीं है।")
            continue
        name = str(section.get("name", "")).strip()
        if not name:
            errors.append(f"खंड {index} का नाम खाली है।")
        section_names.append(name.casefold())
        if not str(section.get("label_hi", "")).strip():
            errors.append(f"खंड {name or index} का हिंदी नाम खाली है।")
        if section.get("type") not in allowed_types:
            errors.append(f"खंड {name or index} का प्रश्न प्रकार मान्य नहीं है।")
        try:
            count = int(section.get("count", 0))
            marks_each = int(section.get("marks_each", 0))
        except (TypeError, ValueError):
            errors.append(f"खंड {name or index} में प्रश्न संख्या या अंक मान्य नहीं हैं।")
            continue
        if count < 1 or count > 30 or marks_each < 1 or marks_each > 20:
            errors.append(f"खंड {name or index} की प्रश्न संख्या/अंक सीमा सही करें।")
            continue
        calculated_questions += count
        calculated_marks += count * marks_each
        custom_questions = section.get("custom_questions") or []
        if not isinstance(custom_questions, list):
            errors.append(f"खंड {name or index} के शिक्षक प्रश्न मान्य सूची नहीं हैं।")
            continue
        if len(custom_questions) > count:
            errors.append(f"खंड {name or index} में शिक्षक प्रश्न कुल प्रश्नों से अधिक हैं।")
        for question_index, question in enumerate(custom_questions, 1):
            if not isinstance(question, dict) or not str(question.get("text_hi", "")).strip():
                errors.append(f"खंड {name or index} का शिक्षक प्रश्न {question_index} खाली है।")
                continue
            custom_question_texts.append(re.sub(r"\s+", " ", str(question["text_hi"]).strip()).casefold())
            if section.get("type") == "mcq":
                options = question.get("options_hi") or []
                normalized_options = [str(option).strip().casefold() for option in options]
                if len(options) != 4 or any(not option for option in normalized_options):
                    errors.append(f"खंड {name or index} के MCQ {question_index} में चार विकल्प आवश्यक हैं।")
                elif len(set(normalized_options)) != 4:
                    errors.append(f"खंड {name or index} के MCQ {question_index} के विकल्प अलग-अलग होने चाहिए।")
    if len(section_names) != len(set(section_names)):
        errors.append("हर खंड का नाम अलग होना चाहिए।")
    if len(custom_question_texts) != len(set(custom_question_texts)):
        errors.append("शिक्षक द्वारा जोड़े गए प्रश्न दोहराए नहीं जा सकते।")
    if calculated_questions != payload.question_count:
        errors.append(f"खंडों में {calculated_questions} प्रश्न हैं, कुल प्रश्न {payload.question_count} नहीं।")
    if calculated_marks != payload.total_marks:
        errors.append(f"खंडों के अंक {calculated_marks} हैं, कुल अंक {payload.total_marks} नहीं।")
    return errors


def _default_paper_rules(payload: TestPaperRequest) -> list[dict]:
    """Distribute non-divisible marks exactly when API clients omit an explicit blueprint."""
    base_marks, higher_mark_questions = divmod(payload.total_marks, payload.question_count)
    groups: list[tuple[int, int]] = []
    lower_mark_questions = payload.question_count - higher_mark_questions
    if lower_mark_questions:
        groups.append((lower_mark_questions, base_marks))
    if higher_mark_questions:
        groups.append((higher_mark_questions, base_marks + 1))

    rules: list[dict] = []
    for total_count, marks_each in groups:
        remaining = total_count
        while remaining:
            count = min(30, remaining)
            name = chr(ord("A") + len(rules))
            rules.append({
                "name": name,
                "type": "short",
                "label_hi": "लघु उत्तरीय प्रश्न",
                "count": count,
                "marks_each": marks_each,
                "word_limit": "30",
                "custom_questions": [],
            })
            remaining -= count
    return rules


def _validate_paper_data(data: dict, payload: TestPaperRequest) -> list[str]:
    errors: list[str] = []
    if not isinstance(data, dict):
        return ["response must be a JSON object"]
    sections = data.get("sections")
    if not isinstance(sections, list) or not sections:
        return ["sections must be a non-empty array"]
    valid_sections = [section for section in sections if isinstance(section, dict)]
    if len(valid_sections) != len(sections):
        errors.append("every section must be an object")
    questions: list[dict] = []
    for section in valid_sections:
        section_questions = section.get("questions")
        if not isinstance(section_questions, list):
            errors.append(f"section {section.get('name', '?')} questions must be an array")
            continue
        valid_questions = [question for question in section_questions if isinstance(question, dict)]
        if len(valid_questions) != len(section_questions):
            errors.append(f"section {section.get('name', '?')} contains an invalid question")
        questions.extend(valid_questions)
    if payload.sections:
        if len(sections) != len(payload.sections):
            errors.append("generated section count does not match the blueprint")
        for index, rule in enumerate(payload.sections):
            if index >= len(sections):
                break
            section = sections[index]
            if not isinstance(section, dict):
                continue
            if str(section.get("name")) != str(rule.get("name")):
                errors.append(f"section {index + 1} name changed")
            if section.get("type") != rule.get("type"):
                errors.append(f"section {rule.get('name')} type changed")
            if str(section.get("label_hi", "")).strip() != str(rule.get("label_hi", "")).strip():
                errors.append(f"section {rule.get('name')} label changed")
            try:
                generated_marks = int(section.get("marks_each", 0))
            except (TypeError, ValueError):
                generated_marks = 0
            if generated_marks != int(rule.get("marks_each", 0)):
                errors.append(f"section {rule.get('name')} marks changed")
            if str(section.get("word_limit", "")).strip() != str(rule.get("word_limit", "")).strip():
                errors.append(f"section {rule.get('name')} word limit changed")
            generated_questions = section.get("questions", [])
            if not isinstance(generated_questions, list):
                generated_questions = []
            if len(generated_questions) != int(rule.get("count", 0)):
                errors.append(f"section {rule.get('name')} question count changed")
            for custom in rule.get("custom_questions") or []:
                custom_text = re.sub(r"\s+", " ", str(custom.get("text_hi", "")).strip())
                match = next(
                    (question for question in generated_questions if re.sub(r"\s+", " ", str(question.get("text_hi", "")).strip()) == custom_text),
                    None,
                )
                if not match:
                    errors.append(f"teacher question was changed or removed: {custom_text[:60]}")
                    continue
                if custom.get("options_hi") and match.get("options_hi") != custom.get("options_hi"):
                    errors.append(f"teacher options were changed for: {custom_text[:60]}")
                if custom.get("answer_hi") and str(match.get("answer_hi", "")).strip() != str(custom.get("answer_hi", "")).strip():
                    errors.append(f"teacher answer was changed for: {custom_text[:60]}")
                if "or_text_hi" in custom and str(match.get("or_text_hi", "")).strip() != str(custom.get("or_text_hi", "")).strip():
                    errors.append(f"teacher alternative was changed for: {custom_text[:60]}")
                if custom.get("marking_points_hi") and match.get("marking_points_hi") != custom.get("marking_points_hi"):
                    errors.append(f"teacher marking points were changed for: {custom_text[:60]}")
    if len(questions) != payload.question_count:
        errors.append(f"expected {payload.question_count} questions, found {len(questions)}")
    numbers = [question.get("number") for question in questions]
    if numbers != list(range(1, payload.question_count + 1)):
        errors.append("question numbers are not consecutive")
    marks = 0
    for section in valid_sections:
        try:
            marks_each = int(section.get("marks_each", 0))
        except (TypeError, ValueError):
            marks_each = 0
        section_questions = section.get("questions", [])
        marks += marks_each * (len(section_questions) if isinstance(section_questions, list) else 0)
    if marks != payload.total_marks:
        errors.append(f"question marks total {marks}, not {payload.total_marks}")
    texts = [re.sub(r"\s+", " ", str(question.get("text_hi", "")).strip()).casefold() for question in questions]
    if any(len(text) < 12 for text in texts):
        errors.append("one or more Hindi questions are incomplete")
    if len(texts) != len(set(texts)):
        errors.append("questions contain exact duplicates")
    if sum(len(re.findall(r"[\u0900-\u097f]", text)) for text in texts) < max(18, len(texts) * 10):
        errors.append("questions are not predominantly Hindi")
    for section in valid_sections:
        expected_options = section.get("type") == "mcq"
        section_questions = section.get("questions", [])
        if not isinstance(section_questions, list):
            continue
        for question in section_questions:
            if not isinstance(question, dict):
                continue
            options = question.get("options_hi") or []
            if expected_options and len(options) != 4:
                errors.append(f"MCQ {question.get('number')} does not have four options")
            if not str(question.get("answer_hi", "")).strip():
                errors.append(f"question {question.get('number')} has no answer")
    instructions = data.get("instructions")
    if not isinstance(instructions, list) or len(instructions) < 2:
        errors.append("instructions are incomplete")
    return errors


def _normalize_paper_data(data: dict, payload: TestPaperRequest) -> dict:
    """Apply teacher-owned blueprint metadata and consecutive numbering server-side."""
    if not isinstance(data, dict) or not isinstance(data.get("sections"), list):
        return data
    raw_instructions = data.get("instructions", [])
    if isinstance(raw_instructions, str):
        raw_instructions = re.split(r"\n+", raw_instructions)
    if not isinstance(raw_instructions, list):
        raw_instructions = []
    instructions = [
        str(item).strip(" -\t")
        for item in raw_instructions
        if str(item).strip(" -\t")
    ]
    teacher_instructions = [
        item.strip(" -\t")
        for item in re.split(r"\n+", payload.instructions or "")
        if item.strip(" -\t")
    ]
    defaults = (
        ["Attempt all questions.", "Write every answer clearly and in question-number order."]
        if payload.medium.strip().lower() == "english"
        else ["सभी प्रश्न हल करना अनिवार्य है।", "उत्तर प्रश्न क्रमांक के अनुसार स्पष्ट और क्रमबद्ध लिखिए।"]
    )
    # Instructions are presentation metadata, not factual question content.
    # Keep teacher wording first and deterministically fill omissions instead
    # of rejecting an otherwise complete paper because the provider skipped it.
    normalized_instructions = list(dict.fromkeys([*teacher_instructions, *instructions]))
    for default in defaults:
        if len(normalized_instructions) >= 2:
            break
        if default not in normalized_instructions:
            normalized_instructions.append(default)
    data["instructions"] = normalized_instructions[:8]
    sections = data["sections"]
    rules = payload.sections
    if rules and len(sections) == len(rules):
        for section, rule in zip(sections, rules):
            if not isinstance(section, dict):
                continue
            for field in ("name", "label_hi", "type", "marks_each", "word_limit"):
                section[field] = rule.get(field, "" if field == "word_limit" else section.get(field))
            questions = section.get("questions")
            if not isinstance(questions, list):
                continue
            for index, custom in enumerate(rule.get("custom_questions") or []):
                if index >= len(questions) or not isinstance(questions[index], dict) or not isinstance(custom, dict):
                    break
                question = questions[index]
                question["text_hi"] = str(custom.get("text_hi", "")).strip()
                if "options_hi" in custom:
                    question["options_hi"] = list(custom.get("options_hi") or [])
                if "or_text_hi" in custom:
                    question["or_text_hi"] = str(custom.get("or_text_hi", "")).strip()
                if str(custom.get("answer_hi", "")).strip():
                    question["answer_hi"] = str(custom["answer_hi"]).strip()
                if custom.get("marking_points_hi"):
                    question["marking_points_hi"] = list(custom["marking_points_hi"])

    next_number = 1
    for section in sections:
        if not isinstance(section, dict) or not isinstance(section.get("questions"), list):
            continue
        for question in section["questions"]:
            if not isinstance(question, dict):
                continue
            question["number"] = next_number
            next_number += 1
            question["text_hi"] = str(question.get("text_hi", "")).strip()
            question["answer_hi"] = str(question.get("answer_hi", "")).strip()
            question["or_text_hi"] = str(question.get("or_text_hi", "")).strip()
            if not isinstance(question.get("options_hi"), list):
                question["options_hi"] = []
            else:
                question["options_hi"] = [str(option).strip() for option in question["options_hi"]]
            if not isinstance(question.get("marking_points_hi"), list):
                question["marking_points_hi"] = []
            else:
                question["marking_points_hi"] = [
                    str(point).strip() for point in question["marking_points_hi"] if str(point).strip()
                ]
            question.setdefault("or_text_hi", "")
            question.setdefault("options_hi", [])
            question.setdefault("marking_points_hi", [])
            if section.get("type") != "mcq":
                question["options_hi"] = []
    return data


def _generate_structured_test_paper(*, payload: TestPaperRequest, context: str) -> dict:
    if not settings.groq_api_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured.")
    rules = payload.sections or _default_paper_rules(payload)
    validation_payload = payload if payload.sections else payload.model_copy(update={"sections": rules})
    chosen = {option["id"]: option for option in _chapter_options(payload.subject, payload.class_level)}
    selected_scope = [
        f"{chosen[chapter_id]['code']}: {chosen[chapter_id]['label']}"
        for chapter_id in payload.selected_chapters
        if chapter_id in chosen
    ]
    def build_prompt(evidence: str) -> str:
        return f"""Create one fresh CGBSE Class {payload.class_level} {payload.subject} paper in natural Hindi.
Scope: {selected_scope or 'none'}; extra boundary: {payload.syllabus or 'none'}; difficulty: {payload.difficulty}; teacher notes: {payload.instructions or 'none'}.
IMMUTABLE BLUEPRINT:
{json.dumps(rules, ensure_ascii=False, separators=(',', ':'))}

Return JSON only:
{{"instructions":["...","..."],"sections":[{{"name":"A","label_hi":"...","type":"mcq","marks_each":1,"word_limit":"","questions":[{{"number":1,"text_hi":"...","options_hi":["..."],"or_text_hi":"","answer_hi":"...","marking_points_hi":["..."]}}]}}]}}

Constraints:
1. Preserve every blueprint field and count exactly; number all questions consecutively.
2. Use only the selected scope and evidence. Questions must be unique and factually correct. Do not copy source wording.
3. Use Hindi only except scientific symbols. Keep answers and marking points accurate but concise.
4. Put custom_questions first in each section, in their listed order. Copy every value exactly; fill only blank answer fields. Generate only remaining slots.
5. Every MCQ has four unique plausible options; every non-MCQ has options_hi:[]. Every question has an answer.

EVIDENCE:
{evidence or 'No excerpt available; stay strictly within the official chapter titles above.'}
"""
    last_errors: list[str] = []
    token_budget = _structured_paper_token_budget(payload.question_count)
    context_limit = 2200
    models = list(dict.fromkeys(filter(None, [
        settings.groq_paper_model,
        settings.groq_paper_fallback_model,
        settings.groq_model,
    ])))[:3]
    for attempt, model in enumerate(models):
        prompt = build_prompt(_compact_paper_context(context, max_chars=context_limit))
        request = prompt if not last_errors else f"Fix these validation failures: {last_errors}. Regenerate from scratch.\n\n{prompt}"
        try:
            raw = _request_paper_completion(
                request,
                json_mode=True,
                max_tokens=token_budget,
                model=model,
            )
            raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.IGNORECASE)
            data = _normalize_paper_data(json.loads(raw), validation_payload)
            last_errors = _validate_paper_data(data, validation_payload)
            if not last_errors:
                return data
            logger.warning(
                "Structured paper model %s failed validation: %s",
                model,
                "; ".join(last_errors),
            )
        except requests.HTTPError as exc:
            status_code = exc.response.status_code if exc.response is not None else None
            logger.warning("Structured paper model %s failed: %s", model, exc)
            if status_code == 413:
                context_limit = 1000
                token_budget = min(token_budget, 4200)
            last_errors = [f"provider returned HTTP {status_code or 'error'}"]
        except (requests.RequestException, json.JSONDecodeError, TypeError, ValueError) as exc:
            logger.warning("Structured paper model %s failed: %s", model, exc)
            last_errors = ["response was not valid JSON"]
    logger.error("Structured paper generation exhausted retries: %s", "; ".join(last_errors))
    raise HTTPException(
        status_code=502,
        detail="VidyaAI पूरा प्रश्नपत्र-विन्यास तैयार नहीं कर सका। कृपया दोबारा प्रयास करें; आपके चुने अध्याय और खंड सुरक्षित हैं।",
    )


def _paper_data_to_markdown(data: dict) -> tuple[str, str, str]:
    blueprint = ["# प्रश्नपत्र रूपरेखा", "", "| खंड | प्रकार | प्रश्न | प्रति प्रश्न अंक | कुल अंक |", "|---|---|---:|---:|---:|"]
    paper = ["## सामान्य निर्देश", "", *[f"{index}. {item}" for index, item in enumerate(data["instructions"], 1)]]
    answers = ["# उत्तर कुंजी एवं अंक योजना"]
    for section in data["sections"]:
        questions = section["questions"]
        blueprint.append(f"| {section['name']} | {section['label_hi']} | {len(questions)} | {section['marks_each']} | {len(questions) * section['marks_each']} |")
        paper.extend(["", f"## खंड {section['name']} — {section['label_hi']} [{section['marks_each']} × {len(questions)} = {section['marks_each'] * len(questions)}]", ""])
        for question in questions:
            paper.append(f"**प्रश्न {question['number']}.** {question['text_hi']} **[{section['marks_each']} अंक]**")
            if question.get("options_hi"):
                paper.append("  " + " &nbsp;&nbsp; ".join(f"({chr(2325 + index)}) {option}" for index, option in enumerate(question["options_hi"])))
            if question.get("or_text_hi"):
                paper.extend(["", "**अथवा**", question["or_text_hi"]])
            answers.extend(["", f"**प्रश्न {question['number']}.** {question['answer_hi']}"])
            for point in question.get("marking_points_hi", []):
                answers.append(f"- {point}")
    return "\n".join(blueprint), "\n".join(paper), "\n".join(answers)


def _generate_test_paper(*, payload: TestPaperRequest, context: str) -> str:
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Question paper generation is unavailable because GROQ_API_KEY is not configured.",
        )
    language_rule = {
        "hindi": "Write the entire paper, instructions, blueprint, answers and marking scheme in natural Devanagari Hindi.",
        "bilingual": "Write every instruction and question first in Hindi and then in English.",
        "english": "Write the entire resource in English.",
    }.get(payload.medium.strip().lower(), "Write the entire resource in Devanagari Hindi.")
    prompt = f"""Create a CGBSE-style, print-ready school question paper based on the supplied official model-paper pattern and curriculum evidence.

REQUIREMENTS
- Class: {payload.class_level}; Subject: {payload.subject}; Syllabus: {payload.syllabus}
- Paper type: {payload.paper_type}; Total marks: {payload.total_marks}; Questions: exactly {payload.question_count}; Time: {payload.duration_minutes} minutes; Difficulty: {payload.difficulty}
- Teacher instructions: {payload.instructions or 'None'}
- {language_rule}
- Match the section order, question styles, mark distribution, internal-choice style and formal tone visible in the model paper, while creating fresh questions.
- Use only the requested syllabus. Do not copy a previous/model paper verbatim.
- Marks beside the numbered questions must total exactly {payload.total_marks}. Count subparts as part of their parent numbered question so the top-level numbered-question count is exactly {payload.question_count}.
- Begin every top-level question on its own line in the exact format `प्रश्न N. question text [M अंक]`. Use consecutive N values from 1 through {payload.question_count}. Put subparts on following lines as (अ), (ब), etc.; never label subparts as `प्रश्न`.
- Every question must be unique. Before returning, compare all questions and remove any duplicate or near-duplicate.
- The application renders the formal CGBSE heading, class, subject, time and maximum marks. Start the student-facing Markdown directly with `## सामान्य निर्देश`, followed by numbered instructions, sections and questions. Do not repeat the paper title or metadata. Do not put answers or blueprint in it.
- Give concise correct answers and point-wise marking guidance after the student paper.
- For Hindi medium, do not add English translations in parentheses. English is allowed only for unavoidable scientific symbols or established terms.

Return Markdown using these exact delimiter comments once each and in this exact order:
<!-- BLUEPRINT -->
(teacher blueprint and a validation line confirming marks/question count)
<!-- PAPER -->
(student-facing printable question paper only)
<!-- ANSWER_KEY -->
(teacher-only answer key and marking scheme)

OFFICIAL SOURCE EXCERPTS
{context or 'No source excerpt could be read; follow the teacher inputs conservatively.'}
"""
    try:
        content = _request_paper_completion(prompt)
        errors = _paper_validation_errors(content, payload)
        if errors:
            logger.warning("Generated paper failed validation: %s", "; ".join(errors))
            repair_prompt = f"""Regenerate the paper from scratch. The previous attempt was rejected for these reasons:
{chr(10).join(f'- {error}' for error in errors)}

Do not continue or copy the malformed attempt. Follow every original requirement below and silently verify the final question numbering, marks total, uniqueness, Hindi quality, and delimiters before responding.

{prompt}
"""
            content = _request_paper_completion(repair_prompt)
            errors = _paper_validation_errors(content, payload)
        if content and not errors:
            return content
        logger.error("Repaired paper failed validation: %s", "; ".join(errors))
    except (requests.RequestException, ValueError, KeyError):
        logger.exception("Test-paper generation failed")
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="VidyaAI ने अधूरा या दोहराव वाला प्रश्नपत्र बनाया, इसलिए उसे रोक दिया गया। कृपया दोबारा प्रयास करें।",
    )


def _generate_content(*, task: str, details: str, context: str, fallback: str) -> str:
    if not settings.groq_api_key:
        return fallback
    evidence_rule = (
        "Relevant CGBSE source excerpts are provided below. Use them as the factual basis and do not invent chapter facts."
        if context
        else "No strong textbook excerpt was found. Clearly label any chapter-specific detail that the teacher must verify."
    )
    prompt = f"""Create a practical teacher resource for an Indian school teacher.

TASK
{task}

TEACHER INPUTS
{details}

EVIDENCE POLICY
{evidence_rule}

TEXTBOOK CONTEXT
{context or "No verified excerpt available."}

Return polished Markdown only. Make it classroom-ready, specific, inclusive, and realistic. Use tables where they improve clarity. Do not add meta commentary about being an AI."""
    payload = {
        "model": settings.groq_model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are VidyaAI Teacher Copilot, an expert curriculum planner, assessment designer, and pedagogy coach. "
                    "Align outputs to the supplied class, subject, marks, time, and medium. Never claim unverified board rules."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.25,
        "max_tokens": 3500,
    }
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=75,
        )
        if response.status_code == 200:
            content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            if content:
                return content
    except requests.RequestException:
        logger.exception("Teacher content generation failed")
    return fallback


def _curriculum_items(payload: CurriculumRequest) -> tuple[list[str], list[str]]:
    """Keep teacher-entered chapter names intact and supply official Class 10 scope when blank."""
    chapters = [
        re.sub(r"^\s*(?:[-*•]|\d+[.)])\s*", "", item).strip()
        for item in re.split(r"[\n;]+", payload.chapters or "")
        if item.strip()
    ]
    if not chapters:
        chapters = [
            f"{item['code']}. {item['label']}"
            for item in _chapter_options(payload.subject, payload.class_level)
        ]
    if not chapters:
        chapters = [
            "शिक्षक द्वारा निर्धारित पाठ्यक्रम सीमा"
            if payload.medium.strip().lower() != "english"
            else "Teacher-defined syllabus scope"
        ]
    chapters = list(dict.fromkeys(chapters))

    goals = [
        re.sub(r"^\s*(?:[-*•]|\d+[.)])\s*", "", item).strip()
        for item in re.split(r"[\n;]+", payload.learning_goals or "")
        if item.strip()
    ]
    if not goals:
        goals = [
            "अवधारणात्मक समझ, अनुप्रयोग, वैज्ञानिक अभिव्यक्ति और परीक्षा तैयारी"
            if payload.medium.strip().lower() != "english"
            else "Conceptual understanding, application, clear subject expression, and exam readiness"
        ]
    return chapters, list(dict.fromkeys(goals))


def _curriculum_week_topics(chapters: list[str], duration_weeks: int) -> list[str]:
    """Distribute every requested chapter across the available weeks without dropping scope."""
    topics: list[str] = []
    for week in range(duration_weeks):
        start = (week * len(chapters)) // duration_weeks
        end = ((week + 1) * len(chapters)) // duration_weeks
        if start == end:
            selected = [chapters[min(start, len(chapters) - 1)]]
        else:
            selected = chapters[start:end]
        topics.append("; ".join(selected))
    return topics


def _period_plan(periods: int, *, english: bool = False) -> str:
    if english:
        if periods == 1:
            return "P1: prior-knowledge check, core concept, and exit check"
        if periods == 2:
            return "P1: concept building; P2: guided practice and exit check"
        if periods == 3:
            return "P1: prior knowledge and concept; P2: activity/application; P3: practice and assessment"
        if periods == 4:
            return "P1: diagnostic and concept; P2: explanation; P3: activity/application; P4: assessment and support"
        return f"P1: diagnostic and goals; P2–{periods - 2}: concept, examples, and guided practice; P{periods - 1}: application/activity; P{periods}: assessment and support"
    if periods == 1:
        return "पी1: पूर्वज्ञान जाँच, मुख्य अवधारणा और निकास-पर्ची"
    if periods == 2:
        return "पी1: अवधारणा निर्माण; पी2: निर्देशित अभ्यास और निकास-पर्ची"
    if periods == 3:
        return "पी1: पूर्वज्ञान व अवधारणा; पी2: गतिविधि/अनुप्रयोग; पी3: अभ्यास व आकलन"
    if periods == 4:
        return "पी1: निदान व अवधारणा; पी2: व्याख्या; पी3: गतिविधि/अनुप्रयोग; पी4: आकलन व सहायता"
    return f"पी1: निदान व लक्ष्य; पी2–{periods - 2}: अवधारणा, उदाहरण व निर्देशित अभ्यास; पी{periods - 1}: अनुप्रयोग/गतिविधि; पी{periods}: आकलन व पुनःसहायता"


def _structured_curriculum_fallback(payload: CurriculumRequest) -> str:
    """Produce a complete, safe plan using exact teacher/official scope when an LLM is unavailable."""
    chapters, goals = _curriculum_items(payload)
    week_topics = _curriculum_week_topics(chapters, payload.duration_weeks)
    english = payload.medium.strip().lower() == "english"
    period_plan = _period_plan(payload.periods_per_week, english=english)

    if english:
        lines = [
            f"# Class {payload.class_level} {payload.subject} Curriculum Plan",
            "",
            "## Plan overview",
            "",
            f"| Class | Subject | Duration | Weekly periods | Medium | Total planned periods |",
            "|---|---|---:|---:|---|---:|",
            f"| {payload.class_level} | {payload.subject} | {payload.duration_weeks} weeks | {payload.periods_per_week} | {payload.medium} | {payload.duration_weeks * payload.periods_per_week} |",
            "",
            "This plan sequences the exact scope supplied by the teacher (or the mapped official Class 10 scope when left blank). Each week includes instruction, application, evidence of learning, and a recovery step.",
            "",
            "## Measurable learning outcomes",
            "",
            *[f"- Students will demonstrate progress toward: {goal}." for goal in goals],
            "- Students will explain key ideas in their own words, apply them to unfamiliar questions, and improve work using feedback.",
            "- The teacher will record weekly evidence and reteach any outcome not yet demonstrated.",
            "",
            "## Week-wise scope and sequence",
            "",
            "| Week | Chapter / focus | Period allocation | Expected learning evidence | Learning activity | Assessment and follow-up |",
            "|---:|---|---|---|---|---|",
        ]
        for week, topic in enumerate(week_topics, 1):
            phase = "orientation and diagnostic" if week == 1 else "revision and consolidation" if week == payload.duration_weeks else "concept building and application"
            assessment = "short diagnostic plus exit ticket" if week == 1 else "mixed retrieval check, correction, and targeted support" if week == payload.duration_weeks else "exit ticket or five-question check; regroup next lesson from results"
            lines.append(
                f"| {week} | {topic} — {phase} | {period_plan} | Explain the central ideas of **{topic}** and use them in a guided task. | Think–pair–share, worked example, and one independent application. | {assessment} |"
            )
        lines.extend([
            "", "## Teaching approach and resources", "",
            "- Begin with a short prior-knowledge prompt; model one example; move from guided to independent work.",
            "- Use the prescribed textbook, board work, locally available materials, and one concise practice sheet; verify diagrams and terminology against the official text.",
            "- Keep a weekly misconception log and use the first part of the next lesson for corrective teaching.",
            "", "## Assessment plan", "",
            "- **Weekly:** exit ticket, notebook check, oral explanation, or five-question quiz.",
            "- **Mid-plan:** cumulative application task covering all scope taught so far, followed by correction time.",
            "- **End-plan:** mixed-format assessment, feedback, targeted reteaching, and one re-check of weak outcomes.",
            "", "## Differentiation, revision, and buffer", "",
            "- Foundation support: vocabulary bank, chunked examples, peer rehearsal, and one scaffolded question before independent work.",
            "- Extension: justification, error analysis, comparison, or an unfamiliar application from the same taught scope.",
            "- Reserve the final assessment period each week for feedback; if pacing slips, protect core outcomes and move enrichment—not essential teaching—to the buffer.",
            "", "## Teacher checklist", "",
            "- [ ] Confirm chapter order, holidays, and school assessment dates.",
            "- [ ] Prepare the textbook pages, examples, activity materials, and assessment evidence for each week.",
            "- [ ] Record students needing support or extension and schedule the follow-up.",
            "- [ ] Review progress at the end of each week and update the next week's first period.",
        ])
        return "\n".join(lines)

    lines = [
        f"# कक्षा {payload.class_level} {payload.subject} — पाठ्यक्रम योजना",
        "",
        "## योजना का संक्षिप्त परिचय",
        "",
        "| कक्षा | विषय | अवधि | साप्ताहिक पीरियड | माध्यम | कुल नियोजित पीरियड |",
        "|---|---|---:|---:|---|---:|",
        f"| {payload.class_level} | {payload.subject} | {payload.duration_weeks} सप्ताह | {payload.periods_per_week} | {payload.medium} | {payload.duration_weeks * payload.periods_per_week} |",
        "",
        "यह योजना शिक्षक द्वारा दी गई पाठ्यक्रम-सीमा को उसी रूप में क्रमबद्ध करती है। सीमा खाली होने पर कक्षा 10 के उपलब्ध आधिकारिक अध्याय-मानचित्र का उपयोग किया गया है। हर सप्ताह शिक्षण, अनुप्रयोग, सीखने का प्रमाण और पुनःसहायता शामिल है।",
        "",
        "## मापनीय अधिगम परिणाम",
        "",
        *[f"- विद्यार्थी इस लक्ष्य की दिशा में प्रगति दिखाएँगे: {goal}।" for goal in goals],
        "- विद्यार्थी प्रमुख विचारों को अपने शब्दों में समझाएँगे, नए प्रश्न में लागू करेंगे और प्रतिक्रिया के आधार पर उत्तर सुधारेंगे।",
        "- शिक्षक हर सप्ताह सीखने का प्रमाण दर्ज करेंगे और अधूरा परिणाम मिलने पर पुनःशिक्षण करेंगे।",
        "",
        "## सप्ताहवार कार्ययोजना",
        "",
        "| सप्ताह | अध्याय / केंद्रबिंदु | पीरियड-विन्यास | अपेक्षित सीखने का प्रमाण | गतिविधि | आकलन एवं अगला कदम |",
        "|---:|---|---|---|---|---|",
    ]
    for week, topic in enumerate(week_topics, 1):
        phase = "परिचय और निदान" if week == 1 else "पुनरावृत्ति और समेकन" if week == payload.duration_weeks else "अवधारणा निर्माण और अनुप्रयोग"
        assessment = "लघु निदान तथा निकास-पर्ची" if week == 1 else "मिश्रित पुनःस्मरण जाँच, त्रुटि-सुधार और लक्षित सहायता" if week == payload.duration_weeks else "निकास-पर्ची अथवा पाँच-प्रश्न जाँच; परिणाम से अगला समूह तय करें"
        lines.append(
            f"| {week} | {topic} — {phase} | {period_plan} | **{topic}** के प्रमुख विचार समझाकर निर्देशित कार्य में उनका उपयोग। | सोचो–जोड़ी बनाओ–साझा करो, उदाहरण और एक स्वतंत्र अनुप्रयोग। | {assessment} |"
        )
    lines.extend([
        "", "## शिक्षण-पद्धति और संसाधन", "",
        "- छोटे पूर्वज्ञान प्रश्न से शुरुआत करें; एक उदाहरण का आदर्श समाधान दिखाएँ; फिर निर्देशित से स्वतंत्र अभ्यास की ओर बढ़ें।",
        "- निर्धारित पाठ्यपुस्तक, श्यामपट्ट, स्थानीय सामग्री और एक संक्षिप्त अभ्यास-पत्र उपयोग करें; आरेख व शब्दावली आधिकारिक पाठ से मिलाएँ।",
        "- साप्ताहिक भ्रांति-पंजी बनाएँ और अगले पीरियड के प्रारंभ में आवश्यक सुधारात्मक शिक्षण करें।",
        "", "## मूल्यांकन योजना", "",
        "- **साप्ताहिक:** निकास-पर्ची, कॉपी-जाँच, मौखिक व्याख्या या पाँच-प्रश्न क्विज़।",
        "- **मध्यावधि:** अब तक पढ़ाए गए सभी केंद्रबिंदुओं पर संचयी अनुप्रयोग कार्य और उसके बाद त्रुटि-सुधार।",
        "- **समापन:** मिश्रित प्रश्न-विन्यास वाला आकलन, प्रतिक्रिया, लक्षित पुनःशिक्षण और कमजोर परिणामों की दोबारा जाँच।",
        "", "## विभेदीकरण, पुनरावृत्ति और बफर", "",
        "- आधार-सहायता: शब्द-सूची, छोटे चरणों वाले उदाहरण, साथी के साथ मौखिक अभ्यास और स्वतंत्र कार्य से पहले एक संकेतयुक्त प्रश्न।",
        "- उन्नत कार्य: कारण देना, त्रुटि-विश्लेषण, तुलना या पढ़ी हुई सीमा से नया अनुप्रयोग।",
        "- हर सप्ताह अंतिम आकलन-पीरियड में प्रतिक्रिया दें; गति पीछे होने पर मुख्य परिणाम सुरक्षित रखें और केवल समृद्धि-कार्य को बफर में ले जाएँ।",
        "", "## शिक्षक चेकलिस्ट", "",
        "- [ ] अध्याय क्रम, अवकाश और विद्यालयी मूल्यांकन तिथियाँ जाँच ली हैं।",
        "- [ ] हर सप्ताह के पाठ्यपुस्तक पृष्ठ, उदाहरण, गतिविधि-सामग्री और आकलन प्रमाण तैयार हैं।",
        "- [ ] अतिरिक्त सहायता और उन्नत कार्य वाले विद्यार्थियों की सूची तथा अगला कदम दर्ज है।",
        "- [ ] सप्ताहांत प्रगति देखकर अगले सप्ताह के पहले पीरियड को आवश्यकतानुसार बदला है।",
    ])
    return "\n".join(lines)


def _curriculum_validation_errors(content: str, payload: CurriculumRequest) -> list[str]:
    errors: list[str] = []
    minimum_length = min(1400, 600 + (payload.duration_weeks * 80))
    if len(content.strip()) < minimum_length:
        errors.append("curriculum is too short")
    lowered = content.casefold()
    if "add textbook-aligned details" in lowered or "ai generation is temporarily unavailable" in lowered:
        errors.append("curriculum contains placeholder text")
    week_heading = re.search(
        r"^#{1,6}[^\n]*(?:सप्ताह|साप्ताहिक|week)[^\n]*$",
        content,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    week_section = ""
    if week_heading:
        section_start = week_heading.end()
        next_heading = re.search(r"^#{1,6}\s", content[section_start:], flags=re.MULTILINE)
        section_end = section_start + next_heading.start() if next_heading else len(content)
        week_section = content[section_start:section_end]
    else:
        week_header = re.search(
            r"^\|[^\n]*(?:सप्ताह|week)[^\n]*\|\s*$",
            content,
            flags=re.IGNORECASE | re.MULTILINE,
        )
        if week_header:
            section_start = week_header.start()
            next_heading = re.search(r"^#{1,6}\s", content[section_start:], flags=re.MULTILINE)
            section_end = section_start + next_heading.start() if next_heading else len(content)
            week_section = content[section_start:section_end]
    week_numbers = [
        int(match)
        for match in re.findall(
            r"^\|\s*(?:\*\*)?(?:सप्ताह\s*)?(\d{1,2})(?:\*\*)?\s*\|",
            week_section,
            flags=re.IGNORECASE | re.MULTILINE,
        )
    ]
    expected_weeks = list(range(1, payload.duration_weeks + 1))
    if week_numbers != expected_weeks:
        errors.append(f"week table must contain exactly weeks 1 through {payload.duration_weeks}")
    if payload.medium.strip().lower() != "english":
        if len(re.findall(r"[\u0900-\u097f]", content)) < 180:
            errors.append("curriculum is not predominantly Hindi")
        required_groups = {
            "outcomes": ("अधिगम", "सीखने", "उद्देश्य"),
            "assessment": ("मूल्यांकन", "आकलन"),
            "support": ("विभेदीकरण", "पुनःसहायता", "उपचारात्मक", "सहायता"),
            "revision": ("पुनरावृत्ति", "बफर", "दोहराव", "समेकन"),
            "checklist": ("चेकलिस्ट", "जाँच-सूची", "जाँच सूची", "शिक्षक जाँच", "कार्य-सूची"),
        }
        missing = [
            label for label, terms in required_groups.items()
            if not any(term in content for term in terms)
        ]
        if "सप्ताह" not in content or missing:
            errors.append("curriculum is missing required Hindi sections" + (f": {', '.join(missing)}" if missing else ""))
    else:
        required_groups = {
            "outcomes": ("learning outcome", "learning goal", "objective"),
            "assessment": ("assessment", "check for understanding"),
            "support": ("differentiation", "remediation", "support"),
            "revision": ("revision", "buffer", "consolidation"),
            "checklist": ("checklist", "teacher check"),
        }
        missing = [
            label for label, terms in required_groups.items()
            if not any(term in lowered for term in terms)
        ]
        if "week" not in lowered or missing:
            errors.append("curriculum is missing required sections" + (f": {', '.join(missing)}" if missing else ""))
    return errors


def _generate_curriculum_plan(*, payload: CurriculumRequest, context: str) -> tuple[str, str]:
    fallback = _structured_curriculum_fallback(payload)
    if not settings.groq_api_key:
        return fallback, "structured_fallback"

    chapters, goals = _curriculum_items(payload)
    language = "English" if payload.medium.strip().lower() == "english" else "natural Hindi"
    topic_lines = "\n".join(f"- {chapter}" for chapter in chapters)
    goal_lines = "\n".join(f"- {goal}" for goal in goals)
    prompt = f"""Create a classroom-ready curriculum plan in {language}.

IMMUTABLE INPUTS
Class: {payload.class_level}
Subject: {payload.subject}
Duration: exactly {payload.duration_weeks} weeks
Periods per week: exactly {payload.periods_per_week}
Medium: {payload.medium}

CHAPTERS / SCOPE (preserve these labels; cover every item)
{topic_lines}

LEARNING GOALS
{goal_lines}

REQUIRED OUTPUT
1. Markdown only, with a clear title and a compact metadata table.
2. Measurable learning outcomes tied to the supplied goals.
3. One week-wise Markdown table containing exactly {payload.duration_weeks} data rows. The first cell of each row must be the Arabic week number alone: 1 through {payload.duration_weeks}.
4. Each week row must include chapter/focus, an exact {payload.periods_per_week}-period allocation, expected evidence of learning, an activity, assessment, and the next support step.
5. Add separate sections for teaching methods/resources, weekly and cumulative assessment, differentiation/remediation, revision/buffer, and a teacher checklist.
6. Stay within the supplied labels and evidence. Do not invent chapter facts, board rules, holidays, or dates. Do not use placeholder or verification-warning text.

COMPACT OFFICIAL EVIDENCE
{_compact_paper_context(context, max_chars=2400) or 'No excerpt available; use only the exact scope labels and goals above.'}
"""
    token_budget = min(5000, max(2200, 1200 + (payload.duration_weeks * 95)))
    models = list(dict.fromkeys(filter(None, [
        settings.groq_paper_model,
        settings.groq_paper_fallback_model,
        settings.groq_model,
    ])))[:2]
    last_errors: list[str] = []
    for model in models:
        request = prompt if not last_errors else f"Regenerate from scratch and fix: {'; '.join(last_errors)}.\n\n{prompt}"
        try:
            content = _request_paper_completion(request, max_tokens=token_budget, model=model)
            last_errors = _curriculum_validation_errors(content, payload)
            if not last_errors:
                return content, "ai"
            logger.warning("Curriculum model %s failed validation: %s", model, "; ".join(last_errors))
        except (requests.RequestException, ValueError, KeyError) as exc:
            logger.warning("Curriculum model %s failed: %s", model, exc)
            last_errors = ["provider request failed"]
    logger.warning("Curriculum generation used structured fallback: %s", "; ".join(last_errors))
    return fallback, "structured_fallback"


@router.post("/curriculum")
async def create_curriculum(payload: CurriculumRequest, teacher=Depends(require_teacher)):
    query = f"Class {payload.class_level} {payload.subject} curriculum {payload.chapters} {payload.learning_goals}"
    context, sources = _grounding_context(
        class_level=payload.class_level,
        subject=payload.subject,
        query=query,
        document_type_boosts={
            "learning_outcome": 10.0,
            "curriculum": 8.0,
            "academic_calendar": 7.0,
            "textbook": 3.0,
            "model_question_paper": 1.0,
            "previous_year_question": 0.5,
        },
    )
    curriculum_chapters, _ = _curriculum_items(payload)
    local_context, local_sources = await asyncio.to_thread(
        _local_teacher_context,
        payload.class_level,
        payload.subject,
        8000,
        curriculum_chapters,
    )
    if local_context:
        context = "\n\n".join(item for item in (context, local_context) if item)
    sources = list(dict.fromkeys([*sources, *local_sources]))
    content, generation_mode = await asyncio.to_thread(
        _generate_curriculum_plan,
        payload=payload,
        context=context,
    )
    return {
        "content": content,
        "sources": sources,
        "type": "curriculum",
        "generation_mode": generation_mode,
        "curriculum_meta": {
            "class_level": payload.class_level,
            "subject": payload.subject,
            "duration_weeks": payload.duration_weeks,
            "periods_per_week": payload.periods_per_week,
            "medium": payload.medium,
        },
    }


@router.post("/test-paper")
async def create_test_paper(payload: TestPaperRequest, teacher=Depends(require_teacher)):
    if not payload.selected_chapters and not payload.syllabus.strip():
        raise HTTPException(status_code=422, detail="कम-से-कम एक अध्याय चुनें या पाठ्यक्रम सीमा लिखें।")
    request_errors = _paper_request_errors(payload)
    if request_errors:
        raise HTTPException(status_code=422, detail="प्रश्न-विन्यास सही करें: " + " ".join(request_errors))
    chapter_options = _chapter_options(payload.subject, payload.class_level)
    chapter_by_id = {option["id"]: option for option in chapter_options}
    selected_ids = list(dict.fromkeys(payload.selected_chapters))
    invalid_ids = [chapter_id for chapter_id in selected_ids if chapter_id not in chapter_by_id]
    if invalid_ids:
        raise HTTPException(
            status_code=422,
            detail=f"चुने गए अध्याय वर्तमान CGBSE सूची में नहीं हैं: {', '.join(invalid_ids)}",
        )

    chapter_document_boosts = {
        "curriculum": 11.0,
        "textbook": 10.0,
        "previous_year_question": 7.0,
        "answer_key": 4.0,
        "model_question_paper": 1.0,
    }
    selected_scope = " ".join(
        f"chapter {chapter_by_id[chapter_id]['code']} {chapter_by_id[chapter_id]['label']}"
        for chapter_id in selected_ids
    )
    broad_query = (
        f"Class {payload.class_level} {payload.subject} {selected_scope} "
        f"{payload.syllabus} important questions assessment pattern"
    )

    # For a focused test, retrieve independently for every selected chapter so
    # one chapter number cannot dominate the evidence. Larger scopes are split
    # into small title-based batches: this preserves coverage without scrolling
    # the complete vector collection once for every one of 18–23 chapters.
    retrieval_scopes: list[tuple[str, str, str | None, str | None, bool]]
    if 0 < len(selected_ids) <= 6:
        retrieval_scopes = [
            (
                f"अध्याय {chapter_by_id[chapter_id]['code']} — {chapter_by_id[chapter_id]['label']}",
                f"{chapter_by_id[chapter_id]['retrieval_query']} {payload.syllabus} CGBSE important questions concepts",
                chapter_by_id[chapter_id].get("chapter_hint"),
                chapter_by_id[chapter_id].get("section_hint"),
                True,
            )
            for chapter_id in selected_ids
        ]
    elif selected_ids:
        retrieval_scopes = []
        for start in range(0, len(selected_ids), 3):
            batch_ids = selected_ids[start:start + 3]
            batch_labels = "; ".join(chapter_by_id[chapter_id]["label"] for chapter_id in batch_ids)
            batch_codes = ", ".join(chapter_by_id[chapter_id]["code"] for chapter_id in batch_ids)
            retrieval_scopes.append((
                f"अध्याय {batch_codes}",
                f"Class {payload.class_level} {payload.subject} selected topics {batch_labels} {payload.syllabus} important concepts questions",
                None,
                None,
                False,
            ))
    else:
        retrieval_scopes = [("चयनित पाठ्यक्रम", broad_query, None, None, not selected_ids)]

    evidence_blocks: list[str] = []
    sources: list[str] = []
    pattern_context, pattern_sources = _grounding_context(
        class_level=payload.class_level,
        subject=payload.subject,
        query=f"Class {payload.class_level} {payload.subject} official model question paper assessment blueprint marking scheme",
        document_type_boosts={
            "marking_scheme": 12.0,
            "assessment_blueprint": 11.0,
            "model_question_paper": 10.0,
            "answer_key": 8.0,
            "curriculum": 3.0,
        },
        result_limit=4,
        infer_chapter_hint=False,
    )
    if pattern_context:
        evidence_blocks.append(f"[Evidence scope: official paper structure]\n{pattern_context[:5500]}")
    sources.extend(pattern_sources)
    result_limit = 6 if len(retrieval_scopes) == 1 else 3
    scope_char_limit = 4500 if len(selected_ids) <= 6 else 2800
    for scope_label, retrieval_query, chapter_hint, section_hint, infer_chapter_hint in retrieval_scopes:
        chapter_context, chapter_sources = _grounding_context(
            class_level=payload.class_level,
            subject=payload.subject,
            query=retrieval_query,
            document_type_boosts=chapter_document_boosts,
            result_limit=result_limit,
            chapter_hint=chapter_hint,
            section_hint=section_hint,
            infer_chapter_hint=infer_chapter_hint,
        )
        if chapter_context:
            evidence_blocks.append(f"[Evidence scope: {scope_label}]\n{chapter_context[:scope_char_limit]}")
        sources.extend(chapter_sources)

    local_context, local_sources = await asyncio.to_thread(
        _local_teacher_context,
        payload.class_level,
        payload.subject,
        scope_terms=[chapter_by_id[chapter_id]["label"] for chapter_id in selected_ids],
    )
    combined_context = "\n\n".join([*evidence_blocks, local_context] if local_context else evidence_blocks)
    all_sources = list(dict.fromkeys([*sources, *local_sources]))
    paper_data = await asyncio.to_thread(_generate_structured_test_paper, payload=payload, context=combined_context)
    blueprint, paper_content, answer_key = _paper_data_to_markdown(paper_data)
    content = f"<!-- BLUEPRINT -->\n{blueprint}\n<!-- PAPER -->\n{paper_content}\n<!-- ANSWER_KEY -->\n{answer_key}"
    parts = {"blueprint": blueprint, "paper_content": paper_content, "answer_key": answer_key}
    return {
        "content": content,
        **parts,
        "sources": all_sources,
        "type": "test-paper",
        "medium": payload.medium,
        "paper_meta": {
            "board": "CGBSE",
            "session": "2026–27",
            "class_level": payload.class_level,
            "subject": payload.subject,
            "total_marks": payload.total_marks,
            "duration_minutes": payload.duration_minutes,
            "paper_type": payload.paper_type,
        },
        "paper_data": paper_data,
    }


@router.post("/lesson-guide")
async def create_lesson_guide(payload: LessonGuideRequest, teacher=Depends(require_teacher)):
    query = f"Class {payload.class_level} {payload.subject} {payload.chapter_or_topic} explain concepts examples"
    context, sources = _grounding_context(
        class_level=payload.class_level,
        subject=payload.subject,
        query=query,
        document_type_boosts={
            "teacher_guide": 10.0,
            "textbook": 8.0,
            "learning_outcome": 6.0,
            "curriculum": 4.0,
            "model_question_paper": 1.0,
            "previous_year_question": 0.5,
        },
    )
    details = (
        f"Class: {payload.class_level}\nSubject: {payload.subject}\nTopic/chapter: {payload.chapter_or_topic}\n"
        f"Medium: {payload.medium}\nLesson length: {payload.lesson_minutes} minutes\n"
        f"Student readiness: {payload.student_level}\nTeacher notes: {payload.teacher_notes or 'None'}"
    )
    task = (
        "Prepare the teacher before class. Include: a clear topic explanation for the teacher; prerequisite knowledge; learning objectives; "
        "the most important points and common misconceptions; a minute-by-minute teaching sequence; an engaging hook; board-work plan; "
        "simple examples/analogies; questions to ask at increasing cognitive levels; one classroom activity; differentiation for struggling and "
        "advanced learners; a quick formative check; homework/exit ticket; likely student doubts with suggested answers; and a before-class checklist."
    )
    fallback = _fallback_content(
        f"Teaching Guide: {payload.chapter_or_topic}",
        ["Teacher concept briefing", "Learning objectives", "Important points", "Lesson sequence", "Questions to ask", "Misconceptions", "Assessment", "Before-class checklist"],
    )
    content = await asyncio.to_thread(_generate_content, task=task, details=details, context=context, fallback=fallback)
    return {"content": content, "sources": sources, "type": "lesson-guide"}
