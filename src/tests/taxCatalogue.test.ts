import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import {
  CATEGORIES,
  DEDUCTIONS,
  INCOME_SOURCES,
  PENDING_ENTRIES,
  chapterVIASectionOf,
  deductionsFor,
  incomeBlocksFor,
  incomeSourcesFor,
  regimesForDeduction,
  splitByVisibility,
  whyExcluded,
  type CatalogueEntry,
} from '../utils/taxCatalogue';
import { CHAPTER_VIA_RULES, EMPTY_TAX_INPUT, type TaxInput } from '../utils/tax';
import { DEFAULT_CHOICES, buildTaxInput } from '../utils/taxInputs';

/**
 * sol-059 — the catalogue, and the three things that make it safe to grow.
 *
 * It exists because Rahul's sheet 2 asks for dropdowns that are EXHAUSTIVE
 * within what a category is eligible for, and because the category filter must
 * remove only what the statute forbids. Both of those are claims about data, so
 * both can be tested rather than reviewed.
 *
 * The third is the one the first draft of the catalogue did not have. Every
 * offered option must have somewhere for its rupees to GO. An option with no
 * field behind it is a box the reader fills in and a bill that does not move,
 * and this file's whole ledger says that is the defect nobody catches by
 * looking.
 */

const ALL: CatalogueEntry[] = [...INCOME_SOURCES, ...DEDUCTIONS];

