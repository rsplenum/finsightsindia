# Sketches — the drop folder

Rahul asked how to hand over a drawing "without interrupting the flow of work".
This is the answer. Put the image here and carry on; nothing has to happen at
the moment you drop it.

## How to use it

Save the photo into this folder with a name that says what it is and when:

    tax-calculator-form_2026-08-16.jpg
    insurance-answer-layout_2026-08-17.jpg

That is the whole protocol. The next session reads this folder as part of the
launch gate and picks up anything it has not seen. If a sketch is urgent, add a
line to `docs/launch-gate.md` pointing at the filename — one line, the same as
any other gate item.

## Why a folder and not just chat

A drawing pasted into a conversation dies with the conversation, which is the
exact failure `CLAUDE.md`'s "Nothing Important Lives Only In Chat" exists to
prevent. A sketch is a design decision in its most compressed form, and it is
usually the *origin* of a decision rather than a note about one — losing it
means re-deriving the intent from whatever got built.

## The rule that matters

**A sketch is read back before it is built from.** A drawing is compressed and
handwriting is ambiguous; the reading has to be stated in words and confirmed
before code is written. The tax-calculator sketch had two ambiguities that
changed the build — whether the category filtered the dropdowns, and whether
the dropdowns replaced the existing chips — and both were resolved by asking
rather than by guessing. One answer became dd-020.

Transcribe, state the reading, confirm the ambiguous parts, then build.
