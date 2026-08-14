## v1 - 2026-08-11
- Tightened R2 (Recency): now explicitly requires that any formal citation
  of an Income-tax Act section confirm and name the Income-tax Act, 2025
  equivalent, not just the 1961 section. Evidence: c4f6ba15 (backfilled,
  Schedule FA / Section 139(1) miss), 48e48cfb (P2P Lending Bad-Debt piece,
  Section 56/57/36 cited with no 2025 Act check).
- Added R7 (Primary Source Floor): a dossier making a formal statutory
  claim must ground at least one such claim in a primary source beyond a
  bare section number - case law, a circular, or a named regulatory
  document. Evidence: 48e48cfb (P2P piece cited zero primary sources
  despite ChatGPT's comparison piece finding several in the same
  research pass, e.g. CIT v. Byramjee Jeejeebhoy).
- Added M13 (Statutory Currency Preserved): the draft must retain, in
  reader-friendly language, any 2025 Act equivalent the dossier
  identified under R2 - prevents the simplification pass from silently
  dropping exactly the fact that mattered.
- Regression set: added 2 new cases (p2p_stale_act_no_primary_source_should_fail,
  p2p_current_act_with_case_law_should_pass). First draft of the R2 check
  caused a real regression on bma_causal_arc_should_pass (false-matched a
  Black Money Act section number as an Income-tax Act citation) - caught
  by the gate, corrected to require a formal citation pattern, re-tested
  clean on all 4 cases.
- Proposal prop_r2_tighten_r7_m13_add: approved.