/** Walk a dotted path against the engine's own empty input. */
const resolves = (path: string): boolean => {
  const section = path.startsWith('chapterVIA.') ? path.slice('chapterVIA.'.length) : null;
  if (section) return section in CHAPTER_VIA_RULES;

  let node: unknown = EMPTY_TAX_INPUT;
  for (const key of path.split('.')) {
    if (typeof node !== 'object' || node === null || !(key in node)) return false;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === 'number';
};

describe('sol-059 — the catalogue is well-formed', () => {
  it('the harvest is real (guards the guard)', () => {
    expect(INCOME_SOURCES.length).toBeGreaterThan(15);
    expect(DEDUCTIONS.length).toBeGreaterThan(12);
    expect(CATEGORIES.length).toBeGreaterThan(3);
    // The path walker must be capable of saying no, or every assertion below
    // passes for all inputs.
    expect(resolves('capitalGains.stcg111A')).toBe(true);
    expect(resolves('chapterVIA.80C')).toBe(true);
    expect(resolves('capitalGains.notAField')).toBe(false);
    expect(resolves('chapterVIA.80ZZZ')).toBe(false);
    expect(resolves('houseProperty')).toBe(false); // an object is not a figure
  });

  it('every id is unique across the whole catalogue', () => {
    const ids = ALL.map((e) => e.id);
    expect(new Set(ids).size, `duplicate id in the catalogue: ${ids}`).toBe(ids.length);
  });

  it('every entry gives the reader something to act on', () => {
    for (const e of ALL) {
      expect(e.label.length, `${e.id} has no label`).toBeGreaterThan(2);
      expect(e.hint.length, `${e.id} has no hint`).toBeGreaterThan(20);
    }
  });
});

describe('sol-059 / sol-041 — every offered option has somewhere for its rupees to go', () => {
  it('an offered entry names a target the engine actually reads', () => {
    const broken: string[] = [];
    for (const e of ALL) {
      if (e.pending || e.automatic) continue;
      if (!e.target) broken.push(`${e.id}: no target at all`);
      else if (!resolves(e.target)) broken.push(`${e.id}: target '${e.target}' is not a field on TaxInput`);
    }
    expect(
      broken,
      'These would render a box the reader fills in and a bill that does not ' +
      'move — sol-041, on a tax form:\n  ' + broken.join('\n  ')
    ).toEqual([]);
  });

  it('an entry is offered, automatic, or pending — never two of those, never none', () => {
    for (const e of ALL) {
      const states = [Boolean(e.target), Boolean(e.automatic), Boolean(e.pending)].filter(Boolean);
      expect(states.length, `${e.id} is in ${states.length} states at once`).toBe(1);
    }
  });

  it('a pending entry says what is missing, and is never offered', () => {
    for (const e of PENDING_ENTRIES) {
      expect(e.pending!.length, `${e.id} is pending with no reason`).toBeGreaterThan(40);
    }
    const offeredIds = CATEGORIES.flatMap((c) => [
      ...incomeSourcesFor(c.id).map((x) => x.id),
      ...deductionsFor(c.id, 'old').map((x) => x.id),
      ...deductionsFor(c.id, 'new').map((x) => x.id),
    ]);
    for (const e of PENDING_ENTRIES) expect(offeredIds).not.toContain(e.id);
  });

  it('the pending queue only ever shrinks', () => {
    // Two today: s.115BBH on virtual digital assets and s.115BB on winnings.
    // Both are flat rates that take no share of the basic exemption, so neither
    // can ride on the capital-gains path, which does. Tighten this when one lands.
    expect(
      PENDING_ENTRIES.map((e) => e.id).sort(),
      'The queue of things the engine cannot price must not grow. Adding an ' +
      'option the engine cannot price is the fault this file exists to prevent.'
    ).toEqual(['vda', 'winnings']);
  });

  it('two entries sharing a target is fine, and is how a head takes a total', () => {
    // F&O profit, intraday profit and a shop's profit are all business income
    // and `business.netProfit` takes their sum. This is asserted rather than
    // left implicit because the form MUST sum them; whichever-writes-last would
    // silently drop the others.
    const sharing = INCOME_SOURCES.filter((s) => s.target === 'business.netProfit');
    expect(sharing.length).toBeGreaterThan(2);
  });
});

/**
 * Block (2) on Rahul's sheet — "only those that can't be clubbed in dropdown-1".
 *
 * The claim a block heading makes has to be true of the arithmetic underneath
 * it, and there is one mechanical way to check that: a source whose `target` is
 * shared with another source IS clubbed, because the form sums every active
 * field aimed at one target. So "cannot be clubbed" and "shares a target" are
 * contradictories, and the test below is what decided the F&O case rather than
 * anybody's taste for where it looked better.
 */
describe('the third input block — what cannot be clubbed, and why', () => {
  it('an unclubbable source says what the arithmetic would lose', () => {
    for (const s of INCOME_SOURCES) {
      if (!s.unclubbable) continue;
      expect(
        s.unclubbable.length,
        `${s.id} is kept out of the ordinary income block without saying what ` +
        'summing it would destroy. The reason is the whole content of the claim.'
      ).toBeGreaterThan(40);
    }
  });

  it('nothing claims to be unclubbable while sharing a target with another source', () => {
    const byTarget = new Map<string, string[]>();
    for (const s of INCOME_SOURCES) {
      if (!s.target) continue;
      byTarget.set(s.target, [...(byTarget.get(s.target) ?? []), s.id]);
    }
    const lying = INCOME_SOURCES.filter(
      (s) => s.unclubbable && (byTarget.get(s.target ?? '') ?? []).length > 1
    ).map((s) => `${s.id} -> ${s.target}`);
    expect(
      lying,
      'These sit under a heading that says they cannot be added to the other ' +
      'figures, and the form adds them to another source anyway:\n  ' + lying.join('\n  ')
    ).toEqual([]);
  });

  it('every capital gain is in the separate block, and F&O is not', () => {
    // The direction that matters: four buckets by rate, and summing them would
    // destroy the rate, which is the only thing the arithmetic cares about.
    for (const s of INCOME_SOURCES) {
      if (s.head !== 'capitalGains' || s.pending) continue;
      expect(s.unclubbable, `${s.id} is a capital gain and must be kept apart`).toBeTruthy();
    }
    // And the one Rahul's sheet names that this build does NOT put there. The
    // engine sees one business profit, so the block heading would be a promise
    // it does not keep. Recorded on the launch gate rather than smoothed over.
    const fo = INCOME_SOURCES.find((s) => s.id === 'futuresOptions')!;
    expect(fo.unclubbable).toBeUndefined();
  });

  it('both blocks are non-empty for every category', () => {
    for (const c of CATEGORIES) {
      const { clubbable, separate } = incomeBlocksFor(c.id);
      expect(clubbable.length, `${c.id} has no ordinary income sources`).toBeGreaterThan(3);
      expect(separate.length, `${c.id} has an empty second block`).toBeGreaterThan(0);
      expect(clubbable.length + separate.length).toBe(incomeSourcesFor(c.id).length);
    }
  });
});

/**
 * The other half of sol-041's rule, and the half that was still checked by
 * reading. sol-059's test proves every offered option names a target that
 * RESOLVES against `TaxInput`. It cannot prove the reader delivers to it — a
 * target could be spelled correctly and still be dropped on the floor by an
 * assembly step that forgot the line. That is the same defect the catalogue
 * exists to prevent, one layer down.
 */
describe('sol-061 — every target the catalogue names actually reaches the engine', () => {
  const at = (input: TaxInput, path: string): unknown => {
    if (path.startsWith('chapterVIA.')) {
      return input.chapterVIA[path.slice('chapterVIA.'.length) as keyof typeof input.chapterVIA];
    }
    let node: unknown = input;
    for (const key of path.split('.')) node = (node as Record<string, unknown>)[key];
    return node;
  };

  it('a rupee placed on any target arrives at the field it names', () => {
    const lost: string[] = [];
    for (const e of ALL) {
      if (!e.target) continue;
      const built = buildTaxInput(new Map([[e.target, 12345]]), DEFAULT_CHOICES);
      if (at(built, e.target) !== 12345) lost.push(`${e.id} -> ${e.target}`);
    }
    expect(
      lost,
      'A box the reader fills in and a bill that does not move — the target is ' +
      'named and the reader never carries it:\n  ' + lost.join('\n  ')
    ).toEqual([]);
  });

  it('a section is claimed only when a field for it was activated', () => {
    // The move from PRESENCE to `data-active`. Every eligible field is now on
    // the page from the start, so presence means nothing; a section merely
    // rendered must not read as claimed.
    expect(buildTaxInput(new Map(), DEFAULT_CHOICES).chapterVIA).toEqual({});
    // And a section activated but left empty IS claimed, as nothing. Same
    // rupees as never claiming it, and a different sentence on the panel.
    expect(buildTaxInput(new Map([['chapterVIA.80C', 0]]), DEFAULT_CHOICES).chapterVIA)
      .toEqual({ '80C': 0 });
  });

  it('the kind of property follows from what was declared, not from a fourth question', () => {
    const kind = (m: Map<string, number>) => buildTaxInput(m, DEFAULT_CHOICES).houseProperty.kind;
    expect(kind(new Map())).toBe('none');
    expect(kind(new Map([['houseProperty.interest', 200000]]))).toBe('selfOccupied');
    expect(kind(new Map([['houseProperty.annualRent', 300000]]))).toBe('letOut');
    // Municipal tax belongs to a let-out property and to nothing else, so
    // declaring it alone must not leave the figure sitting on a property the
    // engine thinks does not exist.
    expect(kind(new Map([['houseProperty.municipalTaxes', 8000]]))).toBe('letOut');
    // AND AN EMPTY RENT FIELD IS NOT A DECLARATION. Rent is one of the few
    // fields permanently on screen, so it is active for every reader; keying
    // off the field rather than the figure turned everyone with a home loan
    // into a landlord, and a let-out property's interest is uncapped where a
    // home you live in is capped at Rs 2 lakh.
    expect(
      kind(new Map([['houseProperty.annualRent', 0], ['houseProperty.interest', 250000]]))
    ).toBe('selfOccupied');
  });
});

describe('dd-020 — a category removes only what the statute forbids', () => {
  it('every exclusion names a provision, and names it at length', () => {
    for (const e of ALL) {
      for (const x of e.excluded ?? []) {
        expect(
          x.statute.length,
          `${e.id} excludes '${x.category}' without saying which provision forbids it. ` +
          'dd-020: is this removed because the statute forbids it, or because we guessed?'
        ).toBeGreaterThan(40);
        expect(
          CATEGORIES.map((c) => c.id),
          `${e.id} excludes '${x.category}', which is not a category`
        ).toContain(x.category);
      }
    }
  });

  it('a salaried filer is not offered 44AD or 44ADA, and is told why', () => {
    const offered = incomeSourcesFor('salaried').map((s) => s.id);
    expect(offered).not.toContain('presumptive44AD');
    expect(offered).not.toContain('presumptive44ADA');
    expect(whyExcluded('presumptive44AD', 'salaried')).toContain('44AD');
  });

  it('a salaried filer IS offered futures and options', () => {
    // dd-020's own example, and the whole point of the rule. Uncommon for a
    // salaried filer, entirely lawful, and hiding it would mean the reader it
    // fits never learns it was there.
    expect(incomeSourcesFor('salaried').map((s) => s.id)).toContain('futuresOptions');
  });

  it('a professional gets 44ADA and not 44AD; a business gets the reverse', () => {
    expect(incomeSourcesFor('professional').map((s) => s.id)).toContain('presumptive44ADA');
    expect(incomeSourcesFor('professional').map((s) => s.id)).not.toContain('presumptive44AD');
    expect(incomeSourcesFor('business').map((s) => s.id)).toContain('presumptive44AD');
    expect(incomeSourcesFor('business').map((s) => s.id)).not.toContain('presumptive44ADA');
  });

  it('every category is offered capital gains and every head it can have', () => {
    // The failure this guards against is a category quietly losing a whole head
    // because an exclusion was written one line too broadly.
    for (const c of CATEGORIES) {
      const heads = new Set(incomeSourcesFor(c.id).map((s) => s.head));
      expect(heads.has('capitalGains'), `${c.id} cannot declare a capital gain`).toBe(true);
      expect(heads.has('otherSources'), `${c.id} cannot declare interest`).toBe(true);
      expect(heads.has('businessProfession'), `${c.id} cannot declare F&O`).toBe(true);
      expect(heads.has('houseProperty'), `${c.id} cannot declare rent`).toBe(true);
    }
  });

  it('nothing is excluded from every category at once', () => {
    // An option no category can choose is not an eligibility rule, it is a
    // deletion wearing one — dd-001/dont-1.
    for (const e of ALL) {
      expect(
        (e.excluded ?? []).length,
        `${e.id} is excluded from every category, so nobody can ever choose it`
      ).toBeLessThan(CATEGORIES.length);
    }
  });
});

describe('dd-020/dont-3 — a category filter never changes a computed answer', () => {
  it('the engine has no notion of a category at all', () => {
    expect('category' in EMPTY_TAX_INPUT).toBe(false);
    const engine = fs.readFileSync('src/utils/tax.ts', 'utf8');
    // The strongest form of the rule: the engine cannot consult a thing it
    // cannot import. Same facts, same tax, whatever category is chosen.
    expect(engine).not.toMatch(/from ['"]\.\/taxCatalogue['"]/);
  });

  it('the catalogue holds no arithmetic of its own', () => {
    const src = fs
      .readFileSync('src/utils/taxCatalogue.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''");
    // A rate or a ceiling living here would be sol-038's shape: the same rule in
    // the catalogue and the engine, drifting apart at the next Budget.
    expect(src).not.toMatch(/[*/]\s*0\.\d/);
    expect(src).not.toMatch(/\b\d{4,}\b/);
  });
});

describe('dd-001/do-3 — exhaustive within the eligible set', () => {
  it('what is visible plus what is in the dropdown IS everything eligible', () => {
    // "Only the most common options should be permanently visible" is answered
    // by what stays on screen, never by what exists. `common` may hide an option
    // from the surface; it may never remove one.
    for (const c of CATEGORIES) {
      for (const regime of ['old', 'new'] as const) {
        const eligible = [...incomeSourcesFor(c.id), ...deductionsFor(c.id, regime)];
        const split = splitByVisibility(eligible);
        expect(split.visible.length + split.inDropdown.length).toBe(eligible.length);
        expect(split.visible.length, `${c.id}/${regime} has nothing permanently visible`)
          .toBeGreaterThan(0);
        expect(split.inDropdown.length, `${c.id}/${regime} has an empty dropdown`)
          .toBeGreaterThan(0);
      }
    }
  });

  it('every category can still declare the great majority of sources', () => {
    for (const c of CATEGORIES) {
      const offered = incomeSourcesFor(c.id).length;
      const offerable = INCOME_SOURCES.filter((s) => !s.pending).length;
      expect(offered / offerable, `${c.id} has been filtered down to a shortlist`)
        .toBeGreaterThan(0.75);
    }
  });
});

describe('sol-059 — the catalogue never restates a rule the engine owns', () => {
  it('a Chapter VI-A entry takes its regimes from the engine, not from itself', () => {
    for (const d of DEDUCTIONS) {
      const section = chapterVIASectionOf(d);
      if (!section) continue;
      expect(
        d.regimes,
        `${d.id} declares its own regimes AND targets ${section}. That is one ` +
        'rule in two places, and a Budget will pull them apart.'
      ).toBeUndefined();
      expect(regimesForDeduction(d)).toEqual(CHAPTER_VIA_RULES[section].regimes);
    }
  });

  it('every Chapter VI-A section the engine prices is offered by the catalogue', () => {
    // The other direction, and the one that matters for exhaustiveness: an
    // engine that can price 80GG while no dropdown offers it is a capability
    // the reader cannot reach — dd-001/dont-1.
    const targeted = new Set(
      DEDUCTIONS.map(chapterVIASectionOf).filter(Boolean) as string[]
    );
    for (const section of Object.keys(CHAPTER_VIA_RULES)) {
      expect(targeted, `the engine prices ${section} and no deduction offers it`)
        .toContain(section);
    }
  });

  it('the new regime leaves exactly one deduction standing, for a salaried filer', () => {
    const newRegime = deductionsFor('salaried', 'new').map((d) => d.id);
    // The standard deduction is automatic and municipal tax belongs to a let-out
    // property, so what a salaried reader can still CLAIM is 80CCD(2) alone.
    expect(newRegime).toContain('sec80ccd2');
    expect(newRegime).not.toContain('sec80c');
    expect(newRegime).not.toContain('homeLoanInterest');
    expect(deductionsFor('salaried', 'old').length).toBeGreaterThan(newRegime.length + 5);
  });
});
