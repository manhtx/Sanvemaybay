/**
 * True Cost & Epistemics facade.
 * Delegates directly to the canonical domain kernel in src/domain/farely/costEpistemics.ts
 * REQ-COST-001..005, NC-033, NODE TK-08 (Zero shadow architecture).
 */

export {
  type CostEpistemicState,
  type CostEpistemicStatus,
  type CostComponent,
  type FeeItem,
  type TrueCostEvaluation,
  type TrueCostInput,
  evaluateTrueCost
} from '../../domain/farely/costEpistemics';
