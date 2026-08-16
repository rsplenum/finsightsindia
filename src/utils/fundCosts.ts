/**
 * What the fund itself takes, before the market has done anything.
 *
 * Until now both engines assumed a fund that costs nothing to own. That is not
 * a conservative assumption or a simplification - it is a figure of zero, typed
 * in by omission, on the one cost that is certain. Growth is uncertain,
 * inflation is uncertain, the crash is uncertain; the expense ratio is charged
 * every single year whatever happens, and it was the only one missing.
 *
 * This is sol-028's fault a third time, and the fix is the same shape: named
 * things a reader chooses, not a number they inherit.
 *
 * HONESTY NOTE, and it matters. Unlike REGIME_PRESETS, these are NOT computed
 * from a series in this repository, because there is no such series here. They
 * are typical published expense ratios for Indian equity schemes, and they are
 * stated as typical rather than dressed up as measured - the same treatment the
 * debt and gold assumptions get, and for the same reason: inventing a data
 * source would be a fabricated figure wearing a factual label. The regulatory
 * ceiling below IS a fact and is cited as one.
 *
 * The spread between the first and last of these is the single most valuable
 * thing on the fee control. Over a long horizon the gap between a direct index
 * fund and a regular plan bought through a distributor is not a rounding
 * difference - it is years of someone's saving - and almost nobody is told this
 * at the point of buying.
 */

export interface FundCostPlan {
  id: string;
  label: string;
  /** Annual expense ratio, % of the balance, charged whatever the market does. */
  expenseRatio: number;
  /** What this actually is, in the reader's words. */
  note: string;
}

/**
 * SEBI's ceiling for an equity scheme: 2.25% of the first Rs 500 crore of
 * assets, tapering as the scheme grows. A regulatory fact, not an assumption -
 * quoted so the reader can see that the worst plan below is not the worst that
 * is legal.
 */
export const SEBI_EQUITY_TER_CAP = 2.25;

export const FUND_COST_PLANS: FundCostPlan[] = [
  {
    id: 'index-direct',
    label: 'Index fund, bought direct',
    expenseRatio: 0.2,
    note: 'Tracks the index, no manager picking stocks, bought from the fund house with no distributor in between.',
  },
  {
    id: 'active-direct',
    label: 'Active fund, bought direct',
    expenseRatio: 0.8,
    note: 'A manager picks the stocks. Bought from the fund house, so you pay for the management and nothing else.',
  },
  {
    id: 'active-regular',
    label: 'Active fund, through a distributor',
    expenseRatio: 1.75,
    note: 'The same fund, bought through a bank, an app or an agent. The extra is their commission, taken from your balance every year for as long as you hold it.',
  },
];

/**
 * What the page opens on: THE INDEX FUND, because the growth assumption is the
 * index's own record.
 *
 * This reverses the first answer, and the reason it was wrong is worth keeping.
 * I defaulted to the dearest plan on the argument that a flattering default is
 * how sol-028's calm decade survived unexamined. That argument is about not
 * choosing the comfortable number - it is not a licence to pair two assumptions
 * that describe different worlds.
 *
 * Rahul, 16 Aug: "why the fees default to 1.75%, we are using the nifty cagr
 * and charging fees for a managed fund that may have a different cagr."
 *
 * He is right, and it is sol-028's own rule rather than an exception to it. A
 * regime is a pair - growth and roughness are taken together because a calm
 * market and a generous one are not independent. The FEE belongs to that pair.
 * REGIME_PRESETS compute growth and roughness from the Nifty 50 itself, so the
 * fund being modelled is one that tracks the Nifty 50, and the only coherent
 * fee is what such a fund charges. Charging an active manager's 1.75% on the
 * index's own return models a fund that takes the active fee and delivers the
 * passive result - a fund nobody sells and nobody would buy, and the most
 * pessimistic assumption available rather than the most honest one.
 *
 * The dearer plans remain, and choosing one is a real statement: it assumes a
 * manager who at least matches the index BEFORE their fee. The control says so.
 */
export const DEFAULT_FUND_COST = FUND_COST_PLANS.find((p) => p.id === 'index-direct')!;

/**
 * What choosing a costlier plan actually assumes, in the reader's words. Put on
 * the control itself: a fee is only separable from a return assumption if the
 * reader is told what they are implicitly assuming about the manager.
 */
export const ACTIVE_FUND_CAVEAT =
  'The growth here is the Nifty 50\'s own record, so an index fund is the ' +
  'matching choice. Picking an active fund assumes its manager at least keeps ' +
  'pace with the index before charging you — which most do not, over twenty years.';

/**
 * Exit load is NOT modelled, and this is the reason rather than an oversight.
 *
 * An exit load is charged on units redeemed inside a holding window - typically
 * 1% within 365 days. Modelling it faithfully needs unit-level lots and a
 * redemption order, which neither engine keeps.
 *
 * It is left out because on both of the journeys these pages describe it is
 * very close to nothing, not because it is hard. A saver accumulating for
 * twenty years redeems at the end, long outside any window. A retiree drawing
 * monthly from a corpus built years earlier sells the oldest units first, which
 * are also long outside it. The load bites when someone buys and sells inside a
 * year, which is neither of the plans on offer here.
 *
 * Stated on screen in those words. A cost we have decided not to model is a
 * thing the reader is entitled to know about, and "we left it out because it
 * rounds to zero for you" is an answer; silence is not.
 */
export const EXIT_LOAD_NOT_MODELLED =
  'Exit load is not included. It is charged when you sell within a year of ' +
  'buying — typically 1% — and on a plan this long you would be selling units ' +
  'bought many years earlier, so it would come to almost nothing.';

/** Look up a plan by id, falling back to the default rather than to zero. */
export function fundCostById(id: string | null | undefined): FundCostPlan {
  return FUND_COST_PLANS.find((p) => p.id === id) ?? DEFAULT_FUND_COST;
}
