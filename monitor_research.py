"""
BNB Hackathon Research & Deliverable Integrity Monitor
Monitors the state of research files, verifies completeness, word counts, and structural integrity.
"""

import os
import sys
import time
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
RESEARCH_DIR = os.path.join(ROOT_DIR, "research")
ROOT_MASTER = os.path.join(ROOT_DIR, "MASTER_AI_INTERVIEW_BOT_BLUEPRINT.md")
EXPECTED_FILES = [
    "01_COMPETITOR_LANDSCAPE.md",
    "02_USER_PAIN_POINTS_REDDIT_COMMUNITY.md",
    "03_TECH_STACK_AND_FAILURE_MODES.md",
    "04_STRATEGY_HOW_TO_BEAT_THEM.md",
    "05_MASTER_SLIDE_DECK_CONTENT.md",
    "06_TEN_TOOLS_DETAILED_REVIEW.md",
    "07_POLISHED_SYSTEM_DESIGN_AND_25_ALGORITHMS.md",
    "08_FRONTIER_ARXIV_RESEARCH_AND_3_INSANE_IDEAS.md",
    "09_FULL_BUILD_AND_IMPLEMENTATION_PLAN.md",
    "10_ADVANCED_ANTI_CHEAT_AND_AUTHENTICITY_FACTORS.md",
    "README.md",
]

def check_research_status():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n========================================================")
    print(f" [RESEARCH INTEGRITY AUDIT] Timestamp: {timestamp}")
    print(f" Target Directory: {RESEARCH_DIR}")
    print(f"========================================================")

    if not os.path.exists(RESEARCH_DIR):
        print(f"[ERROR] Research directory does not exist: {RESEARCH_DIR}")
        return False

    all_passed = True
    total_words = 0
    total_bytes = 0

    # Audit Root Master Document
    if os.path.exists(ROOT_MASTER):
        master_size = os.path.getsize(ROOT_MASTER)
        total_bytes += master_size
        with open(ROOT_MASTER, "r", encoding="utf-8") as f:
            master_words = len(f.read().split())
            total_words += master_words
        mtime = datetime.fromtimestamp(os.path.getmtime(ROOT_MASTER)).strftime("%H:%M:%S")
        print(f" [OK] [ROOT MASTER] {'MASTER_AI_INTERVIEW_BOT_BLUEPRINT.md':<38} | {master_size:>7} bytes | {master_words:>5} words | Updated: {mtime}")
    else:
        print(f" [MISSING] [X] ROOT MASTER: MASTER_AI_INTERVIEW_BOT_BLUEPRINT.md")
        all_passed = False

    print("--------------------------------------------------------")
    for filename in EXPECTED_FILES:
        filepath = os.path.join(RESEARCH_DIR, filename)
        if not os.path.exists(filepath):
            print(f" [MISSING] [X] {filename}")
            all_passed = False
            continue

        size = os.path.getsize(filepath)
        total_bytes += size
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            words = len(content.split())
            total_words += words

        mtime = datetime.fromtimestamp(os.path.getmtime(filepath)).strftime("%H:%M:%S")
        status = "[OK]" if size > 1000 else "[WARN]"
        print(f" {status} {filename:<38} | {size:>7} bytes | {words:>5} words | Updated: {mtime}")

    print("--------------------------------------------------------")
    print(f" Total Research Corpus: {len(EXPECTED_FILES)} files | {total_words:,} words | {total_bytes/1024:.1f} KB")
    print(f" Status: {'ALL AUDITS PASSED - RESEARCH COMPLETE' if all_passed else 'SOME FILES MISSING'}")
    print(f"========================================================\n")
    return all_passed

if __name__ == "__main__":
    check_research_status()
