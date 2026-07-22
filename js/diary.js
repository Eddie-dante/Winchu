<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>📖 Blue Diary</title>
    <style>
        /* Reset & base */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
        }

        body {
            background: #d4dce8;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Georgia', 'Times New Roman', serif;
            padding: 1.5rem;
            margin: 0;
        }

        /* --- BOOK WRAPPER --- */
        .book-wrapper {
            width: 100%;
            max-width: 820px;
            aspect-ratio: 3 / 2;
            perspective: 2000px;
            cursor: default;
        }

        .book {
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
            transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
            transform: rotateY(0deg) rotateX(0deg);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
            border-radius: 16px 4px 4px 16px;
        }

        /* --- COVERS – beautiful blue --- */
        .book-cover {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 16px 4px 4px 16px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            text-align: center;
            box-sizing: border-box;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .book-cover-front {
            transform: rotateY(0deg);
            z-index: 10;
            background: linear-gradient(145deg, #1a3a5c, #0d2844);
            background-image: radial-gradient(circle at 30% 35%, #2a5a7a 1px, transparent 1px),
                radial-gradient(circle at 70% 75%, #2a5a7a 1px, transparent 1px);
            background-size: 48px 48px;
            box-shadow: inset 0 0 0 1px #3a6a8a, inset 0 0 40px rgba(0, 20, 40, 0.6);
            color: #e8f0f8;
        }

        .book-cover-front::after {
            content: '';
            position: absolute;
            inset: 20px;
            border: 1px solid rgba(180, 215, 255, 0.2);
            border-radius: 12px;
            pointer-events: none;
        }

        .book-cover-back {
            transform: rotateY(180deg);
            background: linear-gradient(145deg, #0d2844, #081a2e);
            box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.7);
        }

        .book-cover-back::after {
            content: '✦ diary ✦';
            font-size: 2rem;
            letter-spacing: 8px;
            color: #4a7a9a;
            opacity: 0.3;
            font-weight: 300;
            font-family: 'Georgia', serif;
        }

        .book-spine {
            position: absolute;
            left: -8px;
            top: 6px;
            width: 16px;
            height: 96%;
            background: #0a1e32;
            border-radius: 8px 2px 2px 8px;
            box-shadow: inset -2px 0 10px rgba(0, 0, 0, 0.8), inset 2px 0 4px #3a6a8a;
            transform: rotateY(0deg) translateZ(2px);
            z-index: 20;
            border-left: 1px solid #3a6a8a;
        }

        /* --- PAGES – clean, light --- */
        .book-pages {
            position: absolute;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            transform: rotateY(0deg);
            backface-visibility: hidden;
            border-radius: 12px 2px 2px 12px;
            background: #f8f5f0;
            box-shadow: inset 0 0 0 1px #d0c8b8, inset 0 0 30px rgba(100, 80, 60, 0.06);
            padding: 2rem 2.5rem;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            overflow: hidden;
            font-family: 'Georgia', 'Times New Roman', serif;
            color: #2a241e;
            line-height: 1.7;
        }

        .book-pages::before {
            content: '';
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(transparent 0px, transparent 27px, #ece6dc 27px, #ece6dc 28px);
            opacity: 0.25;
            pointer-events: none;
        }

        .page-content {
            position: relative;
            z-index: 5;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .diary-header {
            border-bottom: 1px solid #d0c8b8;
            padding-bottom: 0.4rem;
            margin-bottom: 0.8rem;
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            font-weight: 400;
            letter-spacing: 0.5px;
            color: #7a6e5e;
            text-transform: uppercase;
            font-family: 'Georgia', serif;
        }

        .diary-entry {
            flex: 1;
            font-size: 1.05rem;
            font-family: 'Georgia', 'Times New Roman', serif;
            background: rgba(255, 250, 240, 0.4);
            padding: 0.8rem 1rem;
            border-radius: 12px;
            box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.02);
            overflow-y: auto;
            border-left: 3px solid #c6b8a4;
            font-weight: 400;
            color: #2c241c;
            min-height: 70px;
            outline: none;
            cursor: text;
            user-select: text;
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.8;
            font-style: normal;
        }

        .diary-entry:focus {
            border-left-color: #4a7a9a;
            background: rgba(255, 250, 240, 0.7);
        }

        .diary-entry p {
            margin-bottom: 0.6rem;
        }
        .diary-entry p:last-child {
            margin-bottom: 0;
        }

        .diary-footer {
            margin-top: 0.8rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.75rem;
            color: #8f826e;
            border-top: 1px solid #ddd6c8;
            padding-top: 0.5rem;
            font-weight: 400;
            letter-spacing: 0.3px;
            font-family: 'Georgia', serif;
        }

        /* --- PAGE NAV – clean --- */
        .page-nav {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .page-nav button {
            background: transparent;
            border: 1px solid #c6b8a4;
            color: #3d342b;
            font-weight: 400;
            font-size: 0.75rem;
            padding: 4px 16px;
            border-radius: 30px;
            cursor: pointer;
            font-family: 'Georgia', serif;
            transition: all 0.15s;
            letter-spacing: 0.3px;
            background: rgba(255, 250, 240, 0.3);
            backdrop-filter: blur(2px);
        }

        .page-nav button:hover:not(:disabled) {
            background: #d6cec0;
            border-color: #a0907a;
        }

        .page-nav button:active:not(:disabled) {
            transform: scale(0.96);
        }

        .page-nav button:disabled {
            opacity: 0.3;
            cursor: not-allowed;
            border-color: #d0c8b8;
        }

        .page-indicator {
            font-size: 0.75rem;
            font-weight: 400;
            color: #6a5e4e;
            min-width: 50px;
            text-align: center;
            font-family: 'Georgia', serif;
        }

        /* --- LOCK – bottom middle of book --- */
        .lock-area {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 30;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            background: rgba(10, 20, 35, 0.85);
            backdrop-filter: blur(8px);
            padding: 10px 24px 12px;
            border-radius: 40px 40px 28px 28px;
            border: 1px solid rgba(180, 215, 255, 0.2);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            pointer-events: auto;
        }

        .lock-icon {
            font-size: 1.6rem;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
            background: #4a7a9a;
            padding: 0 14px;
            border-radius: 20px;
            line-height: 1.2;
            box-shadow: inset 0 -2px 0 #1a3a5c;
            cursor: pointer;
            transition: 0.15s;
            color: #e8f0f8;
        }

        .lock-icon:hover {
            transform: scale(1.05);
        }

        .lock-btn {
            background: #4a7a9a;
            border: none;
            color: #e8f0f8;
            font-weight: 400;
            font-size: 0.7rem;
            padding: 5px 18px;
            border-radius: 20px;
            cursor: pointer;
            font-family: 'Georgia', serif;
            letter-spacing: 1px;
            text-transform: uppercase;
            transition: 0.12s;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 2px 0 #1a3a5c;
        }

        .lock-btn:active {
            transform: translateY(2px);
            box-shadow: 0 0px 0 #1a3a5c;
        }

        .lock-status {
            font-size: 0.5rem;
            font-weight: 400;
            color: #e8f0f8;
            background: #0a1e32;
            padding: 2px 12px;
            border-radius: 12px;
            border: 1px solid #3a6a8a;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-family: 'Georgia', serif;
        }

        /* --- PIN MODAL --- */
        .pin-modal {
            position: absolute;
            inset: 0;
            z-index: 50;
            background: rgba(10, 20, 35, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 16px 4px 4px 16px;
            padding: 2rem;
        }

        .pin-modal.hidden {
            display: none;
        }

        .pin-box {
            background: #f0ece6;
            padding: 2rem 2.2rem;
            border-radius: 24px;
            box-shadow: 0 30px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(180, 215, 255, 0.2);
            text-align: center;
            max-width: 340px;
            width: 100%;
            border: 1px solid #c6d0dc;
            font-family: 'Georgia', serif;
        }

        .pin-box h2 {
            color: #1a3a5c;
            font-family: 'Georgia', serif;
            font-weight: 400;
            letter-spacing: 1px;
            margin-bottom: 0.2rem;
            font-size: 1.4rem;
        }

        .pin-box p {
            color: #5a6a7a;
            font-size: 0.8rem;
            margin-bottom: 1rem;
            font-weight: 400;
            font-family: 'Georgia', serif;
        }

        .pin-input-group {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 1rem;
        }

        .pin-input-group input {
            width: 48px;
            height: 56px;
            text-align: center;
            font-size: 1.6rem;
            font-family: 'Georgia', serif;
            border: 1px solid #b0bcc8;
            border-radius: 12px;
            background: #ffffff;
            color: #1a3a5c;
            outline: none;
            transition: 0.15s;
            font-weight: 400;
        }

        .pin-input-group input:focus {
            border-color: #4a7a9a;
            box-shadow: 0 0 0 3px rgba(74, 122, 154, 0.15);
        }

        .pin-submit {
            background: #4a7a9a;
            border: none;
            color: #e8f0f8;
            font-weight: 400;
            font-size: 0.85rem;
            padding: 10px 20px;
            border-radius: 40px;
            cursor: pointer;
            font-family: 'Georgia', serif;
            letter-spacing: 1px;
            transition: 0.12s;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 3px 0 #1a3a5c;
            width: 100%;
        }

        .pin-submit:active {
            transform: translateY(3px);
            box-shadow: 0 0px 0 #1a3a5c;
        }

        .pin-error {
            color: #b55a4a;
            font-size: 0.75rem;
            margin-top: 0.4rem;
            min-height: 1.2rem;
            font-weight: 400;
            font-family: 'Georgia', serif;
        }

        /* --- OPENING STATES --- */
        .book.closed {
            transform: rotateY(-2deg) rotateX(1deg);
        }

        .book.closed .book-pages {
            transform: rotateY(-180deg);
            backface-visibility: hidden;
            box-shadow: inset 0 0 0 1px #c6b8a4, inset 0 0 40px rgba(0, 0, 0, 0.2);
        }

        .book.closed .book-cover-front {
            transform: rotateY(0deg);
            z-index: 10;
        }

        .book.closed .book-cover-back {
            transform: rotateY(180deg);
        }

        .book.open {
            transform: rotateY(8deg) rotateX(1deg);
        }

        .book.open .book-pages {
            transform: rotateY(0deg);
            backface-visibility: visible;
            box-shadow: inset 0 0 0 1px #d6cec0, inset 0 0 30px rgba(100, 80, 60, 0.06);
        }

        .book.open .book-cover-front {
            transform: rotateY(-180deg);
            z-index: 1;
        }

        .book.open .book-cover-back {
            transform: rotateY(0deg);
        }

        /* Opening animation */
        .book.opening {
            animation: openBook 0.9s cubic-bezier(0.4, 0.2, 0.2, 1) forwards;
        }

        @keyframes openBook {
            0% {
                transform: rotateY(-2deg) rotateX(1deg);
            }
            35% {
                transform: rotateY(5deg) rotateX(1deg) scale(0.98);
            }
            70% {
                transform: rotateY(10deg) rotateX(0.5deg) scale(1.01);
            }
            100% {
                transform: rotateY(8deg) rotateX(1deg) scale(1);
            }
        }

        .book.opening .book-pages {
            animation: pagesReveal 0.9s ease-in-out forwards;
        }

        @keyframes pagesReveal {
            0% {
                transform: rotateY(-180deg);
                opacity: 0;
            }
            25% {
                opacity: 0.2;
            }
            65% {
                opacity: 1;
            }
            100% {
                transform: rotateY(0deg);
                opacity: 1;
            }
        }

        .book.opening .book-cover-front {
            animation: coverFrontFlip 0.9s ease-in-out forwards;
        }

        @keyframes coverFrontFlip {
            0% {
                transform: rotateY(0deg);
                z-index: 10;
            }
            55% {
                z-index: 10;
            }
            100% {
                transform: rotateY(-180deg);
                z-index: 1;
            }
        }

        .book.opening .book-cover-back {
            animation: coverBackFlip 0.9s ease-in-out forwards;
        }

        @keyframes coverBackFlip {
            0% {
                transform: rotateY(180deg);
            }
            100% {
                transform: rotateY(0deg);
            }
        }

        /* --- RESPONSIVE --- */
        @media (max-width: 600px) {
            .book-wrapper {
                aspect-ratio: 4 / 3;
            }
            .lock-area {
                bottom: 14px;
                padding: 8px 16px 10px;
            }
            .lock-icon {
                font-size: 1.2rem;
            }
            .lock-btn {
                font-size: 0.6rem;
                padding: 4px 12px;
            }
            .book-pages {
                padding: 1.2rem 1.2rem;
            }
            .diary-entry {
                font-size: 0.9rem;
                padding: 0.5rem 0.7rem;
            }
            .diary-header {
                font-size: 0.65rem;
            }
            .page-nav button {
                font-size: 0.65rem;
                padding: 3px 12px;
            }
            .pin-box {
                padding: 1.2rem;
            }
            .pin-input-group input {
                width: 40px;
                height: 46px;
                font-size: 1.3rem;
            }
        }

        .diary-entry::-webkit-scrollbar {
            width: 4px;
        }
        .diary-entry::-webkit-scrollbar-track {
            background: #ece6dc;
            border-radius: 10px;
        }
        .diary-entry::-webkit-scrollbar-thumb {
            background: #c6b8a4;
            border-radius: 10px;
        }

        .user-name-display {
            font-size: 2rem;
            font-weight: 400;
            letter-spacing: 2px;
            border-bottom: 1px solid rgba(180, 215, 255, 0.2);
            padding-bottom: 6px;
            margin-bottom: 4px;
            font-family: 'Georgia', serif;
        }
        .cover-sub {
            font-size: 0.8rem;
            opacity: 0.5;
            font-weight: 300;
            letter-spacing: 4px;
            font-family: 'Georgia', serif;
        }

        /* Toast */
        .toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #0a1e32;
            color: #e8f0f8;
            padding: 10px 28px;
            border-radius: 40px;
            font-family: 'Georgia', serif;
            font-size: 0.85rem;
            font-weight: 400;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            border: 1px solid #3a6a8a;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 999;
            pointer-events: none;
            white-space: nowrap;
            letter-spacing: 0.3px;
        }

        .toast.show {
            opacity: 1;
        }

        .edit-hint {
            font-size: 0.65rem;
            color: #a0907a;
            font-weight: 400;
            letter-spacing: 0.5px;
            opacity: 0.6;
            font-family: 'Georgia', serif;
        }

        /* Time input styling */
        #timeInput {
            outline: none;
            border-bottom: 1px dashed #7a6e5e;
            min-width: 60px;
            display: inline-block;
            font-family: 'Georgia', serif;
        }
        #timeInput:focus {
            border-bottom-color: #4a7a9a;
        }
    </style>
</head>
<body>

    <!-- Toast -->
    <div class="toast" id="toast"></div>

    <div class="book-wrapper">
        <div class="book closed" id="diaryBook">

            <!-- COVER FRONT -->
            <div class="book-cover book-cover-front">
                <div style="font-size: 3rem; margin-bottom: 0.2rem;">📘</div>
                <div class="user-name-display" id="coverUserName">—</div>
                <div style="font-size: 1.6rem; letter-spacing: 8px; font-weight: 300; color: #8ab4d0; font-family: 'Georgia', serif;">diary</div>
                <div class="cover-sub">· private ·</div>
                <div style="margin-top: 14px; font-size: 0.65rem; border-top: 1px solid rgba(180,215,255,0.15); padding-top: 10px; width: 50%; letter-spacing: 2px; opacity: 0.4; font-family: 'Georgia', serif;">✦ locked pages ✦</div>
            </div>

            <!-- COVER BACK -->
            <div class="book-cover book-cover-back"></div>
            <div class="book-spine"></div>

            <!-- PAGES -->
            <div class="book-pages" id="bookPages">
                <div class="page-content">
                    <div class="diary-header">
                        <span id="pageDate">📅 22 July 2026</span>
                        <span id="pageTime">✎ <span contenteditable="true" id="timeInput">late night</span></span>
                    </div>
                    <div class="diary-entry" id="diaryEntry" contenteditable="false" spellcheck="true">
                        <p>Dear Diary,</p>
                        <p>Today I finally opened the lock. The rain outside sounds like an old song, and I'm sitting at my desk, turning the pages of this book that holds so many nights.</p>
                        <p>The last time I wrote was in spring. The ginkgo leaves were just sprouting then — now they're a deep, vivid green. Time is strange: it fades some things, but deepens others.</p>
                        <p>I've decided to write more often, to capture these small, fleeting thoughts. Because some words are only for you.</p>
                        <p style="margin-top: 0.6rem;">— Goodnight, world.</p>
                    </div>
                    <div class="diary-footer">
                        <span class="edit-hint">🔒 sample page</span>
                        <div class="page-nav">
                            <button id="prevPage" disabled>◀ prev</button>
                            <span class="page-indicator" id="pageIndicator">1 / <span id="totalPages">1</span></span>
                            <button id="nextPage">+ new page ▶</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- LOCK - bottom middle -->
            <div class="lock-area">
                <div class="lock-icon" id="lockIcon">🔒</div>
                <button class="lock-btn" id="lockToggle">unlock</button>
                <span class="lock-status" id="lockStatus">locked</span>
            </div>

            <!-- PIN MODAL -->
            <div class="pin-modal" id="pinModal">
                <div class="pin-box">
                    <h2>🔐 set PIN</h2>
                    <p>4-digit code for your diary</p>
                    <div class="pin-input-group">
                        <input type="password" maxlength="1" class="pin-digit" data-index="0" />
                        <input type="password" maxlength="1" class="pin-digit" data-index="1" />
                        <input type="password" maxlength="1" class="pin-digit" data-index="2" />
                        <input type="password" maxlength="1" class="pin-digit" data-index="3" />
                    </div>
                    <button class="pin-submit" id="pinSubmit">set PIN &amp; open</button>
                    <div class="pin-error" id="pinError"></div>
                </div>
            </div>

        </div>
    </div>

    <script>
        (function() {
            "use strict";

            // DOM refs
            const book = document.getElementById('diaryBook');
            const lockIcon = document.getElementById('lockIcon');
            const lockStatus = document.getElementById('lockStatus');
            const toggleBtn = document.getElementById('lockToggle');
            const pinModal = document.getElementById('pinModal');
            const pinInputs = document.querySelectorAll('.pin-digit');
            const pinSubmit = document.getElementById('pinSubmit');
            const pinError = document.getElementById('pinError');
            const coverUserName = document.getElementById('coverUserName');

            const pageDate = document.getElementById('pageDate');
            const pageTime = document.getElementById('pageTime');
            const timeInput = document.getElementById('timeInput');
            const diaryEntry = document.getElementById('diaryEntry');
            const pageIndicator = document.getElementById('pageIndicator');
            const totalPagesSpan = document.getElementById('totalPages');
            const prevBtn = document.getElementById('prevPage');
            const nextBtn = document.getElementById('nextPage');
            const editHint = document.querySelector('.edit-hint');

            // DATA: Pages array - starts with sample page
            const pages = [];

            // Sample page - page 0 with the provided entry
            pages.push({
                date: '📅 22 July 2026',
                time: 'late night',
                content: `<p>Dear Diary,</p><p>Today I finally opened the lock. The rain outside sounds like an old song, and I'm sitting at my desk, turning the pages of this book that holds so many nights.</p><p>The last time I wrote was in spring. The ginkgo leaves were just sprouting then — now they're a deep, vivid green. Time is strange: it fades some things, but deepens others.</p><p>I've decided to write more often, to capture these small, fleeting thoughts. Because some words are only for you.</p><p style="margin-top: 0.6rem;">— Goodnight, world.</p>`,
                editable: false
            });

            // State
            let currentPage = 0;
            let isLocked = true;
            let pin = null;
            let isOpening = false;

            // Toast
            function showToast(msg) {
                const el = document.getElementById('toast');
                el.textContent = msg;
                el.classList.add('show');
                clearTimeout(el._timer);
                el._timer = setTimeout(() => el.classList.remove('show'), 2200);
            }

            // Save current entry content to pages array
            function saveCurrentEntry() {
                if (!isLocked && pages[currentPage] && pages[currentPage].editable) {
                    pages[currentPage].content = diaryEntry.innerHTML;
                    pages[currentPage].time = timeInput.textContent.trim() || 'entry';
                }
            }

            // Add new blank page
            function addNewPage() {
                const pageNum = pages.length + 1;
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                pages.push({
                    date: `📅 ${dateStr}`,
                    time: 'entry',
                    content: `<p style="color: #9a8a7a; font-style: italic;">— write your thoughts here —</p>`,
                    editable: true
                });
                updateTotalPages();
                return pages.length - 1;
            }

            // Update total pages display
            function updateTotalPages() {
                totalPagesSpan.textContent = pages.length;
            }

            // Render page
            function renderPage(index) {
                if (index >= pages.length) {
                    // If we're beyond the last page, add a new one
                    index = addNewPage();
                }
                const p = pages[index];
                pageDate.textContent = p.date;
                timeInput.textContent = p.time || 'entry';
                diaryEntry.innerHTML = p.content;
                pageIndicator.textContent = `${index + 1} / ${pages.length}`;
                prevBtn.disabled = index === 0;
                nextBtn.textContent = index === pages.length - 1 ? '+ new page ▶' : 'next ▶';

                // Set editable state
                if (!isLocked && p.editable) {
                    diaryEntry.contentEditable = 'true';
                    timeInput.contentEditable = 'true';
                    editHint.textContent = '✎ click to edit';
                    diaryEntry.style.borderLeftColor = '#4a7a9a';
                } else {
                    diaryEntry.contentEditable = 'false';
                    timeInput.contentEditable = 'false';
                    if (!p.editable) {
                        editHint.textContent = '🔒 sample page';
                    } else {
                        editHint.textContent = '🔒 locked';
                    }
                    diaryEntry.style.borderLeftColor = '#c6b8a4';
                }

                currentPage = index;
            }

            function updateUI() {
                if (isLocked) {
                    book.classList.remove('open');
                    book.classList.add('closed');
                    lockIcon.textContent = '🔒';
                    lockStatus.textContent = 'locked';
                    toggleBtn.textContent = 'unlock';
                    diaryEntry.contentEditable = 'false';
                    timeInput.contentEditable = 'false';
                    if (currentPage < pages.length && !pages[currentPage].editable) {
                        editHint.textContent = '🔒 sample page';
                    } else {
                        editHint.textContent = '🔒 locked';
                    }
                    diaryEntry.style.borderLeftColor = '#c6b8a4';
                } else {
                    book.classList.remove('closed');
                    book.classList.add('open');
                    lockIcon.textContent = '🔓';
                    lockStatus.textContent = 'unlocked';
                    toggleBtn.textContent = 'lock';
                    if (currentPage < pages.length && pages[currentPage].editable) {
                        diaryEntry.contentEditable = 'true';
                        timeInput.contentEditable = 'true';
                        editHint.textContent = '✎ click to edit';
                        diaryEntry.style.borderLeftColor = '#4a7a9a';
                    }
                }
            }

            // Open book with animation
            function openBookWithAnimation() {
                if (isOpening) return;
                isOpening = true;
                book.classList.add('opening');
                setTimeout(() => {
                    book.classList.remove('opening');
                    book.classList.remove('closed');
                    book.classList.add('open');
                    isOpening = false;
                    updateUI();
                }, 900);
            }

            function navigatePage(direction) {
                if (isLocked) return;
                // Save current before navigating
                saveCurrentEntry();
                let newIndex = currentPage + direction;

                // If going forward beyond last page, add new page
                if (newIndex >= pages.length) {
                    newIndex = addNewPage();
                }

                if (newIndex < 0 || newIndex >= pages.length) return;
                renderPage(newIndex);
                updateUI();
            }

            // Lock toggle
            function toggleLock() {
                if (isLocked) {
                    if (!pin) {
                        pinModal.classList.remove('hidden');
                        return;
                    }
                    // Unlock
                    isLocked = false;
                    openBookWithAnimation();
                    setTimeout(() => {
                        showToast('🔓 Diary unlocked · you can edit');
                    }, 500);
                } else {
                    // Lock
                    saveCurrentEntry();
                    isLocked = true;
                    book.classList.remove('open');
                    book.classList.add('closed');
                    updateUI();
                    showToast('🔒 Diary locked');
                }
            }

            // PIN setup
            function setupPin() {
                let code = '';
                pinInputs.forEach(inp => {
                    const val = inp.value.trim();
                    if (val.length === 1 && /[0-9]/.test(val)) {
                        code += val;
                    } else {
                        code = '';
                    }
                });

                if (code.length !== 4) {
                    pinError.textContent = '❌ enter exactly 4 digits';
                    return;
                }

                const name = prompt('📖 Your name for the cover:', 'Alex');
                if (name && name.trim().length > 0) {
                    coverUserName.textContent = name.trim();
                } else {
                    coverUserName.textContent = '—';
                }

                pin = code;
                pinModal.classList.add('hidden');
                pinError.textContent = '';
                pinInputs.forEach(inp => inp.value = '');

                // Unlock and open
                isLocked = false;
                openBookWithAnimation();
                setTimeout(() => {
                    showToast('🔓 PIN set · diary open for editing');
                }, 500);
            }

            // PIN input auto-focus
            pinInputs.forEach((inp, idx) => {
                inp.addEventListener('input', function() {
                    if (this.value.length === 1 && idx < 3) {
                        pinInputs[idx + 1].focus();
                    }
                });
                inp.addEventListener('keydown', function(e) {
                    if (e.key === 'Backspace' && this.value === '' && idx > 0) {
                        pinInputs[idx - 1].focus();
                    }
                    if (e.key === 'Enter') {
                        pinSubmit.click();
                    }
                });
            });

            // Events
            toggleBtn.addEventListener('click', toggleLock);
            lockIcon.addEventListener('click', toggleLock);
            pinSubmit.addEventListener('click', setupPin);

            prevBtn.addEventListener('click', () => navigatePage(-1));
            nextBtn.addEventListener('click', () => navigatePage(1));

            // Save entry when content changes (debounced)
            let saveTimeout;
            diaryEntry.addEventListener('input', function() {
                if (isLocked || !pages[currentPage] || !pages[currentPage].editable) return;
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    saveCurrentEntry();
                    editHint.textContent = '✓ saved';
                    setTimeout(() => {
                        if (!isLocked && pages[currentPage] && pages[currentPage].editable) {
                            editHint.textContent = '✎ click to edit';
                        }
                    }, 800);
                }, 300);
            });

            // Save time when changed
            timeInput.addEventListener('input', function() {
                if (!isLocked && pages[currentPage] && pages[currentPage].editable) {
                    saveCurrentEntry();
                }
            });

            // Also save on blur
            diaryEntry.addEventListener('blur', function() {
                if (!isLocked && pages[currentPage] && pages[currentPage].editable) {
                    saveCurrentEntry();
                }
            });

            // Prevent selection on book, but allow text selection in diary entry
            book.addEventListener('mousedown', (e) => {
                if (e.target.closest('.lock-area') || e.target.closest('.pin-modal')) return;
                if (e.target.closest('.page-nav')) return;
                if (e.target.closest('.diary-entry') || e.target.closest('#timeInput')) return;
                e.preventDefault();
            });

            // Init
            updateTotalPages();
            renderPage(0);
            updateUI();
            pinModal.classList.remove('hidden');
            showToast('🔐 set your PIN to unlock & write');

        })();
    </script>
</body>
</html>